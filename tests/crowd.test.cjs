#!/usr/bin/env node
/* Unit checks for EUROLAB v1.4 experimental calendar indicator. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..'),context={};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'assets/crowd-core.js'),'utf8'),context);
const model=JSON.parse(fs.readFileSync(path.join(root,'data/modelo-popularidade-v14.json'),'utf8'));
const {parse,normalize,evaluate}=context.EuroCrowd;
const ref=evaluate({numbers:[7,12,25,36,49],stars:[2,11]},model);
assert.equal(ref.calendar_numbers,3);
assert.equal(ref.relative_proxy,1);
assert.equal(ref.evidence_draws,399);
const sparse=evaluate({numbers:[32,33,37,42,50],stars:[1,12]},model);
assert.equal(sparse.calendar_numbers,0);
assert.equal(sparse.low_coverage,true);
assert.ok(sparse.relative_proxy<1);
const dates=evaluate({numbers:[1,4,11,24,31],stars:[3,7]},model);
assert.equal(dates.calendar_numbers,5);
assert.ok(dates.relative_proxy>1);
assert.deepEqual(Array.from(parse('01, 02; 12 18 34',5)),[1,2,12,18,34]);
assert.throws(()=>normalize([1,1,2,3,4],[1,2]),/inválidos/);
assert.throws(()=>normalize([1,2,3,4,51],[1,2]),/inválidos/);
assert.throws(()=>normalize([1,2,3,4,5],[0,12]),/Estrelas/);
assert.throws(()=>parse('1, 2, 3',5),/cinco/);
console.log('OK: indicadores, referência, validação de chaves e extrapolação identificada.');
