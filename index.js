'use strict';

import { Application } from './engine/application.js';

const app = new Application('127.0.0.1', 9000);

const stop = async () => {
  app.logger.info('gracefull shutdown');
  app.shutdown();
  process.exit(0);
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
