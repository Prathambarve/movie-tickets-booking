const fs = require('fs');
const path = require('path');

const fsp = fs.promises;

// Config class
// After loading returns a map with sections as keys
class Config {
  constructor(configPath) {
    this.configPath = configPath;
    this.conf = new Map();
  }

  async load() {
    const allFiles = await fsp.readdir(this.configPath, { withFileTypes: true });
    for (const file of allFiles) {
      await this.loadFile(file.name);
    }

    return this.conf;
  }

  async loadFile(file) {
    const { name, ext } = path.parse(file);
    if (ext !== '.js') return;
    const configFile = require(path.join(this.configPath, file));
    this.conf.set(name, configFile);
  }
}

module.exports = Config;
