'use strict';


// Class responsible for logging
// takes in stdout (info, debug etc.) and stderr (errors) objects that must implement .write method
class Logger {
  constructor(stdout, stderr) {
    this.stdout = stdout;
    this.stderr = stderr || stdout;
  }

  info(...args) {
    this.stdout.write('INFO\t' + args.map(a => String(a)).join(' ') + '\n');
  }

  debug(...args) {
    this.stdout.write('DEBUG\t' + args.map(a => String(a)).join(' ') + '\n');
  }

  error(...args) {
    this.stderr.write('ERROR\t' + args.map(a => String(a)).join(' ') + '\n');
  }
}

module.exports = { Logger };

