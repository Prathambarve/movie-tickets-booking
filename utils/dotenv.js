'use strict';

const fs = require('fs');

const fsp = fs.promises;
const ENV_REGEXP = /^.+=.+$/;

// Function that loads .env file with a given path
module.exports = async envPath => {
  fs.access(envPath, fs.F_OK, async err => {
    if (err) return;

    const fileContents = await fsp.readFile(envPath, 'utf-8');
    fileContents.split('\n').forEach(line => {
      if (line === '') return;

      // Strip all the comments
      line.replace(/#.*$/, '');
      line = line.trim();

      if (!ENV_REGEXP.test(line)) throw 'invalid .env';

      const [name, value] = line.split('=');
      process.env[name] = value;
    });
  });
};
