'use strict';
const { PatchBuilder } = require('../src/patch');
function build() {
 const p = new PatchBuilder({deviceType:'midi_effect',width:460,title:'M4L Harmonia'});
 p.comment('GERADOR DE PROGRESSOES', {rect:[8,5,340,20]});
 p.comment('TONALIDADE', {rect:[8,30,150,15]}); p.comment('ESCALA', {rect:[180,30,150,15]});
 const key=p.menu({name:'Tonalidade',items:['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],rect:[10,48,150,20]});
 const scale=p.menu({name:'Escala',items:['Maior','Menor natural','Pentatonica maior','Pentatonica menor'],rect:[180,48,170,20]});
 const button=p.textButton({name:'Gerar progressao',text:'GERAR CLIPE',rect:[10,80,160,24]});
 p.comment('TOM LIVE', {rect:[360,30,90,15]});
 const sync=p.toggle({name:'Follow Live Scale',shortname:'Live',rect:[385,50,20,20]});
 const syncMsg=p.obj('prepend follow',{rect:[730,80,90,20]});
 const syncInit=p.message('outputvalue',{rect:[730,50,80,20]});
 p.comment('Usa o primeiro slot vazio da faixa.', {rect:[8,112,344,16]});
 const status=p.add({maxclass:'live.comment',text:'Pronto: primeiro slot vazio da faixa.',numinlets:1,numoutlets:0,patching_rect:[8,137,344,18],presentation:1,presentation_rect:[8,137,344,18]});
 const input=p.midiIn([400,20,50,20]), output=p.midiOut([400,50,50,20]); p.connect(input,0,output,0);
 const js=p.obj('v8 m4l-harmonia-runtime.js',{inlets:1,outlets:1,outlettype:[''],rect:[580,210,200,20]});
 const k=p.obj('prepend key',{rect:[420,90,80,20]}), s=p.obj('prepend scale',{rect:[510,90,80,20]}), d=p.obj('deferlow',{rect:[420,130,60,20]}), msg=p.message('generate',{rect:[500,130,70,20]}), init=p.message('bang',{rect:[650,50,50,20]}), dev=p.thisDevice([650,20,80,20]);
 p.connect(key,0,k,0);p.connect(k,0,js,0);p.connect(scale,0,s,0);p.connect(s,0,js,0);p.connect(button,0,d,0);p.connect(d,0,msg,0);p.connect(msg,0,js,0);p.connect(dev,0,init,0);p.connect(init,0,key,0);p.connect(init,0,scale,0);p.connect(js,0,status,0);
 p.connect(dev,0,syncInit,0);p.connect(syncInit,0,sync,0);p.connect(sync,0,syncMsg,0);p.connect(syncMsg,0,js,0);
 return p.finish();
}
module.exports={slug:'m4l-harmonia',name:'M4L Harmonia',type:'midi_effect',width:460,dependencies:['src/m4l-harmonia-runtime.js'],build};
