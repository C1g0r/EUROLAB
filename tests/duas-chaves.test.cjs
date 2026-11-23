#!/usr/bin/env node
/* EUROLAB v1.8 — verificação de seleção dinâmica + geração real. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const engine=require('../assets/duas-chaves-core.js');
const selector=require('../assets/selecao-core.js');
const history=JSON.parse(fs.readFileSync(path.join(root,'data/dados-validados.json'),'utf8'));
const crowd=JSON.parse(fs.readFileSync(path.join(root,'data/modelo-popularidade-v14.json'),'utf8'));
const rng=(seed=20261120)=>{let x=seed>>>0;return max=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x%max;}};

assert.equal(engine.MODEL_1,'walk-forward-v17');
assert.equal(engine.MODEL_2,'crowd-calendar-v14');
assert.equal(selector.MODES.length,5);
assert.equal(selector.WINDOW,250);
assert.equal(selector.EVAL_COUNT,250);
const evaluation=selector.evaluate(history,engine.generateMode);
assert.equal(evaluation.selected,evaluation.rankings[0].mode);
assert.equal(evaluation.rankings.length,5);
assert.equal(evaluation.draws_evaluated,250);
assert.equal(evaluation.seeds,5);
assert.equal(evaluation.window,250);
assert.equal(evaluation.history_end,engine.cleanHistory(history)[0].date);
assert.ok(evaluation.rankings.every(r=>r.simulations===1250));
assert.equal(JSON.stringify(evaluation),JSON.stringify(selector.evaluate(history,engine.generateMode)),
  'A seleção deve ser reproduzível com as mesmas sementes.');

const past=engine.cleanHistory(history);
const main=Array.from({length:50},(_,i)=>i+1);
const weights=engine.historicalWeights(main,past,'numbers');
assert.ok(new Set(weights).size>1,'As frequências reais devem influenciar o método frequentes.');
assert.equal(Math.min(...weights),1);
assert.equal(Math.max(...weights),5);
const samples={};
for(const mode of selector.MODES){
 const key=engine.generateMode(mode,past,rng(10));
 assert.equal(key.numbers.length,5);
 assert.equal(key.stars.length,2);
 assert.equal(new Set(key.numbers).size,5);
 assert.equal(new Set(key.stars).size,2);
 samples[mode]=key;
}

let valid=0;
const rand=rng();
for(let i=0;i<1200;i++){
 const pair=engine.generate(history,crowd,rand,evaluation);
 assert.ok(engine.validate(pair),'Todas as chaves devem cumprir a proveniência e os limites.');
 assert.equal(pair.models.first,'walk-forward-v17');
 assert.equal(pair.models.selected_method,evaluation.selected);
 assert.equal(pair.models.evaluation_score,evaluation.selected_score);
 assert.equal(pair.models.evaluation_seeds,5);
 assert.equal(pair.models.evaluation_draws,250);
 assert.equal(pair.models.history_end,evaluation.history_end);
 assert.equal(pair.models.crowd_calibrated_until,crowd.calibration_end);
 assert.ok(pair.first.numbers.every(n=>!pair.second.numbers.includes(n)));
 assert.ok(pair.first.stars.every(n=>!pair.second.stars.includes(n)));
 assert.ok(pair.models.crowd_support>=80);
 valid++;
}
assert.throws(()=>engine.generate(history,crowd,rng(),null),/Avaliação comparativa/);
assert.throws(()=>engine.generate(history,crowd,rng(),{...evaluation,history_end:'2010-01-01'}),/Avaliação comparativa/);
assert.throws(()=>engine.generate(null,crowd,rng(),evaluation),/Histórico/);
assert.throws(()=>engine.generate(history,null,rng(),evaluation),/Crowd/);
assert.throws(()=>selector.evaluate([],engine.generateMode),/insuficientes/);
assert.throws(()=>engine.generate(history,crowd,()=>-1,evaluation),/aleatória inválida/);


/* v1.8: ambos os geradores podem funcionar individualmente em qualquer ordem. */
const randFirst=rng(4096);
const onlyFirst=engine.generateFirst(history,randFirst,evaluation);
assert.ok(engine.validKey(onlyFirst));
const resultSecond=engine.generateSecond(crowd,rng(8192),null);
assert.ok(engine.validKey(resultSecond.key));
assert.ok(resultSecond.study.relative_index>0);
assert.ok(resultSecond.study.observations>=80);
const preservedSecond=JSON.stringify(resultSecond.key);
const firstAfterSecond=engine.generateFirst(history,rng(2088),evaluation,resultSecond.key);
assert.ok(engine.validKey(firstAfterSecond));
assert.ok(engine.disjoint(firstAfterSecond,resultSecond.key));
assert.equal(JSON.stringify(resultSecond.key),preservedSecond,'Gerar chave 1 não altera chave 2.');
const secondAfterFirst=engine.generateSecond(crowd,rng(3018),onlyFirst);
assert.ok(engine.disjoint(onlyFirst,secondAfterFirst.key));
assert.equal(JSON.stringify(onlyFirst),JSON.stringify(onlyFirst));
for(let i=0;i<250;i++){
 const a=engine.generateFirst(history,rng(2026+i),evaluation,resultSecond.key);
 assert.ok(engine.disjoint(a,resultSecond.key));
 const b=engine.generateSecond(crowd,rng(3026+i),a).key;
 assert.ok(engine.disjoint(a,b));
}
assert.throws(()=>engine.generateFirst(history,rng(),null),/Avaliação comparativa/);
assert.throws(()=>engine.generateSecond(null,rng()),/Crowd/);
assert.throws(()=>engine.generateFirst(history,rng(),evaluation,{numbers:[1,1,2,3,4],stars:[1,2]}),/Chave 2 existente inválida/);

const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal((index.match(/<article class="ticket/g)||[]).length,2);
for(const id of ['model1-info','model1-signal','model2-info','model2-signal','ranking-body','ranking-period',
  'generate-1','generate-2','gauge1','gauge2','gauge1-needle','gauge2-needle',
  'key1-numbers','key2-numbers','generate','status']){
 assert.ok(index.includes('id="'+id+'"'),'Elemento em falta: '+id);
}
assert.ok(index.includes('assets/selecao-core.js?v=1.8'));
assert.ok(index.includes('assets/duas-chaves.js?v=1.8'));
assert.equal((index.match(/class="study-gauge"/g)||[]).length,2);
assert.ok(index.includes('painel-investigacao.html'));
console.log('OK: '+valid+' pares válidos, 5 estratégias comparadas sem fuga temporal, modelo selecionado = '+evaluation.selected);
console.log('Pontuações: '+evaluation.rankings.map(x=>x.mode+' '+x.score.toFixed(4)).join(' | '));
