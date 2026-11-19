'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const {makeNotes, scales, lengths} = require('../src/m4l-mono-101-lead');
for (let key=0;key<12;key++) for(let scale=0;scale<scales.length;scale++) for(const bars of lengths) {
 for(let sample=0;sample<10;sample++) {
  const notes=makeNotes(key,scale,bars,Math.random);
  assert(notes.length>0);
  notes.forEach((n,i)=>{
   assert(scales[scale].includes(((n.pitch-60-key)%12+12)%12));
   assert(n.pitch>=0 && n.pitch<=127 && n.velocity>=1 && n.velocity<=127);
   assert(n.start_time>=0 && n.start_time+n.duration<=bars*4);
   if(i) assert(notes[i-1].start_time+notes[i-1].duration<=n.start_time);
  });
 }
}
const patch=require('../devices/m4l-mono-101').build().patcher;
const objects=patch.boxes.map(({box})=>box);
const button=objects.find(b=>b.varname==='Generate Lead');
const defer=objects.find(b=>b.text==='deferlow');
const message=objects.find(b=>b.text==='generate');
const script=objects.find(b=>b.text==='v8 m4l-mono-101-lead.js');
function link(a,b){assert(patch.lines.some(({patchline:l})=>l.source[0]===a.id&&l.destination[0]===b.id));}
assert.equal(button.mode,0);link(button,defer);link(defer,message);link(message,script);
let calls=[], occupied=0, midi=1;
class LiveAPI {
 constructor(path) { this.path=path; this.id=1; this.type=path==='this_device canonical_parent'?'Track':'ClipSlot'; this.unquotedpath=this.type==='Track'?'live_set tracks 0':path; }
  getcount() { return 1; }
 get(prop){return [prop==='has_clip'?occupied:midi];}
 call(...args){calls.push(args);}
 set(...args){calls.push(['set',...args]);}
}
const context={LiveAPI,Math,outlet(){},post(){}};vm.createContext(context);
vm.runInContext(fs.readFileSync('src/m4l-mono-101-lead.js','utf8'),context);
context.key(9);context.scale(1);context.bars(2);context.generate();
assert(calls.some(c=>c[0]==='create_clip' && c[1]===16));
assert(calls.some(c=>c[0]==='add_new_notes' && c[1].notes.length>0));
calls=[];occupied=1;context.generate();assert.equal(calls.length,0);
calls=[];occupied=0;midi=0;context.generate();assert.equal(calls.length,0);
console.log('OK: escalas, duracoes, monofonia, botao e criacao simulada.');
