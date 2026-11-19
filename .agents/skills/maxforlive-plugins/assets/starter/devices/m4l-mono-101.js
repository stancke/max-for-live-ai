'use strict';
const {PatchBuilder}=require('../src/patch');
function build(){
 const p=new PatchBuilder({deviceType:'instrument',width:710,title:'M4L Mono 101'});
 p.comment('MONO 101  |  INSPIRADO NO SH-101', {rect:[8,3,420,16]});
 const config=[['Cutoff','CUT',80,8000,1200,3],['Resonance','RES',0,0.9,0.35,1],['Filter Env','ENV',0,100,50,5],['Decay','DEC',40,2000,450,2],['Sub Level','SUB',0,100,35,5],['Volume','VOL',-36,0,-12,4]];
 const c=config.map((v,i)=>{let x=8+i*71;p.comment(v[1],{rect:[x,24,60,14]});return p.dial({name:v[0],shortname:v[1],min:v[2],max:v[3],initial:v[4],unitstyle:v[5],rect:[x,41,55,55]});});
 p.comment('OSC', {rect:[8,107,45,14]});const wave=p.menu({name:'Wave',items:['Saw','Pulse'],rect:[48,105,100,20]});
 p.comment('PULSE WIDTH', {rect:[165,107,110,14]});const width=p.dial({name:'Pulse Width',shortname:'PW',min:0.1,max:0.9,initial:0.5,rect:[275,99,55,55]});
 p.comment('MONO  |  MIDI IN', {rect:[8,143,180,14]});
 p.comment('GERADOR DE LEAD', {rect:[447,3,250,16]});
 p.comment('TOM', {rect:[447,24,60,14]});
 p.comment('ESCALA', {rect:[520,24,175,14]});
 const leadKey=p.menu({name:'Lead Key',shortname:'Tom',items:['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],rect:[447,41,65,20]});
 const leadScale=p.menu({name:'Lead Scale',shortname:'Escala',items:['Menor natural','Maior','Penta menor','Penta maior','Dorico','Frigio','Menor harmonica'],rect:[520,41,180,20]});
 p.comment('COMPASSOS (4/4)', {rect:[447,67,125,14]});
 const leadBars=p.menu({name:'Lead Bars',shortname:'Comp',items:['1','2','4','8'],initial:1,rect:[447,83,65,20]});
 p.comment('TOM LIVE', {rect:[335,105,100,14]});
 const leadFollow=p.toggle({name:'Follow Live Scale',shortname:'Live',rect:[365,125,20,20]});
 const leadFollowPrep=p.obj('prepend follow',{rect:[1210,110,90,20]});
 const leadButton=p.textButton({name:'Generate Lead',shortname:'Gerar',text:'GERAR LEAD',rect:[520,83,180,22]});
 const leadStatus=p.add({maxclass:'live.comment',text:'Usa o primeiro slot vazio da faixa.',numinlets:1,numoutlets:0,patching_rect:[447,112,253,40],presentation:1,presentation_rect:[447,112,253,40]});
 const leadRuntime=p.obj('v8 m4l-mono-101-lead.js',{inlets:1,outlets:1,outlettype:[''],rect:[1100,180,190,20]});
 p.connect(leadFollow,0,leadFollowPrep,0);p.connect(leadFollowPrep,0,leadRuntime,0);
 const leadDefer=p.obj('deferlow',{rect:[1100,120,60,20]});
 const leadGenerate=p.message('generate',{rect:[1100,150,70,20]});
 for(const [control,method,y] of [[leadKey,'key',20],[leadScale,'scale',50],[leadBars,'bars',80]]){
  const prepend=p.obj(`prepend ${method}`,{rect:[1100,y,100,20]});
  p.connect(control,0,prepend,0);p.connect(prepend,0,leadRuntime,0);
 }
 p.connect(leadButton,0,leadDefer,0);p.connect(leadDefer,0,leadGenerate,0);p.connect(leadGenerate,0,leadRuntime,0);p.connect(leadRuntime,0,leadStatus,0);
 const o=(text,x,y,opts={})=>p.obj(text,{rect:[x,y,110,20],...opts});
 const midi=p.midiIn([470,20,50,20]),parse=o('midiparse',470,50),order=o('t l l',470,80,{outlets:2,outlettype:['','']}),notes=o('stripnote',600,110,{inlets:2,outlets:2,outlettype:['int','int']}),mtof=o('mtof',600,140),smooth=o('pack f 5',600,170),freq=o('line~',600,200),unpack=o('unpack 0 0',470,110),gate=o('> 0',470,140),select=o('sel 0 1',470,170),off=p.message('0 80',{rect:[470,200,50,20]}),on=p.message('1 4',{rect:[530,200,50,20]}),amp=o('line~',470,230),decay=o('f 450',750,170),filterEnv=p.message('1 3 0 $1',{rect:[750,200,80,20]}),filterLine=o('line~',750,230);
 p.connect(midi,0,parse,0);p.connect(parse,0,order,0);p.connect(order,1,notes,0);p.connect(notes,0,mtof,0);p.connect(mtof,0,smooth,0);p.connect(smooth,0,freq,0);p.connect(order,0,unpack,0);p.connect(unpack,1,gate,0);p.connect(gate,0,select,0);p.connect(select,0,off,0);p.connect(select,1,on,0);p.connect(off,0,amp,0);p.connect(on,0,amp,0);p.connect(select,1,decay,0);p.connect(c[3],0,decay,1);p.connect(decay,0,filterEnv,0);p.connect(filterEnv,0,filterLine,0);
 const saw=o('saw~',600,260),pulse=o('rect~',700,260),half=o('*~ 0.5',800,200),sub=o('rect~',800,230),sel=o('selector~ 2 1',600,290),waveIndex=o('+ 1',700,290),subLevel=o('* 0.01',800,290),subGain=o('*~',800,320),mix=o('+~',600,350),mixTrim=o('*~ 0.3',600,380),depth=o('* 50.',750,350),envDepth=o('*~',750,380),cutAdd=o('+~',750,410),filter=o('lores~',600,410),vca=o('*~',600,440),vol=o('dbtoa',750,440),gain=o('*~',600,470),out=p.audioOut([600,500,60,20]);
 p.connect(freq,0,saw,0);p.connect(freq,0,pulse,0);p.connect(freq,0,half,0);p.connect(half,0,sub,0);p.connect(width,0,pulse,1);p.connect(wave,0,waveIndex,0);p.connect(waveIndex,0,sel,0);p.connect(saw,0,sel,1);p.connect(pulse,0,sel,2);p.connect(c[4],0,subLevel,0);p.connect(subLevel,0,subGain,1);p.connect(sub,0,subGain,0);p.connect(sel,0,mix,0);p.connect(subGain,0,mix,1);p.connect(mix,0,mixTrim,0);p.connect(mixTrim,0,filter,0);p.connect(c[2],0,depth,0);p.connect(depth,0,envDepth,1);p.connect(filterLine,0,envDepth,0);p.connect(envDepth,0,cutAdd,0);p.connect(c[0],0,cutAdd,1);p.connect(cutAdd,0,filter,1);p.connect(c[1],0,filter,2);p.connect(filter,0,vca,0);p.connect(amp,0,vca,1);p.connect(vca,0,gain,0);p.connect(c[5],0,vol,0);p.connect(vol,0,gain,1);p.connect(gain,0,out,0);p.connect(gain,0,out,1);
 const init=p.message('bang',{rect:[950,50,50,20]}),device=p.thisDevice([950,20,80,20]);p.connect(device,0,init,0);for(const control of [...c,wave,width,leadKey,leadScale,leadBars])p.connect(init,0,control,0);
 const followInit=p.message('outputvalue',{rect:[950,80,80,20]});p.connect(device,0,followInit,0);p.connect(followInit,0,leadFollow,0);
 return p.finish();
}
module.exports={slug:'m4l-mono-101',name:'M4L Mono 101',type:'instrument',width:710,dependencies:['src/m4l-mono-101-lead.js'],build};
