'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const files=['src/m4l-bassline-runtime.js','src/m4l-acid-clip-runtime.js','src/m4l-drum-generator-runtime.js','src/m4l-harmonia-runtime.js','src/m4l-mono-101-lead.js'];
for(const file of files){
 let occupied=[1,0,1,0,1], calls=[], outputs=[], insideRack=false;
 class LiveAPI {
  constructor(path){this.path=path;this.id=1;this.type='';this.unquotedpath=path;
   if(path==='this_device canonical_parent'){this.type=insideRack?'Chain':'Track';this.unquotedpath=insideRack?'rack_chain':'live_set tracks 3';}
   if(path==='rack_chain canonical_parent'){this.type='Device';this.unquotedpath='rack_device';}
   if(path==='rack_device canonical_parent'){this.type='Track';this.unquotedpath='live_set tracks 3';}
  }
  getcount(name){assert.equal(name,'clip_slots');return occupied.length;}
  get(prop){if(prop==='has_midi_input')return [1];if(prop==='has_clip'){let match=this.path.match(/clip_slots (\d+)$/);assert(match);return [occupied[Number(match[1])]];}throw Error('unexpected '+prop);}
  call(...args){calls.push({path:this.path,args});}
  set(...args){calls.push({path:this.path,args});}
 }
 const c={LiveAPI,Math,outlet(...v){outputs.push(v)},post(){}};vm.createContext(c);vm.runInContext(fs.readFileSync(file,'utf8'),c);
 c.generate();assert(calls.some(c=>c.path==='live_set tracks 3 clip_slots 1'&&c.args[0]==='create_clip'),file);
 assert(calls.some(c=>c.path==='live_set tracks 3 clip_slots 1 clip'&&c.args[0]==='add_new_notes'),file);
 calls=[];insideRack=true;c.generate();assert(calls.some(c=>c.path==='live_set tracks 3 clip_slots 1'&&c.args[0]==='create_clip'),file+' rack');
 occupied=[1,1,1];calls=[];outputs=[];c.generate();assert.equal(calls.length,0);assert(outputs.some(o=>String(o[2]).includes('Nenhum slot vazio')));
 occupied=[];calls=[];c.generate();assert.equal(calls.length,0);
}
console.log('OK: primeira vaga da propria faixa, Rack, faixa cheia e sem cenas.');
