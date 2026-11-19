#!/usr/bin/env node
'use strict';

/**
 * CLI de build dos devices.
 *
 *   node build.js                 -> compila todos os devices de ./devices
 *   node build.js m4l-gain        -> compila um device pelo slug
 *   node build.js --list          -> lista devices disponíveis
 *   node build.js --inspect FILE  -> mostra informações de um .amxd
 */

const fs = require('fs');
const path = require('path');
const { writeAmxd, describeAmxd, normalizeDeviceType } = require('./src/amxd');

const ROOT = __dirname;
const DEVICES_DIR = path.join(ROOT, 'devices');
const DIST_DIR = path.join(ROOT, 'dist');

function listDeviceFiles() {
  if (!fs.existsSync(DEVICES_DIR)) return [];
  return fs
    .readdirSync(DEVICES_DIR)
    .filter((file) => file.endsWith('.js'))
    .sort();
}

function loadDevices() {
  return listDeviceFiles().map((file) => {
    const mod = require(path.join(DEVICES_DIR, file));
    if (!mod.slug || typeof mod.build !== 'function') {
      throw new Error(`Device inválido em devices/${file}: exporte { slug, name, type, build }`);
    }
    return mod;
  });
}

function buildDevice(device) {
  const type = normalizeDeviceType(device.type);
  const wrapper = device.build();
  const safeName = device.name || device.slug;
  const outFile = path.join(DIST_DIR, `${safeName}.amxd`);
  const bytes = writeAmxd(outFile, wrapper, { deviceType: type });
  for (const dependency of device.dependencies || []) {
    fs.copyFileSync(path.join(ROOT, dependency), path.join(DIST_DIR, path.basename(dependency)));
  }

  // Valida relendo o arquivo recém-gerado.
  const info = describeAmxd(outFile);

  console.log(`\n✔ ${safeName}`);
  console.log(`  tipo:       ${type}`);
  console.log(`  arquivo:    ${path.relative(ROOT, outFile)} (${bytes} bytes)`);
  console.log(`  boxes:      ${info.boxCount} | linhas: ${info.lineCount}`);
  console.log(`  parâmetros: ${info.parameters.length}`);
  for (const param of info.parameters) {
    const range = param.min == null && param.max == null ? '' : ` [${param.min ?? 0} .. ${param.max ?? 1}]`;
    console.log(`    - ${param.longname}${range}`);
  }

  return outFile;
}

function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--list') {
    for (const device of loadDevices()) {
      console.log(`${device.slug.padEnd(24)} ${device.type.padEnd(14)} ${device.name}`);
    }
    return;
  }

  if (args[0] === '--inspect') {
    const file = args[1];
    if (!file) {
      console.error('Uso: node build.js --inspect <arquivo.amxd>');
      process.exit(1);
    }
    console.log(JSON.stringify(describeAmxd(path.resolve(file)), null, 2));
    return;
  }

  const devices = loadDevices();
  const selected = args.length
    ? devices.filter((device) => args.includes(device.slug) || args.includes(device.name))
    : devices;

  if (!selected.length) {
    console.error(`Nenhum device encontrado para: ${args.join(', ')}`);
    console.error('Use --list para ver os slugs disponíveis.');
    process.exit(1);
  }

  fs.mkdirSync(DIST_DIR, { recursive: true });
  for (const device of selected) buildDevice(device);

  console.log(`\nBuild concluído em ${path.relative(ROOT, DIST_DIR)}/`);
}

main();
