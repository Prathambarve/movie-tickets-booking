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

  const config = await new Config(CONFIG_PATH).load();
  const logger = new Logger(LOG_PATH);
  const app = new Application(config);

  Object.assign(app, { logger });

  app.db = new Database(config.get('database'), app);
  // Ping the database (will throw an error if unsuccessful)
  await app.db.query('select 1+1 as sum');

  app.server = new Server(config.get('server'), app);

  const stop = async () => {
    logger.info('graceful shutdown');
    app.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})();
