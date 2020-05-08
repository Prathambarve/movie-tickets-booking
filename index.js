'use strict';

const { Logger } = require('./engine/logger');
const { Application } = require('./engine/application');

const main = async () => {
  const app = new Application(9000);
  app.start();
}

main();

