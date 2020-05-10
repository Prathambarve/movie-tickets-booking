'use strict';

const url = require('url');
const http = require('http');

class Server {
  constructor(hostname, port, application) {
    this.port = port;
    this.hostname = hostname;
    this.application = application;
    this.instance = http.createServer(this.listener(application));
    this.instance.listen(this.port, this.hostname);
    this.application.logger.info(`server on ${this.hostname}:${this.port}`);
  }

  listener(application) {
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
        await application.serveStatic(request, response);
      } else if (pathname === '/api') {
        application.serveApi(request, response);
      } else {
        application.serveHtml(request, response);
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
