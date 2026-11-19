
var followLive = 0;
function follow(v) { followLive = Number(v) ? 1 : 0; }
function liveScale() {
 var song = new LiveAPI('live_set');
 if (!song.id) throw new Error('Live Set indisponivel');
 var rawRoot = song.get('root_note'), rootValue = Number(Array.isArray(rawRoot) ? rawRoot[0] : rawRoot);
 var intervals = song.get('scale_intervals');
 if (!Array.isArray(intervals)) intervals = [intervals];
 intervals = intervals.map(Number);
 if (!Number.isInteger(rootValue) || rootValue < 0 || rootValue > 11 || intervals.length < 3 || intervals.some(function (v, i) { return !Number.isInteger(v) || v < 0 || v > 11 || (i > 0 && v <= intervals[i-1]); }) || intervals[0] !== 0) throw new Error('Tom ou intervalos da escala do Live indisponiveis');
 var label = song.get('scale_name');
 return {root:rootValue, degrees:intervals, name:Array.isArray(label) ? label.join(' ') : String(label)};
}
// Max 9 v8: mantenha este arquivo ao lado do dispositivo .amxd.
inlets = 1;
outlets = 1;
var selectedKey = 0, selectedScale = 0, selectedBars = 1;
var names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var scaleNames = ['Menor natural','Maior','Penta menor','Penta maior','Dorico','Frigio','Menor harmonica'];
var scales = [[0,2,3,5,7,8,10],[0,2,4,5,7,9,11],[0,3,5,7,10],[0,2,4,7,9],[0,2,3,5,7,9,10],[0,1,3,5,7,8,10],[0,2,3,5,7,8,11]];
var lengths = [1,2,4,8];
function clamp(v, max) { v = Number(v); return isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0; }
function key(v) { selectedKey = clamp(v, 11); }
function scale(v) { selectedScale = clamp(v, scales.length - 1); }
function bars(v) { selectedBars = clamp(v, lengths.length - 1); }
function status(text) { outlet(0, 'set', text); post('[Mono 101 Lead] ' + text + '\n'); }
function makeNotes(root, scaleIndex, barCount, rng, liveDegrees) {
 var notes = [], degrees = liveDegrees || scales[scaleIndex], steps = barCount * 8, pos = 0, degree = 0;
 while (pos < steps) {
  if (pos > 0 && rng() < 0.18) { pos++; continue; }
  var span = rng() < 0.3 ? 2 : 1;
  if (rng() < 0.12) span = 4;
  span = Math.min(span, steps - pos);
  if (notes.length) {
   var movement = [-2,-1,-1,0,1,1,2][Math.floor(rng()*7)];
   degree = Math.max(0, Math.min(degrees.length * 2 - 1, degree + movement));
  }
  var pitch = 60 + root + degrees[degree % degrees.length] + 12 * Math.floor(degree / degrees.length);
  notes.push({pitch:pitch, start_time:pos * 0.5, duration:span * 0.5 - 0.04, velocity:Math.round(75 + rng() * 35)});
  pos += span;
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
  var count = lengths[selectedBars];
  var active = followLive ? liveScale() : {root:selectedKey,degrees:scales[selectedScale],name:scaleNames[selectedScale]};
  var notes = makeNotes(active.root, selectedScale, count, Math.random, active.degrees);
  slot.call('create_clip', count * 4);
  var clip = new LiveAPI(slot.unquotedpath + ' clip');
  if (!clip.id) throw new Error('O clipe criado nao foi encontrado.');
  clip.call('add_new_notes', {notes:notes});
  clip.set('name', 'Lead 101 - ' + names[active.root] + ' ' + active.name);
  status('Criado: ' + names[active.root] + ' ' + active.name + '.');
 } catch (error) {
  status('Falha. Consulte o Max Console.');
  post('[Mono 101 Lead] ' + error + '\n');
 }
}
if (typeof module !== 'undefined') module.exports = {makeNotes:makeNotes, scales:scales, lengths:lengths};
