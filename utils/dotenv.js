'use strict';

const fs = require('fs');

const fsp = fs.promises;
const ENV_REGEXP = /^.+=.+$/;

// Function that loads .env file with a given path
module.exports = async envPath => {
  const fileContents = await fsp.readFile(envPath, 'utf-8');
  fileContents.split('\n').forEach(line => {
    line = line.trim();
    if (line === '') return;
    if (line.startsWith('#')) return;
    if (!ENV_REGEXP.test(line)) throw 'invalid .env';

    const [name, value] = line.split('=');
    process.env[name] = value;
  });
};
