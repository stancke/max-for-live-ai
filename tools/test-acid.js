#!/usr/bin/env node
'use strict';

/**
 * Teste semântico do M4L Acid 303.
 *
 * Diferente do validate.js (que checa o container e os índices de porta), este
 * teste confere se os objetos certos estão ligados nos lugares certos:
 * áudio, clock, pitch, envelopes, accent e slide.
 *
 *   node tools/test-acid.js
 */

const assert = require('assert');
const { packAmxd, unpackAmxd } = require('../src/amxd');

const device = require('../devices/m4l-acid-303');

const parsed = unpackAmxd(packAmxd(device.build(), { deviceType: 'instrument' }));
const patcher = parsed.patcher;
const boxes = patcher.patcher.boxes.map((entry) => entry.box);

function at(x, y) {
  const box = boxes.find(
    (b) => b.patching_rect && b.patching_rect[0] === x && b.patching_rect[1] === y
  );
  assert(box, `objeto não encontrado em patching_rect [${x}, ${y}]`);
  return box;
}

function connected(src, srcOutlet, dst, dstInlet) {
  return patcher.patcher.lines.some(({ patchline }) => {
    const [sId, sOut] = patchline.source;
    const [dId, dIn] = patchline.destination;
    return sId === src.id && sOut === srcOutlet && dId === dst.id && dIn === dstInlet;
  });
}

function link(src, srcOutlet, dst, dstInlet, label) {
  assert(
    connected(src, srcOutlet, dst, dstInlet),
    `conexão ausente: ${label || `${src.text || src.maxclass}[${srcOutlet}] -> ${dst.text || dst.maxclass}[${dstInlet}]`}`
  );
}

const plugout = at(900, 244);
const lores = at(820, 188);
const vca = at(900, 188);
const vcaAccent = at(680, 328);
const outGain = at(900, 216);
const volAmp = at(960, 188);
const pitchLine = at(860, 104);
const saw = at(820, 132);
const rect = at(880, 132);
const waveSel = at(820, 160);
const filterMul = at(680, 384);
const filterAdd = at(740, 384);
const filterLine = at(590, 356);
const vcaLine = at(500, 356);
const filterDepth = at(680, 356);
const accentFactor = at(680, 300);
const vcaMsg = at(500, 328);
const fenvMsg = at(590, 328);

const cutoff = at(6, 20);
const resonance = at(65, 20);
const envMod = at(124, 20);
const decay = at(183, 20);
const accent = at(242, 20);
const volume = at(301, 20);
const root = at(6, 86);
const octave = at(65, 86);
const pattern = at(124, 86);
const length = at(183, 86);
const rate = at(242, 101);
const wave = at(301, 101);
const generate = at(6, 142);

const stepMetro = at(420, 104);
const counter = at(420, 188);
const patternKey = at(420, 216);
const coll = at(420, 244);
const unpackStep = at(420, 324);
const gateSel = at(620, 104);
const transportGate = at(620, 132);
const noteTrig = at(660, 104);
const pitchTrig = at(700, 104);
const envTrig = at(740, 104);
const glideStore = at(800, 76);
const freqStore = at(740, 76);
const pitchPack = at(860, 48);
const pitchMsg = at(860, 76);
const vcaDecayStore = at(500, 300);
const fDecayStore = at(560, 300);
const envGate = at(780, 132);
const slideInv = at(780, 104);
const glideCalc = at(800, 48);
const rootSum = at(620, 48);
const octaveOffset = at(620, 76);
const mtof = at(740, 48);

const source = at(168, 143);
const run = at(292, 142);
const midiin = at(1000, 20);
const midiparse = at(1000, 48);
const unpackMidi = at(1000, 76);
const midiVel = at(1000, 104);
const midiNoteOn = at(1000, 132);
const midiAccent = at(1060, 104);
const midiPitchSum = at(1060, 76);
const pitchSwitch = at(1060, 132);
const accentSwitch = at(1120, 132);
const slideMul = at(1180, 132);
const sourceIsMidi = at(1240, 132);
const sourcePlusOne = at(1240, 104);
const seqGate = at(1180, 160);
const midiGate = at(1240, 160);

