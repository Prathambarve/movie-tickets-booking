'use strict';

const fs = require('fs');
const path = require('path');

const debounce = require('../helpers/debounce');

const fsp = fs.promises;

const APP_PATH = process.cwd();
const STATIC_DIR = path.join(APP_PATH, 'static');

const JSONRPC_ERRORS = {
  '-32700': {
    code: -32700,
    message: 'Parse error',
  },
  '-32600': {
    code: -32600,
    message: 'Invalid Request',
  },
  '-32601': {
    code: -32601,
    message: 'Method not found',
  },

  '-32602': {
    code: -32602,
    message: 'Invalid params',
  },
  '-32603': {
    code: -32603,
    message: 'Internal error',
  },
};

// Application class that handles server routing and file serving
class Application {
  constructor(config) {
    this.api = new Map();
    this.cache = new Map();

    this.config = config;

    this.cacheApi(path.join(APP_PATH, 'api'));
    this.cacheDir(STATIC_DIR);
  }

  // Cache api methods to Map
  // Hot reload for methods
  async cacheApi(dirPath) {
    const allFiles = await fsp.readdir(dirPath, { withFileTypes: true });
    for (const file of allFiles) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        await this.cacheApi(filePath);
      } else {
        const apiMethod = require(filePath);
        this.api.set(apiMethod.name, apiMethod);
      }
    }

    fs.watch(
      dirPath,
      debounce((_, f) => {
        const filePath = path.join(dirPath, f);
        // Invalidate require's cache, to get an updated version
        delete require.cache[require.resolve(filePath)];
        const apiMethod = require(filePath);
        this.api.set(apiMethod.name, apiMethod);

        this.logger.debug(filePath, 'changed, updating method: ', apiMethod.name);
      }, 1000),
    );
  }

  // Cache static file to Map object
  // Reload methods on change
  async cacheFile(filePath) {
    const fileName = filePath.slice(STATIC_DIR.length + 1);
    try {
      const fileData = await fsp.readFile(filePath, 'utf8');
      this.cache.set(fileName, fileData);
    } catch (err) {
      this.logger.error(err);
      if (err.code !== 'ENOENT') throw err;
    }
  }

  // Cache static files in a directory (recursive)
  // Reload files on change
  async cacheDir(dirPath) {
    const allFiles = await fsp.readdir(dirPath, { withFileTypes: true });
    for (const file of allFiles) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) await this.cacheDir(filePath);
      else await this.cacheFile(filePath);
    }

    fs.watch(
      dirPath,
      debounce((_, f) => {
        const filePath = path.join(dirPath, f);
        this.cacheFile(filePath);
      }, 1000),
    );
  }

  // Handles a single jsonrpc request object (validation, calls methods, notifications etc.)
  async apiCall(body) {
    const apiMethod = this.api.get(body.method);
    if (apiMethod === undefined) return { jsonrpc: '2.0', error: JSONRPC_ERRORS['-32601'], id: body.id || null };

    // If the method is a notification start running it and return
    if (apiMethod.type === 'notification') {
      apiMethod.handler(this, body.params);
      return;
    }

    // If the request does not have an id or it is not an int, return an error
    if (body.id === undefined || typeof body.id !== 'number') {
      return { jsonrpc: '2.0', error: JSONRPC_ERRORS['-32600'], id: null };
    }

    // If request has invalid params (it should be undefined or an 'object') return an invalid request error
    if (typeof body.params !== 'undefined' && typeof body.params !== 'object') {
      return { jsonrpc: '2.0', error: JSONRPC_ERRORS['-32600'], id: body.id };
    }

    try {
      const result = await apiMethod.handler(this, body.params);
      return { jsonrpc: '2.0', id: body.id, result };
    } catch (err) {
      return { jsonrpc: '2.0', id: body.id, error: err };
    }
  }

  async parseJsonBody(request) {
    return new Promise((resolve, reject) => {
      const body = [];
      request.on('data', chunk => {
        body.push(chunk);
      });

      request.on('end', async () => {
        const data = body.join('');
        try {
          const jsonResult = JSON.parse(data);
          resolve(jsonResult);
        } catch (err) {
          reject({ err, data });
        }
      });
    });
  }

  async parseApiCall(request) {
    return new Promise((resolve, reject) => {
      this.parseJsonBody(request)
        .then(body => {
          // Check if sent json is an array or an object
          if (typeof body !== 'object') reject({ jsonrpc: '2.0', error: JSONRPC_ERRORS['-32600'], id: null });
          resolve(body);
        })
        .catch(() => {
          reject({ jsonrpc: '2.0', error: JSONRPC_ERRORS['-32600'], id: null });
        });
    });
  }

  shutdown() {
    this.server.stop();
    this.db.close();
  }
}

module.exports = Application;
