'use strict';

/**
 * M4L Tone Test — instrument mínimo de diagnóstico.
 *
 * Gera um seno contínuo de 220 Hz. Serve para isolar problemas de áudio:
 * se este device soar, o container .amxd, o device type instrument e o
 * roteamento da track estão OK. Se não soar, o problema não é o Acid 303.
 */

const { PatchBuilder } = require('../src/patch');

function build() {
  const p = new PatchBuilder({
    deviceType: 'instrument',
    width: 90,
    title: 'M4L Tone Test',
  });

  const osc = p.obj('cycle~ 220', { rect: [30, 30, 70, 20] });
  const gain = p.obj('*~ 0.12', { rect: [30, 60, 50, 20] });
  const out = p.audioOut([30, 90, 53, 20]);

  p.comment('220 Hz', { rect: [8, 8, 74, 16], presentation: [8, 8, 74, 16] });

  p.connect(osc, 0, gain, 0);
  p.connect(gain, 0, out, 0);
  p.connect(gain, 0, out, 1);

  return p.finish();
}

module.exports = {
  slug: 'm4l-tone-test',
  name: 'M4L Tone Test',
  type: 'instrument',
  width: 90,
  build,
};
