'use strict';

/**
 * Load Line Message API Configuration from JSON
 **/
const fs = require('fs');
const { configPath } = require('./constant.js');

const loadJSON = (path) => {
  try {
    const raw = fs.readFileSync(path);
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Occurs exception while loading ${path}`, e);
  }
};

module.exports.loadConfig = () => {
  return loadJSON(configPath);
};
