'use strict';

/**
 * Max for Live (.amxd) container: leitura e escrita.
 *
 * Estrutura de um .amxd (formato "plain", igual aos templates oficiais do Live):
 *
 *   campo  tamanho  conteúdo
 *   ampf   4        "aaaa" (audio effect) | "mmmm" (MIDI effect) | "iiii" (instrument)
 *   meta   4        0
 *   ptch   N        JSON do patcher, terminado em NUL
 *
 * Cada campo é: FOURCC (4 bytes ASCII) + uint32 LE (tamanho do payload) + payload.
 *
 * Devices "frozen" (exportados com dependências) usam um bloco mx@c dentro do
 * ptch: "mx@c" + uint32 BE 16 + uint32 BE 0 + uint32 BE (tamanho) + JSON + trailer
 * dlst/dire. O leitor aceita os dois formatos.
 */

const fs = require('fs');
const path = require('path');

const DEVICE_TYPES = {
  audio_effect: { tag: 'aaaa', amxdtype: 0x61616161, label: 'Audio Effect' },
  midi_effect: { tag: 'mmmm', amxdtype: 0x6d6d6d6d, label: 'MIDI Effect' },
  instrument: { tag: 'iiii', amxdtype: 0x69696969, label: 'Instrument' },
};

const TAG_TO_TYPE = Object.fromEntries(
  Object.entries(DEVICE_TYPES).map(([name, def]) => [def.tag, name])
);

// Época do Max/HFS: 1904-01-01. O Unix começa 2.082.844.800 s depois.
const MAX_EPOCH_OFFSET = 2082844800;

const TYPE_ALIASES = {
  audio: 'audio_effect',
  audioeffect: 'audio_effect',
  'audio-effect': 'audio_effect',
  audio_effect: 'audio_effect',
  efeito: 'audio_effect',
  midi: 'midi_effect',
  midieffect: 'midi_effect',
  'midi-effect': 'midi_effect',
  midi_effect: 'midi_effect',
  instrument: 'instrument',
  instrumento: 'instrument',
  synth: 'instrument',
};

function normalizeDeviceType(value) {
  const key = String(value || 'audio_effect').trim().toLowerCase().replace(/\s+/g, '_');
  const type = TYPE_ALIASES[key] || key;
  if (!DEVICE_TYPES[type]) {
    throw new Error(
      `Tipo de device desconhecido: "${value}". Use audio_effect, midi_effect ou instrument.`
    );
  }
  return type;
}

function unixToMaxTime(date = new Date()) {
  return Math.floor(date.getTime() / 1000) + MAX_EPOCH_OFFSET;
}

function u32le(value) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(value >>> 0, 0);
  return b;
}

function u32be(value) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(value >>> 0, 0);
  return b;
}

function chunk(tag, payload) {
  if (tag.length !== 4) throw new Error(`FOURCC inválido: ${tag}`);
  return Buffer.concat([Buffer.from(tag, 'ascii'), u32le(payload.length), payload]);
}

/** Adiciona o bloco `project` que o Max exige em devices autocontidos. */
function ensureProjectBlock(patcherWrapper, deviceType = 'audio_effect', when) {
  const type = normalizeDeviceType(deviceType);
  const inner = patcherWrapper.patcher || patcherWrapper;
  const stamp = when || unixToMaxTime();

  if (!inner.project) {
    inner.project = {
      version: 1,
      creationdate: stamp,
      modificationdate: stamp,
      viewrect: [0, 0, 300, 500],
      autoorganize: 1,
      hideprojectwindow: 1,
      showdependencies: 1,
      autolocalize: 0,
      contents: { patchers: {} },
      layout: {},
      searchpath: {},
      detailsvisible: 0,
      amxdtype: DEVICE_TYPES[type].amxdtype,
      readonly: 0,
      devpathtype: 0,
      devpath: '.',
      sortmode: 0,
      viewmode: 0,
      includepackages: 0,
    };
  } else {
    if (!inner.project.amxdtype) inner.project.amxdtype = DEVICE_TYPES[type].amxdtype;
    if (!inner.project.modificationdate) inner.project.modificationdate = stamp;
  }

  return patcherWrapper;
}

