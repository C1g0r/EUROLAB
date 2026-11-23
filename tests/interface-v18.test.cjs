#!/usr/bin/env node
/* EUROLAB v1.8: integração da interface em ambiente DOM simulado sem dependências. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const engine=require('../assets/duas-chaves-core.js');
const selector=require('../assets/selecao-core.js');
const hist=JSON.parse(fs.readFileSync(path.join(root,'data/dados-validados.json'),'utf8'));
const crowd=JSON.parse(fs.readFileSync(path.join(root,'data/modelo-popularidade-v14.json'),'utf8'));
const appSource=fs.readFileSync(path.join(root,'assets/duas-chaves.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const id of ['generate-1','generate-2','generate','gauge1','gauge2','gauge1-progress','gauge2-progress',
   'gauge1-needle','gauge2-needle','gauge1-value','gauge2-value','model1-signal','model2-signal']){
  assert.ok(html.includes('id="'+id+'"'),'HTML não contém '+id);
}

function harness(existingStorage={}){
 const events={},elements=new Map(),storage={...existingStorage};
 let seed=3197593,requested=[],writeCopies=[];
 class FakeElement{
   constructor(id=''){this.id=id;this.textContent='';this.className='';this.hidden=false;
     this.disabled=false;this.children=[];this.attrs={};
     this.classList={toggle:(name,on)=>{this.classes??={};this.classes[name]=on;}};
     this.style={};
   }
   append(...nodes){this.children.push(...nodes);}
   replaceChildren(...nodes){this.children=nodes;}
   setAttribute(key,value){this.attrs[key]=String(value);}
   addEventListener(name,callback){events[this.id+':'+name]=callback;}
 }
 const document={
   getElementById(id){if(!elements.has(id))elements.set(id,new FakeElement(id));return elements.get(id);},
   createElement(){return new FakeElement();}
 };
 const fakeCrypto={getRandomValues(buffer){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   buffer[0]=seed;return buffer;
 }};
 const fakeLocalStorage={getItem(key){return storage[key]??null;},setItem(key,value){storage[key]=value;}};
 const fetch=async url=>{
   requested.push(url);
   if(url==='data/dados-validados.json')return {ok:true,json:async()=>hist};
   if(url==='data/modelo-popularidade-v14.json')return {ok:true,json:async()=>crowd};
   throw Error('Pedido inesperado: '+url);
 };
 const navigator={clipboard:{async writeText(value){writeCopies.push(value);}}};
 const context={document,fetch,navigator,crypto:fakeCrypto,
    localStorage:fakeLocalStorage,globalThis:null,EuroSeletor:selector,EuroDuasChaves:engine,
    Uint32Array,Date,JSON,Math,Number,Promise,Set};
 context.globalThis=context;
 vm.createContext(context);
 vm.runInContext(appSource,context,{filename:'duas-chaves.js'});
 return {
   async ready(){for(let i=0;i<30;i++)await Promise.resolve();},
   press(id){assert.equal(typeof events[id+':click'],'function','Sem ação do botão '+id);
     return events[id+':click']();},
   element(id){return document.getElementById(id);},
   storage,requested,writeCopies
 };
}

async function run(){
 const h=harness();await h.ready();
 assert.deepEqual(h.requested.sort(),['data/dados-validados.json','data/modelo-popularidade-v14.json'].sort());
 assert.equal(h.element('generate-1').disabled,false);
 assert.equal(h.element('generate-2').disabled,false);
 assert.equal(h.element('generate').disabled,false);
 assert.equal(h.element('copy-1').disabled,true);
 assert.equal(h.element('copy-2').disabled,true);
 assert.equal(h.element('gauge1').hidden,true);
 assert.equal(h.element('gauge2').hidden,true);

 h.press('generate-2');
 let state=JSON.parse(h.storage['eurolab-v18-chaves-individuais']);
 assert.equal(state.first,null);
 assert.ok(engine.validKey(state.second));
 assert.equal(h.element('gauge2').hidden,false);
 assert.ok(h.element('gauge2-value').textContent.endsWith(' índice'));
 assert.ok(h.element('gauge2-needle').attrs.transform.startsWith('rotate('));
 assert.ok(h.element('gauge2-progress').attrs.d.includes('A 96 96'));
 assert.equal(h.element('gauge1').hidden,true);
 assert.equal(h.element('copy-1').disabled,true);
 assert.equal(h.element('copy-2').disabled,false);

 const originalSecond=JSON.stringify(state.second);
 h.press('generate-1');
 state=JSON.parse(h.storage['eurolab-v18-chaves-individuais']);
 assert.ok(engine.validKey(state.first));
 assert.equal(JSON.stringify(state.second),originalSecond);
 assert.ok(engine.disjoint(state.first,state.second));
 assert.equal(h.element('gauge1').hidden,false);
 assert.ok(h.element('gauge1-value').textContent.includes('acertos'));
 assert.ok(h.element('gauge1-needle').attrs.transform.startsWith('rotate('));
 assert.equal(h.element('copy-both').disabled,false);
 const first=JSON.stringify(state.first);

 h.press('generate-2');
 state=JSON.parse(h.storage['eurolab-v18-chaves-individuais']);
 assert.equal(JSON.stringify(state.first),first);
 assert.ok(engine.disjoint(state.first,state.second));

 h.press('generate');
 state=JSON.parse(h.storage['eurolab-v18-chaves-individuais']);
 assert.ok(engine.disjoint(state.first,state.second));

 await h.press('copy-both');
 assert.ok(h.writeCopies.at(-1).includes('Chave'));
 const stored={...h.storage};
 const repeat=harness(stored);await repeat.ready();
 assert.equal(repeat.element('copy-both').disabled,false);
 assert.equal(repeat.element('gauge1').hidden,false);
 assert.equal(repeat.element('gauge2').hidden,false);
 assert.equal(repeat.element('status').textContent.includes('recuperadas'),true);

 // Never restore an invalid pair that duplicates numbers or stars.
 const corrupted=JSON.parse(stored['eurolab-v18-chaves-individuais']);
 corrupted.second.numbers[0]=corrupted.first.numbers[0];
 const invalid=harness({'eurolab-v18-chaves-individuais':JSON.stringify(corrupted)});
 await invalid.ready();
 assert.equal(invalid.element('copy-both').disabled,true);
 assert.equal(invalid.element('gauge1').hidden,true);
 assert.equal(invalid.element('gauge2').hidden,true);

 console.log('OK: carregamento, geração separada nas duas ordens, manómetros, cópia e recuperação segura.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
