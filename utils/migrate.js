'use strict';

const fs = require('fs');
const path = require('path');

const dotenv = require('./dotenv');
const Database = require('../engine/database');
const Logger = require('../engine/logger');
const Config = require('../engine/config');

const fsp = fs.promises;

const APP_PATH = process.cwd();
const LOG_PATH = path.join(APP_PATH, 'logs');
const DOTENV_PATH = path.join(APP_PATH, '.env');
const CONFIG_PATH = path.join(APP_PATH, 'conf');
const MIGRATIONS_PATH = path.join(APP_PATH, 'sql');

// Read all migration files and return a Map object with them
const loadMigrations = async () => {
  const migrationFiles = await fsp.readdir(MIGRATIONS_PATH, { withFileTypes: true });
  const migrations = new Map();

  for (const file of migrationFiles) {
    // Get id and migration name of every file
    const { name, ext } = path.parse(file.name);
    if (ext !== '.sql') continue;
    const [id, mgName] = [name.slice(0, 3), name.slice(4)];

    // Check for duplicate id's
    if (migrations.get(id) !== undefined) throw `migrations must have unique id's; found duplicate: ${id}`;

    // Get sql code and set the migration to map
    const sqlCode = await fsp.readFile(path.join(MIGRATIONS_PATH, file.name), 'utf-8');
    migrations.set(id, { name: mgName, sql: sqlCode });
  }

  return migrations;
};

// Get id's of already ran migrations from database
const getRanMigrationIds = async db => {
  try {
    const response = await db.query('SELECT id FROM migrations');
    return response.rows.map(row => row.id);
  } catch {
    return [];
  }
};

// Run migrations
(async () => {
  await dotenv(DOTENV_PATH);

  // Create needed dependencies;
  const config = await new Config(CONFIG_PATH).load();
  const logger = new Logger(LOG_PATH);
  const db = new Database(config.get('database'), { logger });

  // Ping the database
  await db.query('select 1+1');

  // Get migration files and all ran migrations from db
  let migrationFiles;
  try {
    migrationFiles = await loadMigrations();
  } catch (err) {
    logger.error(err);
    db.close();
    return;
  }

  const ranMigrations = await getRanMigrationIds(db);

  // Exclude all ran migrations
  for (const id of ranMigrations) {
    migrationFiles.delete(id);
  }

  if (migrationFiles.size === 0) {
    logger.info('No new migrations detected.');
    db.close();
    return;
  }

  // Build the final sql code
  let finalSql = 'BEGIN;\n';
  for (const migration of migrationFiles.entries()) {
    finalSql += migration[1].sql;
    finalSql += `INSERT INTO migrations (id, name) VALUES ('${migration[0]}', '${migration[1].name}');\n`;
  }
  finalSql += 'COMMIT;';

  // If the code fails (syntax or logical error) the transaction will be rolled back
  // and all migrations will not be run
  try {
    await db.query(finalSql);
  } catch (err) {
    logger.error(err);
    await db.query('ROLLBACK;');
  }

  db.close();
})();
