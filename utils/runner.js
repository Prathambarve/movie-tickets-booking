'use strict';

/*
 * Script that spawns main application as a child process
 * and allows fast restarting of the app just by pressing the 'r' button
 * To quit press 'q' or 'ctrl+c'
 * Running with --auto will automatically restart the server if it sees a file change
 * On linux systems script cannot watch files recursively
 * */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const debounce = require('../helpers/debounce');

const APP_PATH = process.cwd();
const MAIN_FILE = path.join(APP_PATH, 'run.js');
const OPTIONS = { execArgv: ['--trace-warnings'] };
const WATCHED_EXTENSIONS = ['.js', '.env', '.sql'];
const IGNORED_DIRS = ['node_modules', 'api', 'static', 'sql', '.git', '.githooks'];

const auto = process.argv.indexOf('--auto') !== -1;

if (!auto) console.log('\x1b[32mr - restarts the script q - quits\x1b[0m');

console.log('\x1b[32m  Runner started  \x1b[0m');

let proc = cp.fork(MAIN_FILE, OPTIONS);

// Auto server does not work on linux, because 'recursive' option is not available on linux
// https://nodejs.org/api/fs.html#fs_caveats
// If system is linux, disable recursive
const recursive = process.platform !== 'linux';

// Automatically restart server on file change
if (auto) {
  fs.watch(
    APP_PATH,
    { recursive },
    debounce((_, f) => {
      const { ext, dir } = path.parse(f);
      // Only restart the server if it is a watched extensions and not ignored directory
      if (WATCHED_EXTENSIONS.indexOf(ext) !== -1 && IGNORED_DIRS.indexOf(dir.split('/')[1]) === -1) {
        console.log(`\x1b[32m${f} changed\x1b[0m`);
        console.log('\x1b[32m  Runner restarted  \x1b[0m');
        proc.kill('SIGTERM');
        proc = cp.fork(MAIN_FILE, OPTIONS);
      }
    }, 1000),
  );
} else {
  // Press 'r' to restart
  // 'q' to quit
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
      console.log('\x1b[32m  Runner restarted  \x1b[0m');
      proc = cp.fork(MAIN_FILE, OPTIONS);
    }
  });
}