assert.strictEqual(vcaMsg.text, '1 2 0 $1');
assert.strictEqual(fenvMsg.text, '1 2 0 $1');
link(coll, 0, at(320, 324), 0, 'coll -> ordem');
link(at(320, 324), 0, at(320, 352), 0, 'ordem -> gate seq');
link(midiparse, 0, at(1000, 180), 0, 'MIDI -> ordem');
link(at(1000, 180), 0, at(1060, 180), 0, 'ordem -> gate MIDI');

// ---------------------------------------------------------------- áudio
link(lores, 0, vca, 0, 'filtro -> VCA');
link(vcaAccent, 0, vca, 1, 'envelope com accent -> VCA');
link(vca, 0, outGain, 0, 'VCA -> volume');
link(volAmp, 0, outGain, 1, 'dB -> volume');
link(outGain, 0, plugout, 0, 'saída L');
link(outGain, 0, plugout, 1, 'saída R');

link(pitchLine, 0, saw, 0, 'pitch -> saw');
link(pitchLine, 0, rect, 0, 'pitch -> square');
link(saw, 0, waveSel, 1, 'saw -> selector');
link(rect, 0, waveSel, 2, 'square -> selector');
link(waveSel, 0, lores, 0, 'selector -> filtro');
link(filterAdd, 0, lores, 1, 'cutoff + env -> filtro');
link(resonance, 0, lores, 2, 'resonance -> filtro');

link(filterLine, 0, filterMul, 0, 'env de filtro -> depth');
link(filterDepth, 0, filterMul, 1, 'profundidade -> depth');
link(filterMul, 0, filterAdd, 0, 'env*depth -> soma');
link(cutoff, 0, filterAdd, 1, 'cutoff -> soma');
link(vcaLine, 0, vcaAccent, 0, 'env VCA -> accent');
link(accentFactor, 0, vcaAccent, 1, 'fator de accent -> VCA');
link(vcaMsg, 0, vcaLine, 0, 'mensagem VCA -> line~');
link(fenvMsg, 0, filterLine, 0, 'mensagem filtro -> line~');

// ------------------------------------------------------------ clock/passos
link(stepMetro, 0, counter, 0, 'metro -> counter');
link(counter, 0, patternKey, 0, 'passo -> chave');
link(pattern, 0, patternKey, 1, 'pattern -> chave');
link(patternKey, 0, coll, 0, 'chave -> coll');
link(at(320, 324), 1, unpackStep, 0, 'coll -> unpack');
link(length, 0, at(500, 188), 0, 'length -> expr max');
link(at(500, 188), 0, counter, 4, 'max -> counter');

link(at(320, 352), 3, gateSel, 0, 'gate -> sel');
link(source, 0, seqGate, 0, 'source -> controle do gate seq');
link(gateSel, 0, seqGate, 1, 'gate -> mensagem do gate seq');
link(seqGate, 0, transportGate, 1, 'seq gate -> mensagem do run gate');
link(run, 0, transportGate, 0, 'run -> controle do gate');
link(transportGate, 0, noteTrig, 0, 'run -> trigger');

