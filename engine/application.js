'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const { Server } = require('./server');
const { Logger } = require('./logger');
const debounce = require('../helpers/debounce');

const fsp = fs.promises;

const APP_PATH = process.cwd();
const STATIC_DIR = path.join(APP_PATH, 'static');
const API_DIR = path.join(APP_PATH, 'api');

const MIME_TYPES = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
};

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
  constructor(host, port) {
    this.logger = new Logger(path.join(APP_PATH, 'logs'));
    this.api = new Map();
    this.cache = new Map();

    this.cacheApi(API_DIR);
    this.cacheDir(STATIC_DIR);

    this.server = new Server(host, port, this);
  }

  // Cache api methods to Map
  // Hot reload for methods
  async cacheApi(dirPath) {
    const allFiles = await fsp.readdir(dirPath, { withFileTypes: true });
    for (const file of allFiles) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) await this.cacheApi(filePath);
      else {
        const apiMethod = require(filePath);
        this.api.set(apiMethod.name, apiMethod);
      }
    }

    const a = this;
    fs.watch(
      dirPath,
      debounce((_, f) => {
        const filePath = path.join(dirPath, f);
        // Invalidate require's cache, to get an updated version
        delete require.cache[require.resolve(filePath)];
        const apiMethod = require(filePath);
        a.api.set(apiMethod.name, apiMethod);

        a.logger.debug(filePath, 'changed, updating method: ', apiMethod.name);
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
      if (file.isDirectory()) {
        await this.cacheDir(filePath);
      } else {
        await this.cacheFile(filePath);
      }
    }

    fs.watch(dirPath, (_, f) => {
      const filePath = path.join(dirPath, f);
      this.cacheFile(filePath);
    });
  }

  error(response, code, err) {
    if (err !== undefined) {
      this.logger.error(err);
    }

    response.writeHead(code, { 'Content-Type': 'text/plain' });
    response.end(http.STATUS_CODES[code] + '\n', 'utf-8');
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

  // Function that finds and serves a static file
  serveStatic(request, response) {
    const fileName = request.pathname.replace('/static/', '');
    const filePath = path.join(STATIC_DIR, fileName);
    const fileMimeType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

    const data = this.cache.get(fileName);
    if (data) {
      response.writeHead(200, { 'Content-Type': fileMimeType });
      response.end(data);
    } else {
      this.error(response, 404);
    }
  }

  // Function that renders html to the user
  serveHtml(_, response) {
    response.write('serving html files');
    response.end();
  }

  // Handles a single jsonrpc request object (validation, calls methods, notifications etc.)
  async apiCall(body) {
    const apiMethod = this.api.get(body.method);
    if (apiMethod === undefined) return { jsonrpc: '2.0', error: JSONRPC_ERRORS['-32601'], id: body.id || null };

    // If the method is a notification start running it and return
    if (apiMethod.type === 'notification') {
      apiMethod.handler(this, body);
      return;
    }

    // If the request does not have an id or it is not an int, return an error
    if (body.id === undefined || typeof body.id !== 'number') {
      return { jsonrpc: '2.0', error: JSONRPC_ERRORS['-32600'], id: null };
    }

    // If request has invalid params (it should be undefined or an 'object') return an invalid request error
    if (typeof body.params !== undefined && typeof body.params !== 'object') {
      return { jsonrpc: '2.0', error: JSONRPC_ERRORS['-32600'], id: body.id };
    }

    const result = await apiMethod.handler(this, body);
    return result;
  }

  // Function that is responsible for handling /api route
  // following json rpc 2.0 specification (check readme.md for specification link)
  async serveApi(request, response) {
    if (request.method !== 'POST') {
      this.error(response, 405);
      return;
    }

    let body;

    try {
      body = await this.parseJsonBody(request);
    } catch (err) {
      this.logger.error(err.err.stack, err.data);
      response.end(JSON.stringify({ jsonrpc: '2.0', error: JSONRPC_ERRORS['-32700'], id: null }));
      return;
    }

    // Check if sent json is an array or an object
    if (typeof body !== 'object') {
      response.end(JSON.stringify({ jsonrpc: '2.0', error: JSONRPC_ERRORS['-32600'], id: null }));
      return;
    }

    // if request body is an array, handle each object in the array on its own
    let result;
    if (Array.isArray(body)) {
      result = [];
      for (const r of body) {
        const methodResult = await this.apiCall(r);
        if (methodResult !== undefined) result.push(methodResult);
      }
    } else result = await this.apiCall(body);

    if (result === undefined || result.length === 0) response.end();
    else response.end(JSON.stringify(result));
  }

  shutdown() {
    this.server.stop();
  }
}

module.exports = { Application };
