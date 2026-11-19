'use strict';

/**
 * M4L Note Range — MIDI Effect de exemplo.
 *
 * Deixa passar somente notas dentro de uma faixa (Min/Max). Mensagens que não
 * são notas (CC, pitch bend, aftertouch, program change) passam intactas.
 *
 * Sinal: midiin -> midiparse -> [filtro de notas] -> midiformat -> midiout
 */

const { PatchBuilder } = require('../src/patch');

function build() {
  const p = new PatchBuilder({
    deviceType: 'midi_effect',
    width: 160,
    title: 'M4L Note Range',
  });

  const input = p.midiIn([40, 16, 45, 20]);
  const parse = p.obj('midiparse', { rect: [40, 48, 60, 20] });
  const output = p.midiOut([40, 188, 47, 20]);
  const format = p.obj('midiformat', { rect: [40, 156, 60, 20] });

  // Notas: separa pitch/velocity, filtra a faixa e remonta o par na ordem certa.
  const unpack = p.obj('unpack 0 0', { rect: [140, 48, 60, 20] });
  const split = p.obj('split 0 127', { rect: [140, 80, 60, 20] });
  const pitchDelay = p.obj('pipe 0', { rect: [140, 112, 50, 20] });
  const pack = p.obj('pack 0 0', { rect: [140, 144, 60, 20] });

  const minNote = p.dial({
    name: 'Min Note',
    shortname: 'Min',
    min: 0,
    max: 127,
    initial: 0,
    unitstyle: 8, // MIDI note
    parameterType: 1, // Int
    rect: [16, 34, 56, 56],
    presentation: [16, 34, 56, 56],
    annotation: 'Nota mínima que passa pelo filtro.',
  });

  const maxNote = p.dial({
    name: 'Max Note',
    shortname: 'Max',
    min: 0,
    max: 127,
    initial: 127,
    unitstyle: 8,
    parameterType: 1,
    rect: [88, 34, 56, 56],
    presentation: [88, 34, 56, 56],
    annotation: 'Nota máxima que passa pelo filtro.',
  });

  p.comment('MIN', { rect: [8, 10, 64, 14], presentation: [8, 10, 64, 14] });
  p.comment('MAX', { rect: [88, 10, 64, 14], presentation: [88, 10, 64, 14] });

  // Inicialização dos limites do split.
  const thisDevice = p.thisDevice([200, 16, 80, 20]);
  // bang (e não "init"): emite o valor atual, preservando presets/automação.
  const init = p.message('bang', { rect: [200, 44, 50, 20] });

  // Caminho de notas
  p.connect(input, 0, parse, 0);
  p.connect(parse, 0, unpack, 0);
  p.connect(unpack, 0, split, 0);
  p.connect(split, 0, pitchDelay, 0); // dentro da faixa
  p.connect(pitchDelay, 0, pack, 0);
  p.connect(unpack, 1, pack, 1); // velocity
  p.connect(pack, 0, format, 0);

  // Passa adiante mensagens que não são notas
  p.connect(parse, 1, format, 1); // poly pressure
  p.connect(parse, 2, format, 2); // control change
  p.connect(parse, 3, format, 3); // program change
  p.connect(parse, 4, format, 4); // channel pressure
  p.connect(parse, 5, format, 5); // pitch bend

  p.connect(format, 0, output, 0);

  // Controles -> limites do split
  p.connect(minNote, 0, split, 1);
  p.connect(maxNote, 0, split, 2);

  // Init
  p.connect(thisDevice, 0, init, 0);
  p.connect(init, 0, minNote, 0);
  p.connect(init, 0, maxNote, 0);

  return p.finish();
}

module.exports = {
  slug: 'm4l-note-range',
  name: 'M4L Note Range',
  type: 'midi_effect',
  width: 160,
  build,
};
