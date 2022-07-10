/**
 * Load Line Message API Configuration from JSON
 */
const fs = require('fs');
const { configPath } = require('./constant');

const loadJSON = (path) => {
  try {
    const raw = fs.readFileSync(path);
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Occurs exception while loading ${path}: `, e);
    return null;
  }
};

module.exports.loadConfig = () => loadJSON(configPath);
