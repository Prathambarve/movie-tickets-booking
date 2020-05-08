'use strict';

const fs = require('fs');
const url = require('url');
const http = require('http');
const path = require('path');


// Application class that handles server routing and file serving
class Application {
  constructor(port) {
    this.port = parseInt(port, 10);
    this.server = http.createServer(this.serverHandler);
  }

  // Basic server routing
  serverHandler(request, response) {
    // Convert query url (?key=value) to js object ({ key: value })
    const { pathname, query } = url.parse(request.url);
    request.pathname = pathname;
    request.query = Object.fromEntries(query.split('&').map(q => q.split('=')));

    // Route to the appropriate function
    if (pathname.startsWith('/static/')) {
      this.serverStatic(request, response)
      return;
    }

    response.write(`hi there!\n${pathname}`);
    response.end();
  }

  // Function that finds and serves a static file
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

