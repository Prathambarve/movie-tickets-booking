'use strict';

import { Application } from './engine/application.js';

const main = async () => {
  const app = new Application('127.0.0.1', 9000);
  app.run();
};

main();
