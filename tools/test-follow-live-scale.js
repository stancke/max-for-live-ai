'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
for (const file of ['src/m4l-bassline-runtime.js','src/m4l-acid-clip-runtime.js','src/m4l-harmonia-runtime.js','src/m4l-mono-101-lead.js']) {
 let calls=[], root=7, intervals=[0,1,4,5,7,8,11];
 class LiveAPI {
  constructor(path) { this.path=path; this.id=1; this.type=path==='this_device canonical_parent'?'Track':'ClipSlot'; this.unquotedpath=this.type==='Track'?'live_set tracks 0':path; }
  getcount() { return 1; }
  get(prop){if(prop==='root_note')return [root];if(prop==='scale_intervals')return intervals;if(prop==='scale_name')return ['Custom'];if(prop==='has_clip')return [0];if(prop==='has_midi_input')return [1];throw Error(prop);}
  call(...args){calls.push(args);}
  set(...args){calls.push(['set',...args]);}
 }
 const context={LiveAPI,Math,outlet(){},post(){}};vm.createContext(context);vm.runInContext(fs.readFileSync(file,'utf8'),context);
 context.follow(1);context.generate();
 let notes=calls.find(x=>x[0]==='add_new_notes')[1].notes;
 assert(notes.length);assert(notes.every(n=>intervals.includes((n.pitch-root+1200)%12)),file);
 assert(calls.some(x=>x[0]==='set' && x[2].includes('G Custom')));
 root=2; intervals=[0,2,4,7,9];calls=[];context.generate();notes=calls.find(x=>x[0]==='add_new_notes')[1].notes;
 assert(notes.every(n=>intervals.includes((n.pitch-root+1200)%12)));
 intervals=[];calls=[];context.generate();assert(!calls.some(x=>x[0]==='create_clip'));
 context.follow(0);calls=[];context.generate();assert(calls.some(x=>x[0]==='add_new_notes'));
}
console.log('OK: escala Live, atualizacoes, falha segura e modo manual nos devices.');
