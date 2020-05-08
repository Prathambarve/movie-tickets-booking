'use strict';

const fs = require('fs');
const url = require('url');
const http = require('http');
const path = require('path');


class Application {
  constructor(port) {
    this.port = parseInt(port, 10);
    this.server = http.createServer(this.serverHandler);
  }

  serverHandler(request, response) {
    const { pathname, query } = url.parse(request.url);
    request.pathname = pathname;
    request.query = Object.fromEntries(query.split('&').map(q => q.split('=')));

    console.log(request.pathname, request.query);

    // Route to the appropriate function
    if (pathname.startsWith('/static/')) {
      this.serverStatic(request, response)
      return;
    }

    response.write(`hi there!\n${pathname}`);
    response.end();
  }

  serveStatic(request, response) {
    response.write('serving static files');
    response.end();
  }

  start() {
    this.server.listen(this.port);
    console.log(`Server started on port ${this.port}`);
  }
}

module.exports = { Application };

