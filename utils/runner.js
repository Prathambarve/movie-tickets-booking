'use strict';

/*
 * Script that spawns main application as a child process
 * and allows fast restarting of the app just by pressing the 'r' button
 * To quit press 'q' or 'ctrl+c'
 * */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const debounce = require('../helpers/debounce');

const APP_PATH = process.cwd();
const MAIN_FILE = path.join(APP_PATH, 'run.js');
const OPTIONS = { execArgv: ['--trace-warnings'] };

const auto = process.argv.indexOf('--auto') !== -1;

if (!auto) console.log("\x1b[45m'r' - restarts the script 'q' - quits\x1b[0m");

console.log('\x1b[45m  Runner started  \x1b[0m');

let proc = cp.fork(MAIN_FILE, OPTIONS);

// Automatically restart server on file change
if (auto) {
  fs.watch(
    APP_PATH,
    debounce((_, f) => {
      console.log(`\x1b[45m${f} changed\x1b[0m`);
      console.log('\x1b[45m  Runner restarted  \x1b[0m');
      proc.kill('SIGTERM');
      proc = cp.fork(MAIN_FILE, OPTIONS);
    }, 1000),
  );
} else {
  // Press 'r' to restart
  const stdin = process.stdin;
  stdin.setEncoding('utf-8');
  stdin.setRawMode(true);
  stdin.resume();

  stdin.on('data', key => {
    if (key === '\u0003' || key === 'q') {
      proc.kill('SIGTERM');
      process.exit(0);
    } else if (key === 'r') {
      proc.kill('SIGTERM');
      console.log('\x1b[45m  Runner restarted  \x1b[0m');
      proc = cp.fork(MAIN_FILE, OPTIONS);
    }
  });
}
