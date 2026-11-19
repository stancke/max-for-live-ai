const assert = require('assert');
const {makeNotes, styles, barLengths} = require('../src/m4l-drum-generator-runtime');

assert.deepStrictEqual(styles, [
  'Techno', 'Melodic Techno', 'Raw', 'Psytrance', 'Psytech', 'Minimal', 'House', 'Breakbeat',
  'Drum n Bass', 'Progressive House', 'Tech House'
]);

for (let style = 0; style < styles.length; style++) {
  for (const bars of barLengths) {
    const notes = makeNotes(style, bars, () => 0.2);
    assert(notes.length > 0);
    assert(notes.every(n => n.start_time >= 0 && n.start_time + n.duration <= bars * 4 && n.pitch >= 0 && n.pitch <= 127 && n.velocity >= 1 && n.velocity <= 127));
    for (let b = 0; b < bars; b++) {
      assert(notes.some(n => n.pitch === 36 && n.start_time >= b * 4 && n.start_time < b * 4 + 4), `${styles[style]}: sem bumbo no compasso ${b + 1}`);
    }
    const kicks = notes.filter(n => n.pitch === 36).length;
    assert(kicks >= bars * 2, `${styles[style]}: poucos bumbos`);
  }
}

// Drum n Bass: caixa no contratempo (step 8) e bumbo em dois tempos.
const dnb = makeNotes(8, 2, () => 0.2);
for (let b = 0; b < 2; b++) {
  assert(dnb.some(n => n.pitch === 38 && Math.abs(n.start_time - (b * 4 + 2)) < 1e-9));
}

// Tech House e Progressive House tem quatro bumbos por compasso, com reforços opcionais.
for (const style of [9, 10]) {
  const notes = makeNotes(style, 1, () => 0.9);
  const kicks = notes.filter(n => n.pitch === 36).length;
  assert(kicks >= 4 && kicks <= 5, `${styles[style]}: bumbos fora do esperado`);
}

// Fill a cada quatro compassos: tom apenas no quarto compasso.
const fourBars = makeNotes(0, 4, () => 0.2);
assert(fourBars.some(n => n.pitch === 45 && n.start_time >= 12));
assert(!fourBars.some(n => n.pitch === 45 && n.start_time < 12));

assert.notDeepStrictEqual(makeNotes(0, 1, () => 0.2), makeNotes(0, 1, () => 0.6));
assert.notDeepStrictEqual(makeNotes(0, 1, () => 0.2), makeNotes(8, 1, () => 0.2));
console.log('OK: 11 estilos, durações, limites MIDI, fills e variação.');
