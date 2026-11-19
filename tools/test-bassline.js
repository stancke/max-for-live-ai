'use strict';
const assert=require('assert');
const {makeNotes,scales,lengths,styleNames}=require('../src/m4l-bassline-runtime');
for(let st=0;st<styleNames.length;st++)for(let root=0;root<12;root++)for(const degrees of scales)for(const bars of lengths){
 const notes=makeNotes(st,root,degrees,bars,Math.random);assert(notes.length);
 for(let i=0;i<notes.length;i++){const n=notes[i];assert(degrees.includes(((n.pitch-36-root)%12+12)%12));assert(n.pitch>=0&&n.pitch<=127&&n.velocity>=1&&n.velocity<=127);assert(n.start_time>=0&&n.start_time+n.duration<=bars*4+1e-9);if(i)assert(notes[i-1].start_time+notes[i-1].duration<=n.start_time+1e-9);}
}
const sample=Array.from({length:styleNames.length},(_,i)=>makeNotes(i,0,scales[0],1,()=>0.8));
assert.deepStrictEqual(sample[0].map(n=>n.start_time),[0.5,1.5,2.5,3.5]);
assert(sample[3].length>sample[0].length);assert(sample[4].some(n=>Math.abs(n.start_time*3-Math.round(n.start_time*3))<1e-9&&n.start_time%0.25!==0));
assert.notDeepStrictEqual(sample[2].map(n=>n.pitch),sample[0].map(n=>n.pitch));
const patch=require('../devices/m4l-bassline-generator').build().patcher,boxes=patch.boxes.map(x=>x.box),button=boxes.find(b=>b.varname==='Gerar Bassline'),defer=boxes.find(b=>b.text==='deferlow'),msg=boxes.find(b=>b.text==='generate'),script=boxes.find(b=>b.text==='v8 m4l-bassline-runtime.js');
function link(a,b){assert(patch.lines.some(({patchline:l})=>l.source[0]===a.id&&l.destination[0]===b.id));}assert.equal(button.mode,0);link(button,defer);link(defer,msg);link(msg,script);
console.log('OK: ritmos, escalas, limites, monofonia e botao.');
