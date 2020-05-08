'use strict';

const { Logger } = require('./engine/logger');
const { Application } = require('./engine/application');

const main = async () => {
  const logger = new Logger(process.stdout, process.stderr);
  const app = new Application(9000, logger);
  app.start();
}

main();

