'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const { Server } = require('./server');
const { Logger } = require('./logger');

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

const JSONRC_ERRORS = {
  '-32700': {
    code: -32700,
    message: 'Parse error',
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
  }

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
          reject(err);
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
      this.logger.error(err.stack);
      response.end(JSON.stringify({ jsonrpc: '2.0', error: JSONRC_ERRORS['-32700'], id: null }));
      return;
    }

    // TODO: Change all errors to normal ones
    if (body.jsonrpc !== '2.0') {
      response.end(JSON.stringify({ jsonrpc: '2.0', err: true }));
      return;
    }

    const apiMethod = this.api.get(body.method);

    if (apiMethod === undefined) {
      response.end(JSON.stringify({ jsonrpc: '2.0', err: true }));
      return;
    }

    const result = apiMethod.method(body);
    response.end(JSON.stringify(result));
  }

  shutdown() {
    this.server.stop();
  }
}

module.exports = { Application };