/** Serializa um patcher (ou JSON já pronto) no container .amxd "plain". */
function packAmxd(patcherOrJson, options = {}) {
  const deviceType = normalizeDeviceType(options.deviceType);
  const obj =
    typeof patcherOrJson === 'string' ? JSON.parse(patcherOrJson) : patcherOrJson;

  ensureProjectBlock(obj, deviceType, options.mtime);

  const json = JSON.stringify(obj, null, options.indent == null ? 4 : options.indent);
  const payload = Buffer.concat([Buffer.from(json, 'utf8'), Buffer.from([0])]);

  return Buffer.concat([
    chunk('ampf', Buffer.from(DEVICE_TYPES[deviceType].tag, 'ascii')),
    chunk('meta', u32le(0)),
    chunk('ptch', payload),
  ]);
}

/** Extrai o primeiro objeto JSON balanceado de um texto (ignora chaves em strings). */
function extractBalancedJson(text) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0 && start >= 0) return text.slice(start, i + 1);
    }
  }
  throw new Error('JSON não encontrado ou desbalanceado no .amxd');
}

/**
 * Lê um buffer .amxd.
 * @returns {{patcher: object, deviceType: string, frozen: boolean, chunks: Array}}
 */
function unpackAmxd(buffer) {
  const chunks = [];
  let offset = 0;
  let deviceType = null;
  let patcher = null;
  let frozen = false;

  while (offset + 8 <= buffer.length) {
    const field = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = buffer.subarray(offset + 8, offset + 8 + size);
    chunks.push({ field, size, offset });

    if (field === 'ampf') {
      const tag = data.toString('ascii', 0, 4);
      deviceType = TAG_TO_TYPE[tag] || null;
    }

    if (field === 'ptch') {
      if (data.toString('ascii', 0, 4) === 'mx@c') {
        frozen = true;
        patcher = JSON.parse(extractBalancedJson(data.toString('utf8', 16)));
      } else {
        let end = data.length;
        while (end > 0 && (data[end - 1] === 0 || data[end - 1] === 0x0a || data[end - 1] === 0x0d)) {
          end--;
        }
        patcher = JSON.parse(data.toString('utf8', 0, end));
      }
    }

    offset += 8 + size;
  }

  if (!patcher) throw new Error('Arquivo .amxd sem bloco ptch válido');

  return {
    patcher,
    deviceType: deviceType || 'audio_effect',
    frozen,
    chunks,
  };
}

function readAmxd(file) {
  return unpackAmxd(fs.readFileSync(file));
}

function writeAmxd(file, patcher, options = {}) {
  const buffer = packAmxd(patcher, options);
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, buffer);
  return buffer.length;
}

/** Resumo legível de um .amxd, usado pela CLI de inspeção. */
function describeAmxd(file) {
  const { patcher, deviceType, frozen, chunks } = readAmxd(file);
  const inner = patcher.patcher || patcher;
  const boxes = inner.boxes || [];
  const classes = {};
  for (const entry of boxes) {
    const box = entry.box || entry;
    classes[box.maxclass] = (classes[box.maxclass] || 0) + 1;
  }
  return {
    file,
    deviceType,
    frozen,
    chunks,
    devicewidth: inner.devicewidth,
    presentation: inner.openinpresentation,
    boxCount: boxes.length,
    lineCount: (inner.lines || []).length,
    classes,
    parameters: boxes
      .map((entry) => entry.box || entry)
      .filter((box) => box.parameter_enable && box.saved_attribute_attributes)
      .map((box) => {
        const v = box.saved_attribute_attributes.valueof || {};
        return {
          id: box.id,
          longname: v.parameter_longname,
          shortname: v.parameter_shortname,
          min: v.parameter_mmin,
          max: v.parameter_mmax,
          unitstyle: v.parameter_unitstyle,
        };
      }),
  };
}

module.exports = {
  DEVICE_TYPES,
  MAX_EPOCH_OFFSET,
  normalizeDeviceType,
  unixToMaxTime,
  ensureProjectBlock,
  packAmxd,
  unpackAmxd,
  readAmxd,
  writeAmxd,
  describeAmxd,
};
