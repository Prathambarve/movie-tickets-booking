'use strict';

import { Server } from './engine/server.js';
import { Application } from './engine/application.js';

const main = async () => {
  const app = new Application();
  const server = new Server('127.0.0.1', 9000, app);
  server.start();
};

main();
