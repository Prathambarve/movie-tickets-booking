'use strict';

const pg = require('pg');

class Database {
  constructor(config, application) {
    this.application = application;
    this.pool = new pg.Pool(config.pg);
  }

  async query(sql, params = []) {
    this.application.logger.info(`sql: ${sql}` + (params.length > 0 ? ` with params ${params}` : ''));
    return this.pool.query(sql, params);
  }

  close() {
    this.pool.end();
  }
}

module.exports = Database;
