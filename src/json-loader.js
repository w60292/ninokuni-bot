'use strict';

/**
 * Load Line Message API Configuration from JSON
 **/
const fs = require('fs');
const { path } = require('./constant.js');

module.exports.loadConfig = () => {
  try {
    const raw = fs.readFileSync(path);
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Occurs exception while loading ${path}`, e);
  }
};