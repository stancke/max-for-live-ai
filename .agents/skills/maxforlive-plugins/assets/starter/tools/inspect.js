#!/usr/bin/env node
'use strict';

/**
 * Inspeciona um .amxd: tipo, tamanho, chunks, classes, parâmetros e devicewidth.
 *
 *   node tools/inspect.js "dist/M4L Gain.amxd"
 */

const path = require('path');
const { describeAmxd } = require('../src/amxd');

const file = process.argv[2];
if (!file) {
  console.error('Uso: node tools/inspect.js <arquivo.amxd>');
  process.exit(1);
}

const info = describeAmxd(path.resolve(file));
console.log(JSON.stringify(info, null, 2));
