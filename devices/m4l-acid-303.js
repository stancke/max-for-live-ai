'use strict';

/**
 * M4L Acid 303 — Instrument.
 *
 * Gerador de linhas acid com voz inspirada na TB-303:
 *   - sequenciador de 16 passos, sincronizado ao transporte/tempo do Live
 *   - banco de 16 patterns (note / accent / slide / gate)
 *   - oscilador saw ou square
 *   - filtro ressonante (lores~) com envelope de filtro
 *   - accent (mais brilho e volume) e slide (glide de pitch, sem retrigger do filtro)
 *
 * Fluxo do clock:
 *   metro 50 -> plugsync~ -> tempo -> metro (intervalo de 1/16, 1/8 ou 1/32)
 *   transporte do Live -> start/stop do metro + reset do contador
 *
 * Fluxo do passo:
 *   counter -> pattern*16 + step -> coll -> unpack [note, accent, slide, gate]
 *   gate -> dispara pitch/VCA (e filtro, se não for slide)
 */

const { PatchBuilder } = require('../src/patch');

const STEP_COUNT = 16;
const PATTERN_COUNT = 16;
const DEGREES = [0, 3, 5, 6, 7, 10, 12];

// PRNG determinístico: o build é reproduzível.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generatePatterns() {
  const patterns = [];

  for (let p = 0; p < PATTERN_COUNT; p++) {
    const rng = mulberry32(0xa1d5 + p * 7919);
    const density = 0.5 + (p % 5) * 0.08;
    const accentRate = 0.12 + (p % 6) * 0.03;
    const slideRate = 0.08 + (p % 4) * 0.03;
    const octaveRate = 0.03 + (p % 3) * 0.03;
    const steps = [];
    let lastNote = 0;
    let noteCount = 0;

    for (let s = 0; s < STEP_COUNT; s++) {
      let gate = 0;
      let note = 0;
      let accent = 0;
      let slide = 0;

      if (s === 0) {
        gate = 1;
        note = 0;
        accent = 1;
        slide = 0;
        noteCount++;
      } else if (rng() < density) {
        gate = 1;

        if (rng() < 0.22) {
          note = lastNote;
        } else {
          note = DEGREES[Math.floor(rng() * DEGREES.length)];
        }
        if (rng() < octaveRate) note += 12;

        accent = rng() < accentRate ? 1 : 0;
        slide = rng() < slideRate ? 1 : 0;
        lastNote = note;
        noteCount++;
      }

      steps.push({ note, accent, slide, gate });
    }

    // Garante um mínimo de notas para o pattern não ficar vazio.
    let guard = 0;
    while (noteCount < 4 && guard++ < 64) {
      const s = 1 + Math.floor(rng() * (STEP_COUNT - 1));
      if (!steps[s].gate) {
        steps[s].gate = 1;
        steps[s].note = DEGREES[Math.floor(rng() * DEGREES.length)];
        steps[s].accent = rng() < 0.3 ? 1 : 0;
        steps[s].slide = 0;
        noteCount++;
      }
    }

    patterns.push(steps);
  }

  return patterns;
}

/** Monta os comandos `store` do coll em blocos (evita um message box gigante). */
function collInitChunks(patterns) {
  const commands = [];
  patterns.forEach((steps, p) => {
    steps.forEach((step, s) => {
      const key = p * STEP_COUNT + s;
      commands.push(`store ${key} ${step.note} ${step.accent} ${step.slide} ${step.gate}`);
    });
  });

  const chunkSize = 64;
  const chunks = [];
  for (let i = 0; i < commands.length; i += chunkSize) {
    const part = commands.slice(i, i + chunkSize).join(', ');
    chunks.push(part);
  }
  return chunks;
}

