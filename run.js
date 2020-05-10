'use strict';

const path = require('path');

const Config = require('./engine/config');
const Application = require('./engine/application');

const CONFIG_PATH = path.join(process.cwd(), 'conf');

const main = async () => {
  const config = await new Config(CONFIG_PATH).load();
  const app = new Application(config);

  const stop = async () => {
    app.logger.info('graceful shutdown');
    app.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
};

main();
