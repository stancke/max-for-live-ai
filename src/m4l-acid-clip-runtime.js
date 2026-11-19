
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
inlets = 1; outlets = 1;
var selectedKey = 0, selectedScale = 0, selectedBars = 1, selectedRate = 1;
var names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var scales = [[0,2,3,5,7,8,10],[0,2,4,5,7,9,11],[0,3,5,7,10],[0,2,4,7,9],[0,2,3,5,7,9,10],[0,1,3,5,7,8,10],[0,2,3,5,7,8,11]];
var scaleNames = ['Menor','Maior','Penta menor','Penta maior','Dorico','Frigio','Menor harmonica'];
var lengths = [1,2,4,8], divisions = [0.5,0.25,0.125];
function clamp(v, max) { v=Number(v); return isFinite(v) ? Math.max(0,Math.min(max,Math.floor(v))) : 0; }
function key(v) { selectedKey=clamp(v,11); }
function scale(v) { selectedScale=clamp(v,scales.length-1); }
function bars(v) { selectedBars=clamp(v,lengths.length-1); }
function rate(v) { selectedRate=clamp(v,2); }
function status(t) { outlet(0,'set',t); post('[Acid clip] '+t+'\n'); }
function makeNotes(k,s,b,r,rng,liveDegrees) {
 var result=[], scaleNotes=liveDegrees || scales[s], step=divisions[r], count=Math.round(b*4/step), last=0;
 for(var i=0;i<count;i++) {
  if(i!==0 && rng()>=0.68) continue;
  if(i===0) last=0; else if(rng()>0.22) last=scaleNotes[Math.floor(rng()*scaleNotes.length)];
  var pitch=36+k+last+(rng()<0.13?12:0);
  var accent=rng()<0.25;
  result.push({pitch:pitch,start_time:i*step,duration:step*(rng()<0.2?0.95:0.72),velocity:accent?115:80});
 }
 return result;
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
  var count=lengths[selectedBars];
  var active=followLive ? liveScale() : {root:selectedKey,degrees:scales[selectedScale],name:scaleNames[selectedScale]};
  var notes=makeNotes(active.root,selectedScale,count,selectedRate,Math.random,active.degrees);
  slot.call('create_clip',count*4);
  var clip=new LiveAPI(slot.unquotedpath+' clip');
  if(!clip.id) throw new Error('Nao foi possivel encontrar o clipe criado.');
  clip.call('add_new_notes',{notes:notes});
  clip.set('name','Acid '+names[active.root]+' '+active.name);
  status('Criado: '+names[active.root]+' '+active.name+'.');
 } catch(e) {status('Erro. Consulte o Max Console.');post('[Acid clip] '+e+'\n');}
}
if(typeof module!=='undefined') module.exports={makeNotes:makeNotes,scales:scales,divisions:divisions,lengths:lengths};
