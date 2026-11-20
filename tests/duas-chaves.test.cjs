#!/usr/bin/env node
/* EUROLAB v1.6 — testes dos dois modelos estatísticos integrados. */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');
const engine=require('../assets/duas-chaves-core.js');
const history=JSON.parse(fs.readFileSync(path.join(root,'data/dados-validados.json'),'utf8'));
const crowd=JSON.parse(fs.readFileSync(path.join(root,'data/modelo-popularidade-v14.json'),'utf8'));
const rng=(seed=20261120)=>{let x=seed>>>0;return max=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x%max;}};
assert.equal(engine.MODEL_1,'frequentes-v11');
assert.equal(engine.MODEL_2,'crowd-calendar-v14');
assert.equal(engine.cleanHistory(history).length,250);
const latest=engine.cleanHistory(history)[0].date;
const recent=engine.cleanHistory(history);
const pool=Array.from({length:50},(_,i)=>i+1);
const weights=engine.historicalWeights(pool,recent,'numbers');
assert.equal(Math.min(...weights),1);
assert.equal(Math.max(...weights),5);
// A transformação de pesos tem de depender realmente das frequências, não de uma regra fixa.
const training=Array.from({length:250},(_,i)=>({
 date:new Date(Date.UTC(2026,9,30-i*4)).toISOString().slice(0,10),
 numbers:[1,2,3,4,5],stars:[1,2]
}));
const w=engine.historicalWeights(pool,training,'numbers');
assert.equal(w[0],5);
assert.equal(w[5],1);
assert.notEqual(weights[0],weights[1]); // O histórico real não tem frequências uniformes.

let valid=0,distributions=Array(6).fill(0),rand=rng();
for(let i=0;i<1500;i++){
 const pair=engine.generate(history,crowd,rand);
 assert.ok(engine.validate(pair),'Devem ser duas chaves completas, com proveniência.');
 assert.ok(pair.first.numbers.every(n=>!pair.second.numbers.includes(n)));
 assert.ok(pair.first.stars.every(n=>!pair.second.stars.includes(n)));
 assert.equal(pair.models.window,250);
 assert.equal(pair.models.history_end,latest);
 assert.equal(pair.models.crowd_calibrated_until,crowd.calibration_end);
 assert.equal(pair.models.crowd_dates,pair.second.numbers.filter(n=>n<=31).length);
 assert.ok(pair.models.crowd_support>=engine.CROWD_MIN_OBSERVATIONS);
 const exp=Math.exp(crowd.coefficients.calendar_number*(pair.models.crowd_dates-crowd.reference_calendar_count));
 assert.ok(Math.abs(pair.models.crowd_relative_index-exp)<1e-12);
 distributions[pair.models.crowd_dates]++;
 valid++;
}
assert.equal(distributions[0],0);
assert.equal(distributions[1],0);
// O sinal Crowd deve influenciar a distribuição da segunda chave.
const reverse=JSON.parse(JSON.stringify(crowd));
reverse.coefficients.calendar_number=-crowd.coefficients.calendar_number;
function meanDates(model){
 let total=0,next=rng(20261120);
 for(let i=0;i<1000;i++)total+=engine.generate(history,model,next).models.crowd_dates;
 return total/1000;
}
const regular=meanDates(crowd),opposite=meanDates(reverse);
assert.ok(regular<opposite,'Inverter o coeficiente Crowd deve inverter a preferência agregada.');
assert.throws(()=>engine.generate(null,crowd,rng()),/Histórico/);
assert.throws(()=>engine.generate([],crowd,rng()),/250 concursos/);
assert.throws(()=>engine.generate(history,null,rng()),/Crowd/);
assert.throws(()=>engine.generate(history,crowd,()=>-1),/aleatória inválida/);
const bad=engine.generate(history,crowd,rng());
bad.second.numbers[0]=bad.first.numbers[0];
assert.equal(engine.validate(bad),false);

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal((html.match(/<article class="ticket/g)||[]).length,2);
for(const id of ['key1-numbers','key2-numbers','key1-stars','key2-stars','model1-info','model2-info','model2-signal','generate','status']){
 assert.ok(html.includes('id="'+id+'"'),'Elemento em falta: '+id);
}
assert.ok(html.includes('painel-investigacao.html'),'A investigação deve continuar acessível.');
console.log('OK: '+valid+' pares válidos, frequência histórica real, modelo Crowd com efeito demonstrado no gerador, sem dados em falta.');
console.log('Distribuição Crowd por contagem de datas: '+JSON.stringify(distributions)+
 '; média coeficiente atual '+regular.toFixed(3)+', invertido '+opposite.toFixed(3));
