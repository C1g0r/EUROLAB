#!/usr/bin/env node
/* EUROLAB v1.5 — verify both methods and ticket separation, no dependencies. */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const engine=require('../assets/duas-chaves-core.js');
const next=(()=>{let x=20261120;return n=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x%n;};})();
let count=0;
for(let i=0;i<5000;i++){
  const result=engine.generate(next);
  assert.ok(engine.validate(result),'Pair must satisfy all rules');
  const {first,second}=result;
  assert.equal(first.numbers.length,5);
  assert.equal(first.stars.length,2);
  assert.equal(second.numbers.filter(n=>n<=31).length,2);
  assert.equal(second.numbers.filter(n=>n>=32).length,3);
  assert.ok(first.numbers.every(n=>!second.numbers.includes(n)),'No overlapping numbers');
  assert.ok(first.stars.every(n=>!second.stars.includes(n)),'No overlapping stars');
  assert.equal(new Set(first.numbers).size,5);
  assert.equal(new Set(second.stars).size,2);
  count++;
}
assert.deepEqual(engine.generate(()=>0),{
  first:{numbers:[1,2,3,4,5],stars:[1,2]},
  second:{numbers:[6,7,32,33,34],stars:[3,4]}
});
assert.throws(()=>engine.generate(()=>-1),/aleatoriedade inválida/);
assert.throws(()=>engine.generate(()=>100),/aleatoriedade inválida/);
const bad=engine.generate(()=>0);
bad.second.stars=[1,2];
assert.equal(engine.validate(bad),false,'Star overlap must be rejected');
const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
assert.equal((html.match(/<article class="ticket/g)||[]).length,2);
for(const id of ['key1-numbers','key1-stars','key2-numbers','key2-stars','copy-1','copy-2','copy-both','generate','status']){
  assert.ok(html.includes('id="'+id+'"'),'Missing UI control '+id);
}
assert.ok(html.includes('painel-investigacao.html'),'Research link preserved');
assert.ok(fs.existsSync(path.resolve(__dirname,'../painel-investigacao.html')),'Research archive missing');
console.log('OK: '+count+' valid pairs, no overlap, method 2 calendar constraints, copy controls and research archive.');
