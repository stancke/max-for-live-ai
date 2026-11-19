#!/usr/bin/env node
'use strict';

/**
 * Validador dos devices: compila em memória e checa o container, os parâmetros,
 * as conexões e os limites da UI antes de gerar o .amxd.
 *
 *   node tools/validate.js
 */

const fs = require('fs');
const path = require('path');
const {
  packAmxd,
  unpackAmxd,
  normalizeDeviceType,
  DEVICE_TYPES,
} = require('../src/amxd');

const ROOT = path.join(__dirname, '..');
const DEVICES_DIR = path.join(ROOT, 'devices');
const DEVICE_HEIGHT = 170;

const errors = [];
const warnings = [];

function fail(device, message) {
  errors.push(`[${device}] ${message}`);
}

function warn(device, message) {
  warnings.push(`[${device}] ${message}`);
}

function loadDevices() {
  return fs
    .readdirSync(DEVICES_DIR)
    .filter((file) => file.endsWith('.js'))
    .sort()
    .map((file) => {
      const mod = require(path.join(DEVICES_DIR, file));
      if (!mod.slug || typeof mod.build !== 'function') {
        throw new Error(`devices/${file} não exporta { slug, name, type, build }`);
      }
      return { ...mod, file };
    });
}

function validateDevice(device) {
  const name = device.slug;
  const type = normalizeDeviceType(device.type);
  const wrapper = device.build();

  // 1. Container: empacota e desempacota de novo.
  let parsed;
  try {
    parsed = unpackAmxd(packAmxd(wrapper, { deviceType: type }));
  } catch (error) {
    fail(name, `container inválido: ${error.message}`);
    return;
  }

  if (parsed.deviceType !== type) {
    fail(name, `device type ${parsed.deviceType} != ${type}`);
  }

  const patcher = parsed.patcher.patcher || parsed.patcher;

  if (!patcher.project) {
    fail(name, 'bloco project ausente');
  } else if (patcher.project.amxdtype !== DEVICE_TYPES[type].amxdtype) {
    fail(name, 'project.amxdtype não corresponde ao tipo');
  }

  if (!patcher.openinpresentation) {
    warn(name, 'openinpresentation != 1: o Live pode não mostrar a UI');
  }

  // 2. Boxes: ids únicos, retângulos válidos, presentation dentro do strip.
  const boxes = new Map();
  for (const entry of patcher.boxes || []) {
    const box = entry.box;
    if (!box || !box.id) {
      fail(name, 'caixa sem id');
      continue;
    }
    if (boxes.has(box.id)) fail(name, `id duplicado: ${box.id}`);
    boxes.set(box.id, box);

    if (!box.maxclass) fail(name, `${box.id} sem maxclass`);
    if (box.patching_rect && box.patching_rect.length !== 4) {
      fail(name, `${box.id} patching_rect inválido`);
    }

    if (box.presentation) {
      const rect = box.presentation_rect;
      if (!rect || rect.length !== 4) {
        fail(name, `${box.id} em presentation sem presentation_rect`);
        continue;
      }
      if (rect.some((v) => !Number.isInteger(v))) {
        fail(name, `${box.id} presentation_rect fracionário: ${rect}`);
      }
      if (rect[0] < 0 || rect[1] < 0) {
        warn(name, `${box.id} presentation_rect com coordenada negativa: ${rect}`);
      }
      if (rect[0] + rect[2] > patcher.devicewidth + 1) {
        fail(name, `${box.id} passa da largura do device (${patcher.devicewidth}px)`);
      }
      if (rect[1] + rect[3] > DEVICE_HEIGHT) {
        fail(name, `${box.id} passa da altura útil (${DEVICE_HEIGHT}px)`);
      }
    }
  }

  // 3. Linhas: ids existentes e índices de porta válidos.
  for (const entry of patcher.lines || []) {
    const line = entry.patchline;
    if (!line) {
      fail(name, 'patchline vazia');
      continue;
    }
    const [srcId, srcOutlet] = line.source || [];
    const [dstId, dstInlet] = line.destination || [];
    const src = boxes.get(srcId);
    const dst = boxes.get(dstId);

    if (!src) {
      fail(name, `linha com origem inexistente: ${srcId}`);
    } else if (srcOutlet >= (src.numoutlets || 0)) {
      fail(name, `saída ${srcOutlet} inexistente em ${srcId} (${src.text || src.maxclass})`);
    }

    if (!dst) {
      fail(name, `linha com destino inexistente: ${dstId}`);
    } else if (dstInlet >= (dst.numinlets || 0)) {
      fail(name, `entrada ${dstInlet} inexistente em ${dstId} (${dst.text || dst.maxclass})`);
    }
  }

  // 4. Parâmetros: nomes únicos e presentes na presentation.
  const seen = new Set();
  for (const box of boxes.values()) {
    if (!box.parameter_enable) continue;
    const valueof = box.saved_attribute_attributes && box.saved_attribute_attributes.valueof;
    if (!valueof || !valueof.parameter_longname) {
      fail(name, `${box.id} é parâmetro mas não tem parameter_longname`);
      continue;
    }
    if (seen.has(valueof.parameter_longname)) {
      fail(name, `parâmetro duplicado: ${valueof.parameter_longname}`);
    }
    seen.add(valueof.parameter_longname);

    if (!box.presentation) {
      warn(name, `parâmetro "${valueof.parameter_longname}" fora da presentation`);
    }
  }

  if (!seen.size) warn(name, 'nenhum parâmetro exposto ao Live');

  console.log(
    `✔ ${name.padEnd(20)} ${String(patcher.boxes.length).padStart(2)} boxes, ` +
      `${String((patcher.lines || []).length).padStart(2)} conexões, ` +
      `${String(seen.size).padStart(2)} parâmetros, ${patcher.devicewidth}px`
  );
}

function main() {
  const devices = loadDevices();

  if (!devices.length) {
    console.error('Nenhum device em devices/');
    process.exit(1);
  }

  for (const device of devices) validateDevice(device);

  console.log('');

  if (warnings.length) {
    console.log('Avisos:');
    for (const message of warnings) console.log(`  ! ${message}`);
    console.log('');
  }

  if (errors.length) {
    console.log('Erros:');
    for (const message of errors) console.log(`  ✘ ${message}`);
    process.exit(1);
  }

  console.log(`OK: ${devices.length} device(s) validado(s).`);
}

main();
