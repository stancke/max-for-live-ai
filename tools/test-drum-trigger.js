const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const patch = require('../devices/m4l-drum-generator').build().patcher;
const boxes = patch.boxes.map(x=>x.box);
const button = boxes.find(x=>x.varname === 'Generate Drums');
const defer = boxes.find(x=>x.text === 'deferlow');
const message = boxes.find(x=>x.text === 'generate');
const script = boxes.find(x=>x.text === 'v8 m4l-drum-generator-runtime.js');
function link(a,b) { assert(patch.lines.some(x=>x.patchline.source[0]===a.id && x.patchline.destination[0]===b.id)); }
assert.strictEqual(button.mode, 0); link(button,defer); link(defer,message); link(message,script);
let calls=[], occupied=0;
class LiveAPI {
  constructor(path) { this.path=path; this.id=1; this.type=path==='this_device canonical_parent'?'Track':'ClipSlot'; this.unquotedpath=this.type==='Track'?'live_set tracks 0':path; }
  getcount() { return 1; }
  get(prop) { return prop==='has_clip'? [occupied] : [1]; }
  call(...args) { calls.push(args); }
  set(...args) { calls.push(['set',...args]); }
}
const ctx={LiveAPI,Math,outlet(){},post(){}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/m4l-drum-generator-runtime.js','utf8'),ctx);
ctx.style(1); ctx.bars(2); ctx.generate();
assert(calls.some(x=>x[0]==='create_clip' && x[1]===16));
assert(calls.some(x=>x[0]==='add_new_notes' && x[1].notes.length>0));
calls=[];occupied=1;ctx.generate(); assert.strictEqual(calls.length,0);
console.log('OK: botao, geracao simulada e protecao de slot ocupado.');
