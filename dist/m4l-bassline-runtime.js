// Max 9 v8 runtime. Mantenha este arquivo junto do .amxd.
inlets=1; outlets=1;
var styleNames=['Offbeat','Offbeat Groove','Offbeat Octave','Rolling','Rolling Triplet','Rolling Groove','Running'];
var keyNames=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var scaleNames=['Menor natural','Maior','Penta menor','Penta maior','Dorico','Frigio','Menor harmonica'];
var scales=[[0,2,3,5,7,8,10],[0,2,4,5,7,9,11],[0,3,5,7,10],[0,2,4,7,9],[0,2,3,5,7,9,10],[0,1,3,5,7,8,10],[0,2,3,5,7,8,11]];
var lengths=[1,2,4,8];
var selectedStyle=0,selectedKey=0,selectedScale=0,selectedBars=1,followLive=0;
function clamp(v,max){v=Number(v);return isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;}
function style(v){selectedStyle=clamp(v,styleNames.length-1);}
function key(v){selectedKey=clamp(v,11);}
function scale(v){selectedScale=clamp(v,scales.length-1);}
function bars(v){selectedBars=clamp(v,lengths.length-1);}
function follow(v){followLive=Number(v)?1:0;}
function status(s){outlet(0,'set',s);post('[Bassline] '+s+'\n');}
function liveScale(){
 var song=new LiveAPI('live_set');if(!song.id)throw Error('Live Set indisponivel');
 var rv=song.get('root_note'), root=Number(Array.isArray(rv)?rv[0]:rv), intervals=song.get('scale_intervals');
 if(!Array.isArray(intervals))intervals=[intervals]; intervals=intervals.map(Number);
 if(!Number.isInteger(root)||root<0||root>11||intervals.length<3||intervals[0]!==0||intervals.some(function(v,i){return !Number.isInteger(v)||v<0||v>11||(i>0&&v<=intervals[i-1]);}))throw Error('Escala do Live indisponivel');
 var label=song.get('scale_name');return {root:root,degrees:intervals,name:Array.isArray(label)?label.join(' '):String(label)};
}
function findOwnEmptySlot(){
 var path='this_device canonical_parent',track=null;
 for(var depth=0;depth<32;depth++){var node=new LiveAPI(path);if(!node.id)throw Error('Faixa nao encontrada');if(node.type==='Track'){track=node;break;}path=node.unquotedpath+' canonical_parent';}
 if(!track||Number(track.get('has_midi_input'))!==1)throw Error('Faixa MIDI nao encontrada');
 var count=Number(track.getcount('clip_slots'));if(!Number.isInteger(count)||count<0)throw Error('Slots indisponiveis');
 for(var i=0;i<count;i++){var slot=new LiveAPI(track.unquotedpath+' clip_slots '+i);if(slot.id&&Number(slot.get('has_clip'))===0)return slot;}
 return null;
}
// Grade em semicolcheias, 16 passos por compasso; rolling triplet usa tercinas de colcheia.
function makeNotes(styleIndex,root,degrees,barCount,rng){
 var notes=[],positions,step;
 if(styleIndex===0){positions=[2,6,10,14];step=0.25;}
 else if(styleIndex===1){positions=[2,6,9,10,14];step=0.25;}
 else if(styleIndex===2){positions=[2,6,10,14];step=0.25;}
 else if(styleIndex===3){positions=[1,2,3,5,6,7,9,10,11,13,14,15];step=0.25;}
 else if(styleIndex===4){positions=[1,2,4,5,7,8,10,11];step=1/3;}
 else if(styleIndex===5){positions=[1,2,3,6,7,9,10,11,14,15];step=0.25;}
 else {positions=[0,2,4,6,8,10,12,14];step=0.25;}
 var fifth=degrees.reduce(function(best,d){return Math.abs(d-7)<Math.abs(best-7)?d:best;},degrees[0]);
 for(var bar=0;bar<barCount;bar++)for(var i=0;i<positions.length;i++){
  var pos=positions[i], at=bar*4+pos*step;
  if(styleIndex===1 && pos===9 && rng()<0.45)continue;
  if(styleIndex===5 && rng()<0.10)continue;
  var degree=0,octave=0;
  if(styleIndex===2 && i%2===1)octave=12;
  if(styleIndex===1 && pos===9)degree=fifth;
  if(styleIndex===6){var seq=[0,1,2,3,4,3,2,1];degree=degrees[seq[(i+bar)%seq.length]%degrees.length];}
  if(styleIndex>=3&&styleIndex<=5 && bar%2===1 && i===positions.length-1 && rng()<0.6)degree=fifth;
  var spacing=(i+1<positions.length?positions[i+1]-pos:Math.round(4/step)-pos)*step;
  var duration=Math.min(spacing*0.82,styleIndex<=2?0.42:0.22);
  notes.push({pitch:36+root+degree+octave,start_time:at,duration:duration,velocity:Math.round((i%3===0?102:84)+rng()*12)});
 }
 return notes;
}
function generate(){
 try{
  var slot=findOwnEmptySlot();if(!slot){status('Nenhum slot vazio na faixa.');return;}
  var active=followLive?liveScale():{root:selectedKey,degrees:scales[selectedScale],name:scaleNames[selectedScale]};
  var count=lengths[selectedBars],notes=makeNotes(selectedStyle,active.root,active.degrees,count,Math.random);
  slot.call('create_clip',count*4);
  var clip=new LiveAPI(slot.unquotedpath+' clip');if(!clip.id)throw Error('Clipe nao encontrado');
  clip.call('add_new_notes',{notes:notes});clip.set('name',styleNames[selectedStyle]+' Bass - '+keyNames[active.root]+' '+active.name);
  status('Criado: '+styleNames[selectedStyle]+' - '+keyNames[active.root]+' '+active.name);
 }catch(e){status('Falha. Consulte o Max Console.');post('[Bassline] '+e+'\n');}
}
if(typeof module!=='undefined')module.exports={makeNotes:makeNotes,scales:scales,lengths:lengths,styleNames:styleNames};
