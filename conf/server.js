'use strict';

module.exports = {
  host: process.env.HOSTNAME || '127.0.0.1',
  port: !isNaN(parseInt(process.env.PORT)) ? process.env.PORT : 9000,
};
