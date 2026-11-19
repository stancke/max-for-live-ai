'use strict';
const { PatchBuilder } = require('../src/patch');
const { styles } = require('../src/m4l-drum-generator-runtime');

function build() {
  const p = new PatchBuilder({ deviceType: 'midi_effect', width: 360, title: 'M4L Drum Generator' });
  p.comment('DRUM LINE GENERATOR', { rect: [8, 5, 342, 20] });
  p.comment('ESTILO', { rect: [8, 30, 220, 15] });
  p.comment('COMPASSOS (4/4)', { rect: [240, 30, 110, 15] });
  const style = p.menu({ name: 'Style', items: styles, rect: [10, 48, 220, 20] });
  const bars = p.menu({ name: 'Bars', items: ['1', '2', '4', '8', '16'], initial: 2, rect: [245, 48, 70, 20] });
  const generate = p.textButton({ name: 'Generate Drums', shortname: 'Generate', text: 'GERAR CLIPE', rect: [10, 84, 220, 24] });
  p.comment('Usa o primeiro slot vazio da faixa.', { rect: [8, 116, 344, 16] });
  const status = p.add({ maxclass: 'live.comment', text: 'Pronto: primeiro slot vazio da faixa.', numinlets: 1, numoutlets: 0, patching_rect: [8, 137, 344, 18], presentation: 1, presentation_rect: [8, 137, 344, 18] });
  const input = p.midiIn([420, 20, 45, 20]);
  const output = p.midiOut([420, 60, 45, 20]);
  p.connect(input, 0, output, 0);
  const js = p.obj('v8 m4l-drum-generator-runtime.js', { inlets: 1, outlets: 1, outlettype: [''], rect: [590, 210, 200, 20] });
  const styleMsg = p.obj('prepend style', { rect: [450, 100, 85, 20] });
  const barsMsg = p.obj('prepend bars', { rect: [450, 130, 85, 20] });
  const defer = p.obj('deferlow', { rect: [510, 160, 60, 20] });
  const gen = p.message('generate', { rect: [580, 160, 70, 20] });
  const init = p.message('bang', { rect: [700, 50, 50, 20] });
  const device = p.thisDevice([700, 20, 90, 20]);
  p.connect(style, 0, styleMsg, 0); p.connect(styleMsg, 0, js, 0);
  p.connect(bars, 0, barsMsg, 0); p.connect(barsMsg, 0, js, 0);
  // live.text em modo button envia bang, não o número 1.
  p.connect(generate, 0, defer, 0); p.connect(defer, 0, gen, 0); p.connect(gen, 0, js, 0);
  p.connect(device, 0, init, 0); p.connect(init, 0, style, 0); p.connect(init, 0, bars, 0);
  p.connect(js, 0, status, 0);
  return p.finish();
}
module.exports = { slug: 'm4l-drum-generator', name: 'M4L Drum Generator', type: 'midi_effect', width: 360, dependencies: ['src/m4l-drum-generator-runtime.js'], build };
