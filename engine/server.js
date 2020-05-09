'use strict';

import url from 'url';
import http from 'http';

export class Server {
  constructor(hostname, port, application) {
    this.port = port;
    this.hostname = hostname;
    this.application = application;
    this.instance = http.createServer(this.listener(application));
  }

  listener(application) {
    return async (request, response) => {
      // Convert query url (?key=value) to js object ({ key: value })
      let { pathname, query } = new url.URL(`http://127.0.0.1${request.url}`);

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
        await application.serveStatic(request, response);
      } else if (pathname === '/api') {
        application.serveApi(request, response);
      } else {
        application.serveHtml(request, response);
      }
    };
  }

  start() {
    this.instance.listen(this.port, this.hostname);
    this.application.logger.info(`server on ${this.hostname}:${this.port}`);
  }
}
