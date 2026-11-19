
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
inlets=1; outlets=1;
var root=0, mode=0;
var names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var scales=[[0,2,4,5,7,9,11],[0,2,3,5,7,8,10],[0,2,4,7,9],[0,3,5,7,10]];
var labels=['Maior','Menor natural','Pentatonica maior','Pentatonica menor'];
function key(v){root=Math.max(0,Math.min(11,Math.floor(v)));}
function scale(v){mode=Math.max(0,Math.min(3,Math.floor(v)));}
function status(t){outlet(0,'set',t);post('[Harmonia] '+t+'\n');}
function makeNotes(r,m,rng,liveDegrees){
 var a=liveDegrees || scales[m], notes=[], previous=-1;
 for(var i=0;i<4;i++) {
  var degree=Math.floor(rng()*a.length);
  if(degree===previous) degree=(degree+1+Math.floor(rng()*(a.length-1)))%a.length;
  previous=degree;
  for(var j=0;j<3;j++) {var idx=degree+j*2;var pitch=48+r+a[idx%a.length]+12*Math.floor(idx/a.length);notes.push({pitch:pitch,start_time:i*4,duration:3.8,velocity:90});}
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

function generate(){try{
    var slot = findOwnEmptySlot();
    if (!slot) { status('Nenhum slot vazio na faixa.'); return; }
 var active=followLive ? liveScale() : {root:root,degrees:scales[mode],name:labels[mode]};
 var notes=makeNotes(active.root,mode,Math.random,active.degrees);slot.call('create_clip',16);
 var clip=new LiveAPI(slot.unquotedpath+' clip');if(!clip.id) throw new Error('Clipe nao encontrado');
 clip.call('add_new_notes',{notes:notes});clip.set('name',names[active.root]+' '+active.name+' progressao');
 status('Criado: '+names[active.root]+' '+active.name+' - 4 acordes.');
 }catch(e){status('Falha ao gerar. Veja o Max Console.');post('[Harmonia] '+e+'\n');}}
if(typeof module!=='undefined') module.exports={makeNotes:makeNotes,scales:scales};
