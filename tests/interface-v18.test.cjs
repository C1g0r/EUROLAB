#!/usr/bin/env node
/* EUROLAB v1.9 — integração de 1 a 5 apostas por método, sem dependências. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const engine=require('../assets/duas-chaves-core.js');
const selector=require('../assets/selecao-core.js');
const history=JSON.parse(fs.readFileSync(path.join(root,'data/dados-validados.json'),'utf8'));
const crowd=JSON.parse(fs.readFileSync(path.join(root,'data/modelo-popularidade-v14.json'),'utf8'));
const code=fs.readFileSync(path.join(root,'assets/duas-chaves.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const id of ['count-1','count-2','key1-list','key2-list','generate-1','generate-2','generate',
 'gauge1','gauge2','gauge1-progress','gauge2-progress','copy-1','copy-2','copy-both']){
 assert.ok(html.includes('id="'+id+'"'),'Falta o controlo '+id);
}
function harness(stored={}){
 const events={},elements={},data={...stored},copies=[],requests=[];
 class Element{
   constructor(id=''){this.id=id;this.disabled=false;this.hidden=false;this.textContent='';
     this.value='1';this.className='';this.attrs={};this.children=[];this.style={};
     this.classList={toggle(){}};
   }
   append(...nodes){this.children.push(...nodes);}
   replaceChildren(...nodes){this.children=nodes;}
   setAttribute(key,value){this.attrs[key]=String(value);}
   addEventListener(type,fn){events[this.id+':'+type]=fn;}
 }
 const document={
   getElementById(id){return elements[id]??(elements[id]=new Element(id));},
   createElement(){return new Element();}
 };
 let state=291719;
 const crypto={getRandomValues(buffer){state=(Math.imul(state,1664525)+1013904223)>>>0;
   buffer[0]=state;return buffer;}};
 const localStorage={getItem:key=>data[key]??null,setItem:(key,value)=>{data[key]=value}};
 const fetch=async url=>{
   requests.push(url);
   if(url==='data/dados-validados.json')return {ok:true,json:async()=>history};
   if(url==='data/modelo-popularidade-v14.json')return {ok:true,json:async()=>crowd};
   throw Error('Ficheiro não esperado: '+url);
 };
 const navigator={clipboard:{async writeText(text){copies.push(text);}}};
 const ctx={document,localStorage,fetch,navigator,crypto,globalThis:null,EuroDuasChaves:engine,
   EuroSeletor:selector,Uint32Array,Date,Math,Number,Promise,Set,JSON};
 ctx.globalThis=ctx;
 vm.createContext(ctx);
 vm.runInContext(code,ctx,{filename:'duas-chaves.js'});
 return {events,elements,data,copies,requests,
   async ready(){for(let i=0;i<40;i++)await Promise.resolve();},
   press(id){assert.equal(typeof events[id+':click'],'function','Sem ação '+id);return events[id+':click']();}
 };
}
async function main(){
 const app=harness();await app.ready();
 assert.equal(app.elements['generate-1'].disabled,false);
 assert.equal(app.elements['generate-2'].disabled,false);
 assert.equal(app.elements['copy-1'].disabled,true);
 app.elements['count-2'].value='5';
 app.press('generate-2');
 let saved=JSON.parse(app.data['eurolab-v19-apostas-por-metodo']);
 assert.equal(saved.batches[1].length,5);
 assert.equal(saved.batches[0].length,0);
 assert.equal(saved.studies.length,5);
 assert.equal(app.elements.gauge2.hidden,false);
 assert.equal(app.elements.gauge1.hidden,true);
 assert.equal(app.elements['key2-list'].children.length,5);
 assert.equal(app.elements['copy-both'].disabled,false);
 const originalSecond=JSON.stringify(saved.batches[1]);

 app.elements['count-1'].value='3';
 app.press('generate-1');
 saved=JSON.parse(app.data['eurolab-v19-apostas-por-metodo']);
 assert.equal(saved.batches[0].length,3);
 assert.equal(JSON.stringify(saved.batches[1]),originalSecond);
 assert.equal(app.elements['key1-list'].children.length,3);
 assert.equal(app.elements.gauge1.hidden,false);
 assert.equal(app.elements.gauge2.hidden,false);
 assert.equal(app.elements['copy-1'].disabled,false);

 const originalFirst=JSON.stringify(saved.batches[0]);
 app.elements['count-2'].value='2';
 app.press('generate-2');
 saved=JSON.parse(app.data['eurolab-v19-apostas-por-metodo']);
 assert.equal(saved.batches[1].length,2);
 assert.equal(JSON.stringify(saved.batches[0]),originalFirst);

 app.elements['count-1'].value='5';
 app.elements['count-2'].value='5';
 app.press('generate');
 saved=JSON.parse(app.data['eurolab-v19-apostas-por-metodo']);
 assert.equal(saved.batches[0].length,5);
 assert.equal(saved.batches[1].length,5);
 assert.equal(new Set(saved.batches.flat().map(engine.fingerprint)).size,10);
 assert.equal(app.elements['key1-list'].children.length,5);
 assert.equal(app.elements['key2-list'].children.length,5);
 await app.press('copy-both');
 assert.ok(app.copies.at(-1).includes('Método 1'));
 assert.ok(app.copies.at(-1).includes('Método 2'));

 const restored=harness({...app.data});await restored.ready();
 assert.equal(restored.elements['key1-list'].children.length,5);
 assert.equal(restored.elements['key2-list'].children.length,5);
 assert.equal(restored.elements['count-1'].value,'5');
 assert.equal(restored.elements['count-2'].value,'5');
 assert.equal(restored.elements['copy-both'].disabled,false);

 const bad=JSON.parse(app.data['eurolab-v19-apostas-por-metodo']);
 bad.batches[1][0]=bad.batches[0][0];
 const invalid=harness({'eurolab-v19-apostas-por-metodo':JSON.stringify(bad)});
 await invalid.ready();
 assert.equal(invalid.elements['copy-1'].disabled,true);
 assert.equal(invalid.elements['copy-2'].disabled,true);
 assert.equal(invalid.elements['key1-list'].children.length,1);

 console.log('OK: 5+5 apostas, geração separada, manómetros, cópia e recuperação de estado válido.');
}
main().catch(err=>{console.error(err);process.exitCode=1;});
