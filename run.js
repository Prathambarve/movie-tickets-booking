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
  const logger = new Logger(LOG_PATH);
  try {
    await dotenv(DOTENV_PATH);
  } catch (err) {
    logger.error(err);
  }

  const config = await new Config(CONFIG_PATH).load();
  const app = new Application(config);

  Object.assign(app, { logger });

  app.db = new Database(config.get('database'), app);

  for (let i = 0; ; i++)
    try {
      await app.db.query('select 1+1');
      break;
    } catch (err) {
      if (i > 3) {
        logger.error('Could not connect to db: ', err);
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 4000));
    }

  app.server = new Server(config.get('server'), app);

  const stop = async () => {
    logger.info('graceful shutdown');
    app.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})();
