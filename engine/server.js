'use strict';

const url = require('url');
const http = require('http');
const path = require('path');

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

class Server {
  constructor(config, application) {
    this.port = config.port;
    this.hostname = config.hostname;
    this.application = application;
    this.instance = http.createServer(this.listener(application));
    this.instance.listen(this.port, this.hostname);
    this.application.logger.info(`server on ${this.hostname}:${this.port}`);
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
    const fileMimeType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

    const data = this.application.cache.get(fileName);
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

    // Parse and validate body
    let body;
    try {
      body = await this.application.parseApiCall(request);
    } catch (err) {
      response.end(JSON.stringify(err));
      return;
    }

    // If request body is an array, handle each object in the array on its own
    let result;
    if (Array.isArray(body)) {
      result = [];
      for (const r of body) {
        const methodResult = await this.application.apiCall(r);
        if (methodResult !== undefined) result.push(methodResult);
      }
    } else result = await this.application.apiCall(body);

    if (result === undefined || result.length === 0) response.end();
    else response.end(JSON.stringify(result));
  }

  listener() {
    return async (request, response) => {
      // Convert query url (?key=value) to js object ({ key: value }) and remove trailing slash from pathname
      let { pathname, query } = new url.URL(`http://127.0.0.1${request.url}`);

      if (pathname !== '/' && pathname[pathname.length - 1] === '/') {
        pathname = pathname.slice(0, -2);
      }
      request.pathname = pathname;

      if (typeof query === 'string') {
        request.query = Object.fromEntries(query.split('&').map(q => q.split('=')));
      } else {
        request.query = '';
      }
      // Route to the appropriate function
      if (pathname.startsWith('/static/')) {
        this.serveStatic(request, response);
      } else if (pathname === '/api') {
        this.serveApi(request, response);
      } else {
        this.serveHtml(request, response);
      }
    };
  }

  stop() {
    this.instance.close(err => {
      if (err) {
        this.application.logger.error(err.stack);
      }
    });
  }
}

module.exports = Server;