// MIDI: notas externas disparam a mesma voz
link(midiin, 0, midiparse, 0, 'midiin -> midiparse');
link(at(1000, 180), 1, unpackMidi, 0, 'nota MIDI -> unpack');
link(unpackMidi, 0, midiPitchSum, 0, 'pitch MIDI -> soma');
link(octaveOffset, 0, midiPitchSum, 1, 'octave -> pitch MIDI');
link(unpackMidi, 1, midiAccent, 0, 'velocity -> accent MIDI');
link(at(1060, 180), 1, midiVel, 0, 'velocity -> gate MIDI');
link(midiVel, 0, midiNoteOn, 0, 'gate MIDI -> sel');
link(source, 0, sourceIsMidi, 0, 'source -> isMidi');
link(sourceIsMidi, 0, midiGate, 0, 'isMidi -> controle do gate MIDI');
link(midiNoteOn, 0, midiGate, 1, 'nota MIDI -> mensagem do gate MIDI');
link(midiGate, 0, noteTrig, 0, 'gate MIDI -> trigger');
link(noteTrig, 0, pitchTrig, 0, 'trigger -> pitch');
link(noteTrig, 1, envTrig, 0, 'trigger -> envelopes');
link(pitchTrig, 1, glideStore, 0, 'pitch -> glide');
link(pitchTrig, 0, freqStore, 0, 'pitch -> freq');
link(freqStore, 0, pitchPack, 0, 'freq -> pack');
link(glideStore, 0, pitchPack, 1, 'glide -> pack');
link(pitchPack, 0, pitchMsg, 0, 'pack -> mensagem');
link(pitchMsg, 0, pitchLine, 0, 'mensagem -> line~');
link(envTrig, 0, vcaDecayStore, 0, 'env -> decay VCA');
link(envGate, 0, fDecayStore, 0, 'gate -> decay filtro');
link(decay, 0, vcaDecayStore, 1, 'decay -> store VCA');
link(decay, 0, fDecayStore, 1, 'decay -> store filtro');
link(unpackStep, 2, slideMul, 0, 'slide interno -> multiplicador');
link(source, 0, slideMul, 1, 'source -> multiplicador de slide');
link(slideMul, 0, slideInv, 0, 'slide -> inversão');
link(slideInv, 0, envGate, 0, 'slide -> controle do gate do filtro');
link(envTrig, 1, envGate, 1, 'trigger -> mensagem do gate do filtro');

// --------------------------------------------------------------- pitch/nota
link(unpackStep, 0, rootSum, 0, 'nota -> soma');
link(root, 0, rootSum, 2, 'root -> soma');
link(octave, 0, octaveOffset, 0, 'octave -> offset');
link(octaveOffset, 0, rootSum, 1, 'offset -> soma');
link(rootSum, 0, pitchSwitch, 2, 'pitch interno -> switch');
link(midiPitchSum, 0, pitchSwitch, 1, 'pitch MIDI -> switch');
link(sourcePlusOne, 0, pitchSwitch, 0, 'controle -> switch de pitch');
link(source, 0, sourcePlusOne, 0, 'source -> +1');
link(pitchSwitch, 0, mtof, 0, 'switch -> mtof');
link(mtof, 0, freqStore, 1, 'mtof -> store');
link(slideMul, 0, glideCalc, 0, 'slide -> glide ms');
link(glideCalc, 0, glideStore, 1, 'glide ms -> store');

// ------------------------------------------------------------------ accent
link(unpackStep, 1, accentSwitch, 2, 'accent interno -> switch');
link(midiAccent, 0, accentSwitch, 1, 'accent MIDI -> switch');
link(sourcePlusOne, 0, accentSwitch, 0, 'controle -> switch de accent');
link(accentSwitch, 0, accentFactor, 0, 'accent -> fator');
link(accent, 0, accentFactor, 1, 'accent dial -> fator');
link(envMod, 0, filterDepth, 0, 'env mod -> depth');
link(accentSwitch, 0, filterDepth, 1, 'accent -> depth');
link(accent, 0, filterDepth, 2, 'accent dial -> depth');

// --------------------------------------------------------------- utilidades
link(rate, 0, at(500, 76), 0, 'rate -> divisor');
link(wave, 0, at(940, 132), 0, 'wave -> +1');
link(generate, 0, at(1350, 180), 0, 'generate -> deferlow');
link(at(1350, 180), 0, at(1420, 180), 0, 'deferlow -> generate');
link(at(1420, 180), 0, at(1350, 210), 0, 'generate -> runtime');

// --------------------------------------------------------------- integridade
const params = boxes.filter((b) => b.parameter_enable);
assert.strictEqual(params.length, 19, 'esperava 19 parâmetros');
assert.strictEqual(new Set(params.map((b) => b.saved_attribute_attributes.valueof.parameter_longname)).size, 19);

const stores = boxes
  .filter((b) => b.maxclass === 'message')
  .map((b) => b.text)
  .join('; ')
  .match(/store \d+ \d+ \d+ \d+ \d+/g) || [];
assert.strictEqual(stores.length, 256, 'esperava 256 entradas no coll init');

console.log('✔ Acid 303: fiação semântica e banco de patterns OK');
