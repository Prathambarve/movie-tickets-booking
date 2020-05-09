'use strict';

import fs from 'fs';
import path from 'path';
import http from 'http';

import { Server } from './server.js';
import { Logger } from './logger.js';

const fsp = fs.promises;

const APP_PATH = process.cwd();
const STATIC_DIR = path.join(APP_PATH, 'static');

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

// Application class that handles server routing and file serving
export class Application {
  constructor(host, port) {
    this.logger = new Logger(path.join(APP_PATH, 'logs'));
    this.api = new Map();
    this.cache = new Map();

    this.cacheApi();
    this.cacheDir(STATIC_DIR);

    this.server = new Server(host, port, this);
  }

  async cacheApi() {
    console.log('cached api');
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

    fs.watch(dirPath, (e, f) => {
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

  // Function that finds and serves a static file
  serveStatic(request, response) {
    const fileName = request.pathname.replace('/static/', '');
    const filePath = path.join(STATIC_DIR, fileName);
    const fileMimeType =
      MIME_TYPES[path.extname(filePath).toLowerCase()] ||
      'application/octet-stream';

    const data = this.cache.get(fileName);
    if (data) {
      response.writeHead(200, { 'Content-Type': fileMimeType });
      response.end(data);
    } else {
      this.error(response, 404);
    }
  }

  // Function that renders html to the user
  serveHtml(request, response) {
    response.write('serving html files');
    response.end();
  }

  // Function that is responsible for handling /api route
  // following json rpc 2.0 specification (check readme.md for specification link)
  serveApi(request, response) {
    response.write('serving api routes');
    response.end();
  }

  run() {
    this.server.start();
  }
}
