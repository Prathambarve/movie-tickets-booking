'use strict';

const path = require('path');

const Logger = require('./engine/logger');
const Config = require('./engine/config');
const Server = require('./engine/server');
const Database = require('./engine/database');
const Application = require('./engine/application');
const dotenv = require('./utils/dotenv');

const APP_PATH = process.cwd();
const CONFIG_PATH = path.join(APP_PATH, 'conf');
const LOG_PATH = path.join(APP_PATH, 'logs');
const DOTENV_PATH = path.join(APP_PATH, '.env');

(async () => {
  await dotenv(DOTENV_PATH);

  const logger = new Logger(LOG_PATH);
  const config = await new Config(CONFIG_PATH).load();
  const app = new Application(config);

  Object.assign(app, { logger });

  app.db = new Database(config.get('database'), app);
  if ((await app.db.ping(5)) === false) process.exit(1);

  app.server = new Server(config.get('server'), app);

  const stop = async () => {
    logger.info('graceful shutdown');
    app.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  const logError = err => {
    logger.error(err.stack);
  };

  process.on('uncaughtException', logError);
  process.on('warning', logError);
  process.on('unhandledRejection', logError);
})();
