const assert=require('assert');const {makeNotes,scales,divisions}=require('../src/m4l-acid-clip-runtime');
for(let k=0;k<12;k++)for(let s=0;s<scales.length;s++)for(let r=0;r<3;r++)for(const bars of [1,2,4,8]){
 const notes=makeNotes(k,s,bars,r,Math.random); assert(notes.length>0);
 for(const n of notes){assert(scales[s].includes(((n.pitch-36-k)%12+12)%12));assert(n.start_time>=0 && n.start_time+n.duration<=bars*4);assert([80,115].includes(n.velocity));assert(Math.abs(n.start_time/divisions[r]-Math.round(n.start_time/divisions[r]))<1e-8);}
}
console.log('OK: tonalidades, escalas, duracoes e divisao.');
