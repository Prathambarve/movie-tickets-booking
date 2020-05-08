'use strict';

const fs = require('fs');
const url = require('url');
const http = require('http');
const path = require('path');

const { Logger } = require('./logger');

const APP_PATH = process.cwd();

// Application class that handles server routing and file serving
class Application {
  constructor(port) {
    this.port = parseInt(port, 10);
    this.logger = new Logger(path.join(APP_PATH, 'logs'));
    this.server = http.createServer(this.serverHandler());
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
  async serveStatic(request, response) {
    const fileName = request.pathname.replace('/static/', '');
    const filePath = path.join(__dirname, '..', 'static', fileName);
    const fileMimeType =
      {
        '.js': 'text/javascript',
        '.css': 'text/css',
      }[String(path.extname(filePath)).toLowerCase()] ||
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

  // Basic server routing
  serverHandler() {
    const self = this;

    return async function (request, response) {
      // Convert query url (?key=value) to js object ({ key: value })
      let { pathname, query } = url.parse(request.url);

      if (pathname !== '/' && pathname[pathname.length - 1] === '/') {
        pathname = pathname.slice(0, -2);
      }

      request.pathname = pathname;

      if (typeof query === 'string') {
        request.query = Object.fromEntries(
          query.split('&').map(q => q.split('=')),
        );
      } else {
        request.query = '';
      }

      // Route to the appropriate function
      if (pathname.startsWith('/static/')) {
        await self.serveStatic(request, response);
      } else if (pathname === '/api' || pathname === '/api/') {
        self.serveApi(request, response);
      } else {
        self.serveHtml(request, response);
      }
    };
  }

  start() {
    this.server.listen(this.port);
    this.logger.info(`server started on port ${this.port}`);
  }
}

module.exports = { Application };
