'use strict';

const { Application } = require('./engine/application');

const app = new Application('127.0.0.1', 9000);

const stop = async () => {
  app.logger.info('graceful shutdown');
  app.shutdown();
  process.exit(0);
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
