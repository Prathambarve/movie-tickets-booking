'use strict';

const path = require('path');

const Logger = require('./engine/logger');
const Config = require('./engine/config');
const Server = require('./engine/server');
const Application = require('./engine/application');

const APP_PATH = process.cwd();
const CONFIG_PATH = path.join(APP_PATH, 'conf');
const LOG_PATH = path.join(APP_PATH, 'logs');

(async () => {
  const config = await new Config(CONFIG_PATH).load();
  const logger = new Logger(LOG_PATH);
  const app = new Application(config);

  Object.assign(app, { logger });

  app.server = new Server(config.get('server').host, config.get('server').port, app);

  const stop = async () => {
    logger.info('graceful shutdown');
    app.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})();
