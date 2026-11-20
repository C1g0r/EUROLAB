#!/usr/bin/env node
/* Testes sem dependências externas para o núcleo comparativo EUROLAB v1.3 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const ctx={};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/comparacao-core.js'),'utf8'),ctx,{filename:'comparacao-core.js'});
const run=ctx.EuroCompare.evaluate;
const draws=Array.from({length:135},(_,i)=>{
 const date=new Date(Date.UTC(2016,8,27+i*4)).toISOString().slice(0,10);
 return {date,numbers:[1,2,3,4,5],stars:[1,2]};
});
let called=0;
const constant=()=>()=>.35;
const choose=(mode,past)=>{
 assert.equal(past.length,100);
 assert.equal(past.every(d=>d.date>='2016-09-27'),true);
 called++;
 return {numbers:[1,2,3,4,5],stars:[1,2]};
};
const a=run(draws,{window:100,count:120,seed:20261120},choose,constant);
assert.equal(a.draws_evaluated,35);
assert.equal(a.strategies.length,5);
assert.equal(called,175);
for(const row of a.strategies){
 assert.equal(row.numbers_hits,175);
 assert.equal(row.stars_hits,70);
 assert.equal(row.details.length,35);
 assert.equal(row.details[0].date,a.first_date);
 assert.equal(row.details.at(-1).date,a.last_date);
}
assert.equal(a.expected.numbers,17.5);
assert.equal(a.expected.stars,35/3);
assert.throws(()=>run(draws,{window:100,count:120,seed:-1},choose,constant),/Parâmetros/);
assert.throws(()=>run(draws,{window:100,count:120,seed:0},()=>({numbers:[1,1,2,3,4],stars:[1,2]}),constant),/inválida/);
assert.throws(()=>run(draws.slice(0,100),{window:100,count:120,seed:1},choose,constant),/insuficiente/);
function seeded(seed){let x=seed>>>0;return ()=>{x=(x+0x6D2B79F5)>>>0;let z=x;z=Math.imul(z^(z>>>15),z|1);z^=z+Math.imul(z^(z>>>7),z|61);return ((z^(z>>>14))>>>0)/4294967296;};}
const chooser=(mode,past,rng)=>{
 const off=Math.floor(rng()*40);
 return {numbers:[off+1,off+2,off+3,off+4,off+5],stars:[1,2]};
};
const b=run(draws,{window:100,count:120,seed:7},chooser,seeded);
const c=run(draws,{window:100,count:120,seed:7},chooser,seeded);
assert.equal(JSON.stringify(b),JSON.stringify(c),'Resultados não são reproduzíveis');
console.log('OK: comparação cronológica, cinco métodos, validação, 95% referência e reprodutibilidade.');
