'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');

const COLORS = {
  info: { fg: '\x1b[36m', bg: '\x1b[46m' },
  debug: { fg: '\x1b[33m', bg: '\x1b[43m' },
  error: { fg: '\x1b[31m', bg: '\x1b[41m' },
};

// Class responsible for logging
class Logger {
  constructor(logDirectory) {
    const logFile = path.join(logDirectory, `${new Date().toISOString().slice(0, 10)}.log`);
    this.fileStream = fs.createWriteStream(logFile, { flags: 'a' });
  }

  write(level, msg) {
    const date = new Date().toISOString();
    const color = COLORS[level];
    const line = `${color.bg}${level.toUpperCase()}\x1b[0m ${color.fg}${date}\t${msg}\x1b[0m\n`;
    if (level === 'error') {
      process.stderr.write(line);
    } else {
      process.stdout.write(line);
    }

    const logObj = { level, date, msg };
    this.fileStream.write(JSON.stringify(logObj) + ',\n');
  }

  info(...args) {
    const msg = util.format(args);
    this.write('info', msg);
  }

  debug(...args) {
    const msg = util.format(args);
    this.write('debug', msg);
  }

  error(...args) {
    const msg = util.format(args);
    this.write('error', msg);
  }
}

module.exports = { Logger };