function build() {
  const p = new PatchBuilder({
    deviceType: 'instrument',
    width: 650,
    title: 'M4L Acid 303',
  });

  const cols = [6, 65, 124, 183, 242, 301];

  p.add({ maxclass: 'fpic', numinlets: 1, numoutlets: 2, outlettype: ['', ''], pic: 'acid-smiley.svg', ignoreclick: 1, patching_rect: [575, 40, 64, 64], presentation: 1, presentation_rect: [575, 40, 64, 64] });

  // ------------------------------------------------------------------
  // UI
  // ------------------------------------------------------------------
  ['CUT', 'RES', 'ENV', 'DEC', 'ACC', 'VOL'].forEach((label, i) => {
    p.comment(label, { rect: [cols[i], 6, 50, 12], presentation: [cols[i], 6, 50, 12] });
  });
  ['ROOT', 'OCT', 'PAT', 'LEN', 'RATE', 'WAVE'].forEach((label, i) => {
    p.comment(label, { rect: [cols[i], 72, 50, 12], presentation: [cols[i], 72, 50, 12] });
  });

  const cutoff = p.dial({
    name: 'Cutoff',
    shortname: 'Cut',
    min: 80,
    max: 8000,
    initial: 600,
    unitstyle: 3, // Hz
    exponent: 2,
    rect: [cols[0], 20, 50, 50],
    presentation: [cols[0], 20, 50, 50],
    annotation: 'Frequência de corte do filtro.',
  });

  const resonance = p.dial({
    name: 'Resonance',
    shortname: 'Res',
    min: 0,
    max: 1,
    initial: 0.7,
    unitstyle: 1,
    rect: [cols[1], 20, 50, 50],
    presentation: [cols[1], 20, 50, 50],
    annotation: 'Ressonância do filtro (0 a 1).',
  });

  const envMod = p.dial({
    name: 'Env Mod',
    shortname: 'Env',
    min: 0,
    max: 100,
    initial: 60,
    unitstyle: 5, // %
    rect: [cols[2], 20, 50, 50],
    presentation: [cols[2], 20, 50, 50],
    annotation: 'Profundidade do envelope de filtro.',
  });

  const decay = p.dial({
    name: 'Decay',
    shortname: 'Dec',
    min: 30,
    max: 800,
    initial: 220,
    unitstyle: 2, // ms
    rect: [cols[3], 20, 50, 50],
    presentation: [cols[3], 20, 50, 50],
    annotation: 'Tempo de decaimento do envelope.',
  });

  const accent = p.dial({
    name: 'Accent',
    shortname: 'Acc',
    min: 0,
    max: 100,
    initial: 60,
    unitstyle: 5,
    rect: [cols[4], 20, 50, 50],
    presentation: [cols[4], 20, 50, 50],
    annotation: 'Intensidade dos acentos.',
  });

  const volume = p.dial({
    name: 'Volume',
    shortname: 'Vol',
    min: -24,
    max: 6,
    initial: -6,
    unitstyle: 4, // dB
    rect: [cols[5], 20, 50, 50],
    presentation: [cols[5], 20, 50, 50],
    annotation: 'Volume de saída.',
  });

  const root = p.dial({
    name: 'Root Note',
    shortname: 'Root',
    min: 24,
    max: 60,
    initial: 36,
    unitstyle: 8, // MIDI
    parameterType: 1,
    rect: [cols[0], 86, 50, 50],
    presentation: [cols[0], 86, 50, 50],
    annotation: 'Nota raiz da linha (C1 = 36).',
  });

  const octave = p.dial({
    name: 'Octave',
    shortname: 'Oct',
    min: -2,
    max: 2,
    initial: 0,
    unitstyle: 0,
    rect: [cols[1], 86, 50, 50],
    presentation: [cols[1], 86, 50, 50],
    annotation: 'Transposição em oitavas.',
  });

  const pattern = p.dial({
    name: 'Pattern',
    shortname: 'Pat',
    min: 0,
    max: PATTERN_COUNT - 1,
    initial: 0,
    unitstyle: 0,
    parameterType: 1,
    rect: [cols[2], 86, 50, 50],
    presentation: [cols[2], 86, 50, 50],
    annotation: 'Pattern selecionado (0 a 15).',
  });

  const length = p.dial({
    name: 'Length',
    shortname: 'Len',
    min: 1,
    max: STEP_COUNT,
    initial: STEP_COUNT,
    unitstyle: 0,
    parameterType: 1,
    rect: [cols[3], 86, 50, 50],
    presentation: [cols[3], 86, 50, 50],
    annotation: 'Número de passos do pattern.',
  });

  const rate = p.menu({
    name: 'Rate',
    shortname: 'Rate',
    items: ['1/8', '1/16', '1/32'],
    initial: 1,
    rect: [cols[4], 101, 50, 18],
    presentation: [cols[4], 101, 50, 18],
    annotation: 'Divisão rítmica do sequenciador.',
  });

  const wave = p.menu({
    name: 'Wave',
    shortname: 'Wave',
    items: ['Saw', 'Square'],
    initial: 0,
    rect: [cols[5], 101, 50, 18],
    presentation: [cols[5], 101, 50, 18],
    annotation: 'Forma de onda do oscilador.',
  });

  const generate = p.textButton({
    name: 'Generate',
    shortname: 'New',
    text: 'GENERATE',
    rect: [6, 142, 96, 20],
    presentation: [6, 142, 96, 20],
    annotation: 'Gera um clipe no primeiro slot vazio da faixa.',
  });

  p.comment('SOURCE', {
    rect: [110, 142, 56, 20],
    presentation: [110, 142, 56, 20],
    justification: 1,
  });

  const source = p.menu({
    name: 'Source',
    shortname: 'Src',
    items: ['MIDI', 'SEQ'],
    initial: 0, // MIDI: toca imediatamente com notas externas
    rect: [168, 143, 86, 18],
    presentation: [168, 143, 86, 18],
    annotation: 'Fonte: MIDI (entrada) ou SEQ (sequenciador interno).',
  });

  p.comment('RUN', {
    rect: [260, 142, 30, 20],
    presentation: [260, 142, 30, 20],
    justification: 1,
  });

  const run = p.toggle({
    name: 'Run',
    shortname: 'Run',
    initial: 1,
    rect: [292, 142, 20, 20],
    presentation: [292, 142, 20, 20],
    annotation: 'Liga/desliga o sequenciador interno.',
  });

  p.comment('TOM', { rect: [365, 6, 85, 14] });
  p.comment('ESCALA', { rect: [457, 6, 105, 14] });
  const clipKey = p.menu({ name: 'Clip Key', items: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], rect: [365, 24, 85, 20] });
  const clipScale = p.menu({ name: 'Clip Scale', items: ['Menor', 'Maior', 'Penta menor', 'Penta maior', 'Dórico', 'Frígio', 'Menor harmônica'], rect: [457, 24, 105, 20] });
  p.comment('COMPASSOS (4/4)', { rect: [365, 54, 180, 14] });
  const clipBars = p.menu({ name: 'Clip Bars', items: ['1', '2', '4', '8'], initial: 1, rect: [365, 72, 85, 20] });
  p.comment('TOM LIVE', { rect: [457, 54, 95, 14] });
  const clipFollow = p.toggle({ name: 'Follow Live Scale', shortname: 'Live', rect: [490, 74, 20, 20] });
  const followPrep = p.obj('prepend follow', { rect: [1470, 110, 100, 20] });
  p.connect(clipFollow, 0, followPrep, 0);
  const clipStatus = p.add({ maxclass: 'live.comment', text: 'Usa o primeiro slot vazio da faixa.', numinlets: 1, numoutlets: 0, patching_rect: [365, 105, 195, 50], presentation: 1, presentation_rect: [365, 105, 195, 50] });
  const clipJs = p.obj('v8 m4l-acid-clip-runtime.js', { inlets: 1, outlets: 1, outlettype: [''], rect: [1350, 210, 180, 20] });
  p.connect(followPrep, 0, clipJs, 0);
  const clipDefer = p.obj('deferlow', { rect: [1350, 180, 60, 20] });
  const clipGenerate = p.message('generate', { rect: [1420, 180, 70, 20] });
  for (const [control, method, y] of [[clipKey, 'key', 20], [clipScale, 'scale', 50], [clipBars, 'bars', 80], [rate, 'rate', 110]]) {
    const prep = p.obj(`prepend ${method}`, { rect: [1350, y, 100, 20] });
    p.connect(control, 0, prep, 0);
    p.connect(prep, 0, clipJs, 0);
  }
  p.connect(generate, 0, clipDefer, 0);
  p.connect(clipDefer, 0, clipGenerate, 0);
  p.connect(clipGenerate, 0, clipJs, 0);
  p.connect(clipJs, 0, clipStatus, 0);

  // ------------------------------------------------------------------
  // Clock / sequenciador
  // ------------------------------------------------------------------
  const pollMetro = p.obj('metro 20', { rect: [420, 20, 60, 20] });
  // metro inicia com bang (não existe mensagem "start" no objeto metro)
  const pollStart = p.message('bang', { rect: [490, 20, 50, 20] });
  const seqStart = p.message('bang', { rect: [550, 20, 50, 20] });
  const plugsync = p.obj('plugsync~', { rect: [420, 48, 70, 20] });
  const tempoExpr = p.obj('expr 60000.0 / (max(1.0, $f1) * $i2)', {
    inlets: 2,
    rect: [500, 48, 140, 20],
  });
  const tempoChange = p.obj('change', { rect: [630, 48, 60, 20] });
  const rateDiv = p.obj('expr 2 * pow(2, $i1)', { inlets: 1, rect: [500, 76, 110, 20] });
  const stepMetro = p.obj('metro 125', { rect: [420, 104, 60, 20] });
  const transportChange = p.obj('change', { rect: [420, 132, 60, 20] });
  const transportSel = p.obj('sel 0 1', { rect: [490, 132, 60, 20] });
  const resetMsg = p.message('set 0', { rect: [490, 160, 50, 20] });
  const counter = p.obj('counter 0 15', { rect: [420, 188, 70, 20] });
  const lengthExpr = p.obj('expr $i1 - 1', { inlets: 1, rect: [500, 188, 70, 20] });
  const patternKey = p.obj('expr $i2 * 16 + $i1', { inlets: 2, rect: [420, 216, 110, 20] });
  const coll = p.obj('coll', { rect: [420, 244, 70, 20] });
  const unpackStep = p.obj('unpack 0 0 0 0', {
    outlets: 4,
    outlettype: ['int', 'int', 'int', 'int'],
    rect: [420, 324, 90, 20],
  });
  const stepOrder = p.obj('t l l', { rect: [320, 324, 50, 20] });
  const stepGateUnpack = p.obj('unpack 0 0 0 0', { outlets: 4, outlettype: ['int', 'int', 'int', 'int'], rect: [320, 352, 90, 20] });

  // ------------------------------------------------------------------
  // Entrada MIDI (para tocar o 303 com notas de fora)
  // ------------------------------------------------------------------
  const midiin = p.midiIn([1000, 20, 45, 20]);
  const midiparse = p.obj('midiparse', { rect: [1000, 48, 60, 20] });
  const unpackMidi = p.obj('unpack 0 0', { rect: [1000, 76, 60, 20] });
  const midiOrder = p.obj('t l l', { rect: [1000, 180, 50, 20] });
  const midiGateUnpack = p.obj('unpack 0 0', { rect: [1060, 180, 60, 20] });
  const midiVel = p.obj('> 0', { rect: [1000, 104, 40, 20] });
  const midiNoteOn = p.obj('sel 1', { rect: [1000, 132, 40, 20] });
  const midiAccent = p.obj('> 100', { rect: [1060, 104, 50, 20] });
  const midiPitchSum = p.obj('expr $i1 + $i2', { inlets: 2, rect: [1060, 76, 80, 20] });
  const pitchSwitch = p.obj('switch 2', { rect: [1060, 132, 50, 20] });
  const accentSwitch = p.obj('switch 2', { rect: [1120, 132, 50, 20] });
  // slide MIDI é sempre 0; multiplicar pelo Source resolve sem switch.
  const slideMul = p.obj('*', { rect: [1180, 132, 40, 20] });
  const sourceIsMidi = p.obj('expr 1 - $i1', { inlets: 1, rect: [1240, 132, 70, 20] });
  // switch: inlet 0 = controle (1 = input 1, 2 = input 2)
  const sourcePlusOne = p.obj('+ 1', { rect: [1240, 104, 40, 20] });
  const seqGate = p.obj('gate', { rect: [1180, 160, 50, 20] });
  const midiGate = p.obj('gate', { rect: [1240, 160, 50, 20] });

  const loadbang = p.obj('loadbang', { rect: [420, 272, 50, 20] });
  const thisDevice = p.thisDevice([620, 300, 80, 20]);
  // bang (e não "init"): emite o valor atual de cada controle, preservando
  // presets/automação quando o live.thisdevice dispara de novo.
  const initControls = p.message('bang', { rect: [710, 300, 50, 20] });
  // Toggles precisam de outputvalue (bang alternaria o estado).
  const pushToggles = p.message('outputvalue', { rect: [710, 328, 70, 20] });
  // Fallback: no loadbang, aplica os valores iniciais no DSP. O live.thisdevice
  // depois empurra os valores restaurados (preset/Set) por cima.
  const loadInit = p.message('init', { rect: [710, 356, 50, 20] });

  const chunks = collInitChunks(generatePatterns());
  const initChunks = chunks.map((text, i) =>
    p.message(text, { rect: [420, 352 + i * 28, 600, 20] })
  );
  const chunkTrig = p.obj('t b b b b', {
    outlets: 4,
    outlettype: ['bang', 'bang', 'bang', 'bang'],
    rect: [340, 272, 60, 20],
  });

  // ------------------------------------------------------------------
  // Pitch / envelopes
  // ------------------------------------------------------------------
  const octaveOffset = p.obj('expr $i1 * 12', { inlets: 1, rect: [620, 76, 70, 20] });
  const rootSum = p.obj('expr $i1 + $i2 + $i3', { inlets: 3, rect: [620, 48, 110, 20] });
  const mtof = p.obj('mtof', { rect: [740, 48, 50, 20] });
  const freqStore = p.obj('f', { rect: [740, 76, 50, 20] });
  const glideCalc = p.obj('expr $i1 * 60', { inlets: 1, rect: [800, 48, 70, 20] });
  const glideStore = p.obj('f', { rect: [800, 76, 50, 20] });
  const pitchPack = p.obj('pack f f', { rect: [860, 48, 60, 20] });
  const pitchMsg = p.message('$1 $2', { rect: [860, 76, 60, 20] });
  const pitchLine = p.obj('line~', { rect: [860, 104, 60, 20] });

  const gateSel = p.obj('sel 1', { rect: [620, 104, 40, 20] });
  const transportGate = p.obj('gate', { rect: [620, 132, 50, 20] });
  const noteTrig = p.obj('t b b', { rect: [660, 104, 40, 20] });
  const pitchTrig = p.obj('t b b', { rect: [700, 104, 40, 20] });
  const envTrig = p.obj('t b b', { rect: [740, 104, 40, 20] });
  const slideInv = p.obj('expr 1 - $i1', { inlets: 1, rect: [780, 104, 70, 20] });
  const envGate = p.obj('gate', { rect: [780, 132, 50, 20] });

  const vcaDecayStore = p.obj('f', { rect: [500, 300, 50, 20] });
  const fDecayStore = p.obj('f', { rect: [560, 300, 50, 20] });
  const vcaMsg = p.message('1 2 0 $1', { rect: [500, 328, 80, 20] });
  const fenvMsg = p.message('1 2 0 $1', { rect: [590, 328, 80, 20] });
  const vcaLine = p.obj('line~', { rect: [500, 356, 60, 20] });
  const filterLine = p.obj('line~', { rect: [590, 356, 60, 20] });

  const accentFactor = p.obj('expr 1 + $i1 * $f2 * 0.006', {
    inlets: 2,
    rect: [680, 300, 130, 20],
  });
  const vcaAccent = p.obj('*~', { rect: [680, 328, 50, 20] });
  const filterDepth = p.obj('expr $f1 * 50 + $i2 * $f3 * 30', {
    inlets: 3,
    rect: [680, 356, 150, 20],
  });
  const filterMul = p.obj('*~', { rect: [680, 384, 50, 20] });
  const filterAdd = p.obj('+~', { rect: [740, 384, 50, 20] });

  // ------------------------------------------------------------------
  // Oscilador / filtro / saída
  // ------------------------------------------------------------------
  const saw = p.obj('saw~', { rect: [820, 132, 50, 20] });
  const rect = p.obj('rect~', { rect: [880, 132, 50, 20] });
  const waveAdd = p.obj('+ 1', { rect: [940, 132, 40, 20] });
  const waveSel = p.obj('selector~ 2 1', { rect: [820, 160, 60, 20] });
  const lores = p.obj('lores~', { rect: [820, 188, 60, 20] });
  const vca = p.obj('*~', { rect: [900, 188, 50, 20] });
  const volAmp = p.obj('dbtoa', { rect: [960, 188, 50, 20] });
  const outGain = p.obj('*~', { rect: [900, 216, 50, 20] });
  const output = p.audioOut([900, 244, 53, 20]);

  // ------------------------------------------------------------------
  // Conexões: inicialização
  // ------------------------------------------------------------------
  p.connect(loadbang, 0, chunkTrig, 0);
  initChunks.forEach((chunk, i) => {
    p.connect(chunkTrig, i, chunk, 0);
    p.connect(chunk, 0, coll, 0);
  });

  // Garante o coll populado mesmo se o loadbang não disparar no host.
  p.connect(thisDevice, 0, chunkTrig, 0);
  p.connect(thisDevice, 0, initControls, 0);
  p.connect(thisDevice, 0, pushToggles, 0);
  p.connect(pushToggles, 0, run, 0);
  p.connect(pushToggles, 0, clipFollow, 0);
  p.connect(thisDevice, 0, pollStart, 0);
  p.connect(pollStart, 0, pollMetro, 0);
  p.connect(thisDevice, 0, seqStart, 0);
  p.connect(seqStart, 0, stepMetro, 0);

  p.connect(loadbang, 0, loadInit, 0);
  for (const control of [cutoff, resonance, envMod, decay, accent, volume, root, octave, pattern, length, rate, wave, source, clipKey, clipScale, clipBars]) {
    p.connect(initControls, 0, control, 0);
    p.connect(loadInit, 0, control, 0);
  }
  p.connect(loadInit, 0, run, 0);
  // fallback extra: começa o sequenciador mesmo se live.thisdevice falhar
  p.connect(loadbang, 0, seqStart, 0);

  // ------------------------------------------------------------------
  // Conexões: clock
  // ------------------------------------------------------------------
  p.connect(pollMetro, 0, plugsync, 0);
  p.connect(plugsync, 5, tempoExpr, 0);
  p.connect(rate, 0, rateDiv, 0);
  p.connect(rateDiv, 0, tempoExpr, 1);
  p.connect(tempoExpr, 0, tempoChange, 0);
  p.connect(tempoChange, 0, stepMetro, 1);

  p.connect(plugsync, 0, transportChange, 0);
  p.connect(transportChange, 0, transportSel, 0);
  // O sequenciador roda livre; o play do Live só realinha o passo 0.
  p.connect(transportSel, 1, resetMsg, 0);
  p.connect(resetMsg, 0, counter, 0);

  p.connect(stepMetro, 0, counter, 0);
  p.connect(length, 0, lengthExpr, 0);
  p.connect(lengthExpr, 0, counter, 4);

  p.connect(pattern, 0, patternKey, 1);
  p.connect(counter, 0, patternKey, 0);
  p.connect(patternKey, 0, coll, 0);
  p.connect(coll, 0, stepOrder, 0);
  p.connect(stepOrder, 1, unpackStep, 0);
  p.connect(stepOrder, 0, stepGateUnpack, 0);


  // ------------------------------------------------------------------
  // Conexões: MIDI
  // ------------------------------------------------------------------
  p.connect(midiin, 0, midiparse, 0);
  p.connect(midiparse, 0, midiOrder, 0);
  p.connect(midiOrder, 1, unpackMidi, 0);
  p.connect(midiOrder, 0, midiGateUnpack, 0);
  p.connect(unpackMidi, 0, midiPitchSum, 0);
  p.connect(octaveOffset, 0, midiPitchSum, 1);
  // accent antes do trigger: o valor precisa estar atualizado quando a nota dispara
  p.connect(unpackMidi, 1, midiAccent, 0);
  p.connect(midiGateUnpack, 1, midiVel, 0);
  p.connect(midiVel, 0, midiNoteOn, 0);

  p.connect(source, 0, sourceIsMidi, 0);
  p.connect(sourceIsMidi, 0, midiGate, 0);
  p.connect(sourceIsMidi, 0, envGate, 0);
  p.connect(midiNoteOn, 0, midiGate, 1);
  p.connect(midiGate, 0, noteTrig, 0);

  // ------------------------------------------------------------------
  // Conexões: passo -> pitch / envelopes
  // ------------------------------------------------------------------
  p.connect(unpackStep, 0, rootSum, 0);
  p.connect(root, 0, rootSum, 2);
  p.connect(octave, 0, octaveOffset, 0);
  p.connect(octaveOffset, 0, rootSum, 1);

  // Pitch: input 1 = MIDI, input 2 = interno; inlet 0 = controle (1/2).
  p.connect(source, 0, sourcePlusOne, 0);
  p.connect(midiPitchSum, 0, pitchSwitch, 1);
  p.connect(rootSum, 0, pitchSwitch, 2);
  p.connect(sourcePlusOne, 0, pitchSwitch, 0);
  p.connect(pitchSwitch, 0, mtof, 0);
  p.connect(mtof, 0, freqStore, 1); // armazena sem output

  // Slide: em MIDI (Source=0) vira 0; em SEQ (Source=1) usa o slide interno.
  p.connect(unpackStep, 2, slideMul, 0);
  p.connect(source, 0, slideMul, 1);
  p.connect(slideMul, 0, glideCalc, 0);
  p.connect(glideCalc, 0, glideStore, 1); // armazena sem output

  p.connect(stepGateUnpack, 3, gateSel, 0);
  // gate: inlet 0 = controle (0/1), inlet 1 = mensagem que passa.
  // RUN liga/desliga o sequenciador interno; o metro é livre.
  p.connect(run, 0, transportGate, 0);
  p.connect(source, 0, seqGate, 0);
  p.connect(gateSel, 0, seqGate, 1);
  p.connect(seqGate, 0, transportGate, 1);
  p.connect(transportGate, 0, noteTrig, 0);
  p.connect(noteTrig, 0, pitchTrig, 0);
  p.connect(noteTrig, 1, envTrig, 0);

  p.connect(pitchTrig, 1, glideStore, 0); // primeiro prepara o glide
  p.connect(pitchTrig, 0, freqStore, 0); // depois dispara a lista de pitch
  p.connect(glideStore, 0, pitchPack, 1);
  p.connect(freqStore, 0, pitchPack, 0);
  p.connect(pitchPack, 0, pitchMsg, 0);
  p.connect(pitchMsg, 0, pitchLine, 0);

  p.connect(slideMul, 0, slideInv, 0);
  p.connect(slideInv, 0, envGate, 0);
  p.connect(envTrig, 0, vcaDecayStore, 0);
  p.connect(envTrig, 1, envGate, 1);
  p.connect(envGate, 0, fDecayStore, 0);

  p.connect(decay, 0, vcaDecayStore, 1);
  p.connect(decay, 0, fDecayStore, 1);
  p.connect(vcaDecayStore, 0, vcaMsg, 0);
  p.connect(fDecayStore, 0, fenvMsg, 0);
  p.connect(vcaMsg, 0, vcaLine, 0);
  p.connect(fenvMsg, 0, filterLine, 0);

  // Accent: input 1 = MIDI (velocity), input 2 = interno; inlet 0 = controle.
  p.connect(midiAccent, 0, accentSwitch, 1);
  p.connect(unpackStep, 1, accentSwitch, 2);
  p.connect(sourcePlusOne, 0, accentSwitch, 0);
  p.connect(accentSwitch, 0, accentFactor, 0);
  p.connect(accent, 0, accentFactor, 1);
  p.connect(vcaLine, 0, vcaAccent, 0);
  p.connect(accentFactor, 0, vcaAccent, 1);

  p.connect(envMod, 0, filterDepth, 0);
  p.connect(accentSwitch, 0, filterDepth, 1);
  p.connect(accent, 0, filterDepth, 2);
  p.connect(filterLine, 0, filterMul, 0);
  p.connect(filterDepth, 0, filterMul, 1);
  p.connect(filterMul, 0, filterAdd, 0);
  p.connect(cutoff, 0, filterAdd, 1);
  p.connect(filterAdd, 0, lores, 1);

  // ------------------------------------------------------------------
  // Conexões: áudio
  // ------------------------------------------------------------------
  p.connect(pitchLine, 0, saw, 0);
  p.connect(pitchLine, 0, rect, 0);
  p.connect(wave, 0, waveAdd, 0);
  p.connect(waveAdd, 0, waveSel, 0);
  p.connect(saw, 0, waveSel, 1);
  p.connect(rect, 0, waveSel, 2);
  p.connect(waveSel, 0, lores, 0);
  p.connect(resonance, 0, lores, 2);

  p.connect(lores, 0, vca, 0);
  p.connect(vcaAccent, 0, vca, 1);
  p.connect(vca, 0, outGain, 0);
  p.connect(volume, 0, volAmp, 0);
  p.connect(volAmp, 0, outGain, 1);
  p.connect(outGain, 0, output, 0);
  p.connect(outGain, 0, output, 1);

  return p.finish();
}

module.exports = {
  slug: 'm4l-acid-303',
  name: 'M4L Acid 303',
  type: 'instrument',
  width: 650,
  dependencies: ['src/m4l-acid-clip-runtime.js', 'src/acid-smiley.svg'],
  build,
  _internals: { generatePatterns, collInitChunks },
};
