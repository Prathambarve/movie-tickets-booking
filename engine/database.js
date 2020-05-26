'use strict';

const pg = require('pg');

class Database {
  constructor(connectionString, application) {
    this.application = application;
    this.pool = new pg.Pool({ connectionString });
  }

  // A function to ping the database n times with 4 seconds in between tries
  async ping(times) {
    for (let i = 0; i < times; i++) {
      try {
        await this.application.db.query('select 1+1');
        return true;
      } catch (err) {
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    }

    this.application.logger.error('Database ping error');
    return false;
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
