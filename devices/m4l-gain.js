'use strict';

/**
 * M4L Gain — Audio Effect de exemplo.
 *
 * Sinal:  plugin~ (L/R) -> *~ (L) / *~ (R) -> plugout~ (L/R)
 * Controle: live.dial (dB) -> dbtoa -> entradas direitas dos *~
 *
 * Serve como device de validação do pipeline e como template para efeitos
 * de áudio futuros.
 */

const { PatchBuilder } = require('../src/patch');

function build() {
  const p = new PatchBuilder({
    deviceType: 'audio_effect',
    width: 120,
    title: 'M4L Gain',
  });

  const input = p.audioIn([40, 20, 53, 20]);
  const gainL = p.obj('*~', { rect: [40, 76, 40, 20] });
  const gainR = p.obj('*~', { rect: [96, 76, 40, 20] });
  const output = p.audioOut([40, 132, 53, 20]);

  const gain = p.dial({
    name: 'Gain',
    shortname: 'Gain',
    min: -70,
    max: 6,
    initial: 0,
    unitstyle: 4, // dB
    rect: [24, 30, 56, 56],
    presentation: [24, 30, 56, 56],
    annotation: 'Ganho de entrada em dB (-70 a +6).',
  });

  const dbToAmp = p.obj('dbtoa', { rect: [170, 60, 50, 20] });
  p.comment('GAIN', { rect: [8, 8, 104, 16], presentation: [8, 8, 104, 16] });

  // Inicialização: garante que o ganho seja aplicado quando o device carrega.
  const thisDevice = p.thisDevice([170, 20, 80, 20]);
  // bang (e não "init"): emite o valor atual, preservando presets/automação.
  const init = p.message('bang', { rect: [170, 44, 50, 20] });

  // Áudio
  p.connect(input, 0, gainL, 0);
  p.connect(input, 1, gainR, 0);
  p.connect(gainL, 0, output, 0);
  p.connect(gainR, 0, output, 1);

  // Controle
  p.connect(gain, 0, dbToAmp, 0);
  p.connect(dbToAmp, 0, gainL, 1);
  p.connect(dbToAmp, 0, gainR, 1);

  // Init
  p.connect(thisDevice, 0, init, 0);
  p.connect(init, 0, gain, 0);

  return p.finish();
}

module.exports = {
  slug: 'm4l-gain',
  name: 'M4L Gain',
  type: 'audio_effect',
  width: 120,
  build,
};
