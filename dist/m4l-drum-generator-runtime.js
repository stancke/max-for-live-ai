// Max 9 v8 runtime. Keep this file beside M4L Drum Generator.amxd.
inlets = 1;
outlets = 1;
var selectedStyle = 0;
var selectedBars = 2;
var barLengths = [1, 2, 4, 8, 16];

// Notas do mapa padrao do Drum Rack: bumbo, rim, caixa, palma, chimbal, tom, chimbal aberto.
var K4 = [0, 4, 8, 12];
var OFF4 = [2, 6, 10, 14];
var H8 = [0, 2, 4, 6, 8, 10, 12, 14];
var H16 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
var GHOST8 = [3, 7, 11, 15];

// Camada de batida: step em semicolcheias (0-15), chance por step e variacao no fill.
function l(pitch, steps, velocity, chance, extra) {
  var layer = {pitch: pitch, steps: steps, velocity: velocity, chance: chance};
  if (extra) {
    for (var key in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, key)) layer[key] = extra[key];
    }
  }
  return layer;
}
function kick(steps, velocity, chance) {
  return l(36, steps, velocity, chance == null ? 1 : chance);
}
function hat8(chance, velocity, accentVelocity) {
  return l(42, H8, velocity, chance, {accent: OFF4, accentVelocity: accentVelocity});
}
function hat16(chance, velocity, accentVelocity) {
  return l(42, H16, velocity, chance, {accent: OFF4, accentVelocity: accentVelocity});
}
function openHat(steps, chance, velocity, duration) {
  return l(46, steps, velocity, chance, {duration: duration});
}

var styleDefs = [
  {
    name: 'Techno',
    layers: [
      kick(K4, 113),
      l(39, [4, 12], 100, .88),
      hat8(.82, 64, 83),
      openHat(OFF4, .85, 88, .20),
      l(37, [1, 5, 9, 13], 66, .20, {fillChance: .30}),
      l(42, GHOST8, 53, .06, {fillChance: .20}),
      l(45, [13, 15], 75, .35, {fillOnly: true})
    ]
  },
  {
    name: 'Melodic Techno',
    layers: [
      kick(K4, 112),
      l(39, [4, 12], 96, .70),
      hat8(.70, 62, 79),
      openHat(OFF4, .65, 84, .20),
      l(37, [1, 5, 9, 13], 64, .14, {fillChance: .24}),
      l(42, GHOST8, 51, .03, {fillChance: .17}),
      l(45, [13, 15], 73, .32, {fillOnly: true})
    ]
  },
  {
    name: 'Raw',
    layers: [
      kick(K4, 116),
      l(39, [4, 12], 104, .75),
      hat8(.86, 66, 86),
      openHat(OFF4, .63, 90, .18),
      l(37, [1, 5, 9, 13], 68, .37, {fillChance: .47}),
      l(42, GHOST8, 55, .18, {fillChance: .32}),
      l(45, [13, 15], 78, .40, {fillOnly: true})
    ]
  },
  {
    name: 'Psytrance',
    layers: [
      kick(K4, 118),
      l(39, [4, 12], 98, .62),
      hat8(.90, 66, 88),
      openHat(OFF4, .90, 92, .20),
      l(37, [1, 5, 9, 13], 64, .26, {fillChance: .36}),
      l(42, GHOST8, 53, .04, {fillChance: .18}),
      l(45, [13, 15], 76, .38, {fillOnly: true})
    ]
  },
  {
    name: 'Psytech',
    layers: [
      kick(K4, 116),
      l(39, [4, 12], 102, .78),
      hat8(.88, 66, 86),
      openHat(OFF4, .78, 90, .20),
      l(37, [1, 5, 9, 13], 67, .31, {fillChance: .41}),
      l(42, GHOST8, 54, .08, {fillChance: .22}),
      l(45, [13, 15], 77, .36, {fillOnly: true})
    ]
  },
  {
    name: 'Minimal',
    layers: [
      kick(K4, 110),
      l(39, [4, 12], 94, .70),
      hat8(.55, 60, 74),
      openHat(OFF4, .40, 80, .22),
      l(37, [1, 5, 9, 13], 62, .16, {fillChance: .26}),
      l(42, GHOST8, 50, .04, {fillChance: .18}),
      l(45, [13, 15], 70, .26, {fillOnly: true})
    ]
  },
  {
    name: 'House',
    layers: [
      kick(K4, 112),
      l(39, [4, 12], 104, .90),
      hat8(.75, 63, 80),
      openHat(OFF4, .80, 88, .22),
      l(37, [1, 5, 9, 13], 63, .19, {fillChance: .29}),
      l(42, GHOST8, 51, .03, {fillChance: .17}),
      l(45, [13, 15], 72, .28, {fillOnly: true})
    ]
  },
  {
    name: 'Breakbeat',
    layers: [
      kick([0, 10], 112),
      l(36, [8], 95, .50),
      l(39, [4, 12], 100, .88),
      hat8(.80, 64, 82),
      openHat(OFF4, .40, 84, .16),
      l(37, [1, 5, 9, 13], 66, .20, {fillChance: .30}),
      l(42, GHOST8, 52, .08, {fillChance: .22}),
      l(45, [13, 15], 74, .35, {fillOnly: true})
    ]
  },
  {
    name: 'Drum n Bass',
    layers: [
      kick([0, 10], 115),
      l(36, [3, 6], 92, .16),
      l(38, [8], 112, 1),
      l(38, [3, 7, 11, 15], 52, .10, {fillChance: .26}),
      hat16(.86, 58, 76),
      openHat([6, 14], .35, 84, .14),
      l(37, OFF4, 62, .16, {fillChance: .28}),
      l(45, [15], 78, .45, {fillOnly: true}),
      l(38, [13, 14], 72, .35, {fillOnly: true})
    ]
  },
  {
    name: 'Progressive House',
    layers: [
      kick(K4, 112),
      l(36, [14], 90, .12),
      l(39, [4, 12], 102, .95),
      hat16(.42, 56, 72),
      openHat(OFF4, .88, 86, .22),
      l(37, [3, 7, 11, 15], 62, .14, {fillChance: .26}),
      l(39, [7, 15], 58, .06, {fillChance: .16}),
      l(45, [15], 72, .30, {fillOnly: true})
    ]
  },
  {
    name: 'Tech House',
    layers: [
      kick(K4, 115),
      l(36, [14], 96, .22),
      l(39, [4, 12], 104, .92),
      hat16(.72, 60, 82),
      openHat(OFF4, .35, 84, .16),
      l(38, [7, 15], 55, .20, {fillChance: .45}),
      l(37, [3, 7, 11, 15], 63, .18, {fillChance: .34}),
      l(45, [15], 76, .28, {fillOnly: true}),
      l(38, [14], 70, .30, {fillOnly: true})
    ]
  }
];

