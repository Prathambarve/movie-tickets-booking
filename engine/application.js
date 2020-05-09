'use strict';

import fs from 'fs';
import path from 'path';

import { Logger } from './logger.js';

const APP_PATH = process.cwd();
const MIME_TYPES = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// Application class that handles server routing and file serving
export class Application {
  constructor() {
    this.logger = new Logger(path.join(APP_PATH, 'logs'));
  }

  notFound(response) {
    response.writeHead(404);
    response.end('page not found', 'utf-8');
  }

  serverError(response, err) {
    this.logger.error(err);
    response.writeHead(500);
    response.end('internal server error', 'utf-8');
  }

  // Function that finds and serves a static file
  async static(request, response) {
    const fileName = request.pathname.replace('/static/', '');
    const filePath = path.join(APP_PATH, 'static', fileName);
    const fileMimeType =
      MIME_TYPES[path.extname(filePath).toLowerCase()] ||
      'application/octet-stream';

    try {
      const file = await fs.promises.readFile(filePath);
      response.writeHead(200, { 'Content-Type': fileMimeType });
      response.end(file, 'utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        this.notFound(response);
      } else {
        this.serverError(response, err);
      }
    }
  }

  // Function that renders html to the user
  html(request, response) {
    response.write('serving html files');
    response.end();
  }

  // Function that is responsible for handling /api route
  // following json rpc 2.0 specification (check readme.md for specification link)
  api(request, response) {
    response.write('serving api routes');
    response.end();
  }
}
