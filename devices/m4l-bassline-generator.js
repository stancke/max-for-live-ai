'use strict';
const { PatchBuilder } = require('../src/patch');
function build() {
 const p = new PatchBuilder({deviceType:'midi_effect',width:520,title:'M4L Bassline Generator'});
 p.comment('BASSLINE GENERATOR', {rect:[8,3,300,18]});
 p.comment('ESTILO', {rect:[8,25,130,14]});
 p.comment('TOM', {rect:[165,25,70,14]});
 p.comment('ESCALA', {rect:[240,25,160,14]});
 p.comment('COMPASSOS', {rect:[410,25,100,14]});
 const style=p.menu({name:'Estilo',items:['Offbeat','Offbeat Groove','Offbeat Octave','Rolling','Rolling Triplet','Rolling Groove','Running'],rect:[8,41,148,20]});
 const key=p.menu({name:'Tom',items:['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],rect:[165,41,66,20]});
 const scale=p.menu({name:'Escala',items:['Menor natural','Maior','Penta menor','Penta maior','Dorico','Frigio','Menor harmonica'],rect:[240,41,160,20]});
 const bars=p.menu({name:'Compassos',items:['1','2','4','8'],initial:1,rect:[410,41,65,20]});
 const gen=p.textButton({name:'Gerar Bassline',shortname:'Gerar',text:'GERAR BASSLINE',rect:[8,83,180,24]});
 p.comment('TOM LIVE', {rect:[210,80,80,16]});
 const follow=p.toggle({name:'Follow Live Scale',shortname:'Live',rect:[240,99,20,20]});
 p.comment('Primeiro slot vazio da propria faixa', {rect:[8,122,300,15]});
 const status=p.add({maxclass:'live.comment',text:'Pronto para gerar.',numinlets:1,numoutlets:0,patching_rect:[8,140,495,17],presentation:1,presentation_rect:[8,140,495,17]});
 const input=p.midiIn([550,20,50,20]),out=p.midiOut([550,50,50,20]);p.connect(input,0,out,0);
 const js=p.obj('v8 m4l-bassline-runtime.js',{inlets:1,outlets:1,outlettype:[''],rect:[790,230,180,20]});
 for(const [control,method,y] of [[style,'style',20],[key,'key',50],[scale,'scale',80],[bars,'bars',110],[follow,'follow',140]]) {
  const prep=p.obj('prepend '+method,{rect:[650,y,105,20]});p.connect(control,0,prep,0);p.connect(prep,0,js,0);
 }
 const defer=p.obj('deferlow',{rect:[650,175,65,20]}),msg=p.message('generate',{rect:[730,175,70,20]});
 p.connect(gen,0,defer,0);p.connect(defer,0,msg,0);p.connect(msg,0,js,0);p.connect(js,0,status,0);
 const device=p.thisDevice([1010,20,80,20]),init=p.message('bang',{rect:[1010,50,50,20]}),toggleInit=p.message('outputvalue',{rect:[1010,80,80,20]});
 p.connect(device,0,init,0);for(const control of [style,key,scale,bars])p.connect(init,0,control,0);
 p.connect(device,0,toggleInit,0);p.connect(toggleInit,0,follow,0);
 return p.finish();
}
module.exports={slug:'m4l-bassline-generator',name:'M4L Bassline Generator',type:'midi_effect',width:520,dependencies:['src/m4l-bassline-runtime.js'],build};