var styles = styleDefs.map(function (style) { return style.name; });

function style(value) { selectedStyle = Math.max(0, Math.min(styles.length - 1, Math.floor(value))); }
function bars(value) { selectedBars = Math.max(0, Math.min(barLengths.length - 1, Math.floor(value))); }
function status(text) { outlet(0, 'set', text); post('[Drum Generator] ' + text + '\n'); }

function addHit(notes, pitch, at, velocity, duration, rng) {
  var shaped = Math.round(velocity + (rng() - 0.5) * 14);
  notes.push({
    pitch: pitch,
    start_time: at,
    duration: duration || 0.12,
    velocity: Math.max(1, Math.min(127, shaped))
  });
}

function renderLayer(notes, layer, bar, fill, rng) {
  if (layer.fillOnly && !fill) return;
  var chance = fill && typeof layer.fillChance === 'number' ? layer.fillChance : layer.chance;
  for (var i = 0; i < layer.steps.length; i++) {
    var step = layer.steps[i];
    var stepChance = typeof chance === 'number' ? chance : chance[i];
    if (stepChance == null) stepChance = 1;
    if (rng() >= stepChance) continue;
    var velocity = layer.accent && layer.accent.indexOf(step) !== -1 ? layer.accentVelocity : layer.velocity;
    addHit(notes, layer.pitch, bar * 4 + step / 4, velocity, layer.duration, rng);
  }
}

function makeNotes(styleIndex, count, rng) {
  var style = styleDefs[styleIndex] || styleDefs[0];
  var notes = [];
  for (var b = 0; b < count; b++) {
    var fill = b % 4 === 3;
    for (var i = 0; i < style.layers.length; i++) {
      renderLayer(notes, style.layers[i], b, fill, rng);
    }
  }
  return notes;
}

function findOwnEmptySlot() {
  var path = 'this_device canonical_parent';
  var track = null;
  for (var depth = 0; depth < 32; depth++) {
    var node = new LiveAPI(path);
    if (!node.id) throw new Error('Nao foi possivel encontrar a faixa do dispositivo.');
    if (node.type === 'Track') { track = node; break; }
    path = node.unquotedpath + ' canonical_parent';
  }
  if (!track) throw new Error('Nao foi possivel encontrar a faixa do dispositivo.');
  if (Number(track.get('has_midi_input')) !== 1) throw new Error('A faixa do dispositivo nao e MIDI.');
  var count = Number(track.getcount('clip_slots'));
  if (!Number.isInteger(count) || count < 0) throw new Error('Nao foi possivel consultar os slots da faixa.');
  for (var i = 0; i < count; i++) {
    var slot = new LiveAPI(track.unquotedpath + ' clip_slots ' + i);
    if (slot.id && Number(slot.get('has_clip')) === 0) return slot;
  }
  return null;
}

function generate() {
  try {
    var slot = findOwnEmptySlot();
    if (!slot) { status('Nenhum slot vazio na faixa.'); return; }
    var count = barLengths[selectedBars];
    var notes = makeNotes(selectedStyle, count, Math.random);
    slot.call('create_clip', count * 4);
    var clip = new LiveAPI(slot.unquotedpath + ' clip');
    if (!clip.id) throw new Error('O Live nao retornou o clipe criado.');
    clip.call('add_new_notes', { notes: notes });
    clip.set('name', styles[selectedStyle] + ' Drums ' + count + ' bars');
    status('Criado: ' + styles[selectedStyle] + ' / ' + count + ' compasso(s).');
  } catch (e) { status('Falha ao gerar. Veja o Max Console.'); post('[Drum Generator] ' + e + '\n'); }
}
if (typeof module !== 'undefined') module.exports = { makeNotes: makeNotes, styles: styles, barLengths: barLengths };
