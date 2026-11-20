/* EUROLAB v1.7 — melhor método histórico na Chave 1; Crowd v1.4 na Chave 2. */
'use strict';
const STORAGE_KEY='eurolab-v17-duas-chaves-selecao';
let activePair=null,activeData=null,activeModel=null,activeSelection=null;
const get=id=>document.getElementById(id);

function secureRandomIndex(max){
 if(!Number.isSafeInteger(max)||max<1||max>4294967296)throw Error('Limite aleatório inválido.');
 if(!globalThis.crypto||typeof crypto.getRandomValues!=='function')throw Error('Fonte criptográfica indisponível.');
 const range=4294967296,limit=range-range%max,buf=new Uint32Array(1);
 do{crypto.getRandomValues(buf);}while(buf[0]>=limit);
 return buf[0]%max;
}
function showStatus(message,isError){
 const e=get('status');e.textContent=message;e.classList.toggle('error',!!isError);
}
function formatDate(date){
 return String(date).split('-').reverse().join('/');
}
function renderBalls(id,numbers,stars){
 const el=get(id);el.replaceChildren();
 for(const n of numbers){
   const span=document.createElement('span');
   span.className='ball'+(stars?' star':'');
   span.textContent=String(n).padStart(2,'0');el.append(span);
 }
}
function renderRanking(){
 const area=get('ranking-body');area.replaceChildren();
 if(!activeSelection){area.textContent='Comparação indisponível.';return;}
 const table=document.createElement('table');table.className='ranking-table';
 const thead=document.createElement('thead'),headRow=document.createElement('tr');
 for(const title of ['Modelo','Pontuação','Números','Estrelas']){
   const th=document.createElement('th');th.textContent=title;headRow.append(th);
 }
 thead.append(headRow);table.append(thead);
 const tbody=document.createElement('tbody');
 const fmt=n=>n.toFixed(4).replace('.',',');
 for(const row of activeSelection.rankings){
   const tr=document.createElement('tr');if(row.mode===activeSelection.selected)tr.className='ranking-selected';
   for(const text of [row.label,fmt(row.score),fmt(row.number_hits_per_draw),fmt(row.star_hits_per_draw)]){
     const td=document.createElement('td');td.textContent=text;tr.append(td);
   }
   tbody.append(tr);
 }
 table.append(tbody);area.append(table);
 get('ranking-period').textContent='De '+formatDate(activeSelection.eval_from)+' a '+
   formatDate(activeSelection.eval_until)+' · '+activeSelection.draws_evaluated+
   ' concursos · '+activeSelection.seeds+
   ' sementes. Pontuação = números acertados + 0,5 × estrelas.';
}
function render(pair,restored){
 if(!EuroDuasChaves.validate(pair)||!activeSelection)throw Error('Chaves ou seleção sem proveniência válida.');
 activePair=pair;
 renderBalls('key1-numbers',pair.first.numbers,false);
 renderBalls('key1-stars',pair.first.stars,true);
 renderBalls('key2-numbers',pair.second.numbers,false);
 renderBalls('key2-stars',pair.second.stars,true);
 ['copy-1','copy-2','copy-both'].forEach(id=>get(id).disabled=false);
 get('method-one-title').textContent=EuroSeletor.LABELS[pair.models.selected_method];
 get('model1-info').textContent='Escolhido entre 5 métodos · '+pair.models.evaluation_draws+
   ' concursos · até '+formatDate(pair.models.history_end)+'.';
 get('model1-signal').textContent='Pontuação histórica '+pair.models.evaluation_score.toFixed(4).replace('.',',')+
   ' (aleatório: '+pair.models.baseline_score.toFixed(4).replace('.',',')+
   '). Não comprova vantagem futura.';
 const delta=(pair.models.crowd_relative_index-1)*100;
 get('model2-info').textContent='Crowd v1.4 · '+pair.models.crowd_dates+
   ' números de calendário · '+pair.models.crowd_support+' observações.';
 get('model2-signal').textContent='Índice relativo '+(delta>=0?'+':'')+
   delta.toFixed(1).replace('.',',')+
   '% face a três números de calendário. Não é a probabilidade de partilha.';
 renderRanking();
 get('saved-info').textContent='Guardadas neste navegador com o modelo escolhido e a data do histórico.';
 showStatus(restored?'Recuperámos as chaves deste modelo selecionado.':
   'Duas chaves geradas: o melhor método histórico observado + Crowd Intelligence.',false);
}
function save(pair){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:3,pair,generated_at:new Date().toISOString()}));}
 catch(e){get('saved-info').textContent='O navegador não permitiu guardar. Copia as chaves antes de sair.';}
}
function generatePair(){
 if(!activeData||!activeModel||!activeSelection){
   showStatus('É necessário avaliar os métodos e carregar o Crowd Intelligence.',true);return;
 }
 try{
   const pair=EuroDuasChaves.generate(activeData,activeModel,secureRandomIndex,activeSelection);
   render(pair,false);save(pair);
 }catch(e){showStatus('Erro ao gerar as chaves: '+e.message,true);}
}
function restore(){
 try{
   const raw=localStorage.getItem(STORAGE_KEY);
   if(!raw)return false;
   const saved=JSON.parse(raw),m=saved?.pair?.models;
   if(saved?.version!==3||!EuroDuasChaves.validate(saved.pair))return false;
   if(m.selected_method!==activeSelection.selected||
      m.selector_version!==activeSelection.version||
      m.evaluation_from!==activeSelection.eval_from||
      m.evaluation_score!==activeSelection.selected_score||
      m.history_end!==activeSelection.history_end||
      m.crowd_calibrated_until!==activeModel.calibration_end||
      m.crowd_coefficient!==activeModel.coefficients.calendar_number)return false;
   render(saved.pair,true);return true;
 }catch(e){return false;}
}
async function copyText(text){
 if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
   await navigator.clipboard.writeText(text);return;
 }
 const temp=document.createElement('textarea');temp.value=text;
 temp.style.position='fixed';temp.style.left='-200vw';
 document.body.append(temp);temp.select();
 try{if(!document.execCommand('copy'))throw Error('Cópia não suportada.');}
 finally{temp.remove();}
}
async function copySelection(which){
 if(!activePair)return;
 const label=EuroSeletor.LABELS[activePair.models.selected_method];
 const fmt=EuroDuasChaves.format;
 let message;
 if(which==='first')message='EUROLAB · Chave 1 — '+label+'\n'+fmt(activePair.first);
 else if(which==='second')message='EUROLAB · Chave 2 — Crowd Intelligence\n'+fmt(activePair.second);
 else message='EUROLAB · DUAS CHAVES\n1 · '+label+': '+fmt(activePair.first)+
    '\n2 · Crowd Intelligence: '+fmt(activePair.second);
 try{await copyText(message);showStatus('Chave(s) copiada(s).',false);}
 catch(e){showStatus('Não foi possível copiar automaticamente.',true);}
}
async function fetchJson(path){
 const res=await fetch(path,{cache:'no-store'});
 if(!res.ok)throw Error('Falhou '+path+': HTTP '+res.status);
 return res.json();
}
async function init(){
 get('generate').disabled=true;
 ['copy-1','copy-2','copy-both'].forEach(id=>get(id).disabled=true);
 showStatus('A carregar o histórico e a comparar os cinco modelos estatísticos…',false);
 try{
   const [data,model]=await Promise.all([
     fetchJson('data/dados-validados.json'),fetchJson('data/modelo-popularidade-v14.json')]);
   if(!Array.isArray(data.draws))throw Error('Formato de histórico inválido.');
   if(model.id!=='eurolab-crowd-calendar-v1'||model.version!=='1.4.0')
      throw Error('O modelo Crowd não corresponde à versão esperada.');
   EuroDuasChaves.cleanHistory(data);
   if(!globalThis.EuroSeletor||typeof EuroSeletor.evaluate!=='function')
      throw Error('O comparador estatístico não foi carregado.');
   const evaluation=EuroSeletor.evaluate(data,EuroDuasChaves.generateMode);
   activeData=data;activeModel=model;activeSelection=evaluation;
   get('generate').disabled=false;
   if(!restore())generatePair();
 }catch(e){
   activeData=null;activeModel=null;activeSelection=null;activePair=null;
   showStatus('Modelos ou avaliação indisponíveis — nenhuma chave gerada: '+e.message,true);
   get('saved-info').textContent='Atualiza a página depois de confirmar que o site está acessível.';
 }
}
get('generate').addEventListener('click',generatePair);
get('copy-1').addEventListener('click',()=>copySelection('first'));
get('copy-2').addEventListener('click',()=>copySelection('second'));
get('copy-both').addEventListener('click',()=>copySelection('both'));
init();
