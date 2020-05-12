'use strict';

/*
 * Script that spawns main application as a child process
 * and allows fast restarting of the app just by pressing the 'r' button
 * To quit press 'q' or 'ctrl+c'
 * */

const cp = require('child_process');
const path = require('path');

const MAIN_FILE = path.join(process.cwd(), 'run.js');
const OPTIONS = { execArgv: ['--trace-warnings'] };

const stdin = process.stdin;

stdin.setEncoding('utf-8');
stdin.setRawMode(true);
stdin.resume();

console.log("\x1b[45m'r' - restarts the script 'q' - quits\x1b[0m");
console.log('\x1b[45m  Runner started  \x1b[0m');

let proc = cp.fork(MAIN_FILE, OPTIONS);

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

