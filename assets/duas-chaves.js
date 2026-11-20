/* EUROLAB v1.6 — carregamento obrigatório dos dois modelos antes de gerar. */
'use strict';
const STORAGE_KEY='eurolab-v16-duas-chaves-modelos';
let activePair=null,activeData=null,activeModel=null;
const get=id=>document.getElementById(id);

function secureRandomIndex(max){
  if(!Number.isSafeInteger(max)||max<1||max>4294967296)throw Error('Limite da fonte aleatória inválido.');
  if(!globalThis.crypto||typeof crypto.getRandomValues!=='function')
    throw Error('A fonte criptográfica não está disponível neste navegador.');
  const range=4294967296,limit=range-(range%max),buf=new Uint32Array(1);
  do{crypto.getRandomValues(buf);}while(buf[0]>=limit);
  return buf[0]%max;
}
function showStatus(message,isError){
  const node=get('status');node.textContent=message;node.classList.toggle('error',!!isError);
}
function renderBalls(id,numbers,stars){
  const container=get(id);container.replaceChildren();
  for(const n of numbers){
    const ball=document.createElement('span');
    ball.className='ball'+(stars?' star':'');
    ball.textContent=String(n).padStart(2,'0');
    container.append(ball);
  }
}
function formatDate(iso){
  const p=iso.split('-');return p[2]+'/'+p[1]+'/'+p[0];
}
function render(pair,restored){
  if(!EuroDuasChaves.validate(pair))throw Error('Chaves ou proveniência dos modelos inválidas.');
  activePair=pair;
  renderBalls('key1-numbers',pair.first.numbers,false);
  renderBalls('key1-stars',pair.first.stars,true);
  renderBalls('key2-numbers',pair.second.numbers,false);
  renderBalls('key2-stars',pair.second.stars,true);
  for(const id of ['copy-1','copy-2','copy-both'])get(id).disabled=false;
  get('model1-info').textContent='Modelo histórico: últimas '+pair.models.window+
     ' extrações · dados até '+formatDate(pair.models.history_end)+'.';
  const diff=(pair.models.crowd_relative_index-1)*100;
  get('model2-info').textContent='Modelo Crowd v1.4 · '+pair.models.crowd_dates+
      ' números de 1–31 · '+pair.models.crowd_support+' sorteios na categoria.';
  get('model2-signal').textContent='Índice relativo '+(diff>=0?'+':'')+
      diff.toFixed(1).replace('.',',')+'% face a três números de calendário. Não representa probabilidade de partilha.';
  get('saved-info').textContent='As chaves ficam guardadas neste navegador, juntamente com a versão dos modelos utilizados.';
  showStatus(restored?'Recuperámos duas chaves geradas com estes modelos.':
    'Duas chaves geradas pelos modelos históricos e Crowd Intelligence.',false);
}
function save(pair){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:2,pair,generated_at:new Date().toISOString()}));}
  catch(e){get('saved-info').textContent='O navegador não permitiu guardar: copia as chaves antes de sair.';}
}
function generatePair(){
  if(!activeData||!activeModel){
    showStatus('É necessário carregar os dois modelos antes de gerar.',true);
    return;
  }
  try{
    const pair=EuroDuasChaves.generate(activeData,activeModel,secureRandomIndex);
    render(pair,false);save(pair);
  }catch(e){showStatus('Não foi possível gerar as chaves: '+e.message,true);}
}
function restore(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return false;
    const saved=JSON.parse(raw);
    const m=saved?.pair?.models;
    const current=EuroDuasChaves.cleanHistory(activeData)[0].date;
    if(saved.version!==2||!EuroDuasChaves.validate(saved.pair)||m.history_end!==current||
       m.crowd_calibrated_until!==activeModel.calibration_end||
       m.crowd_coefficient!==activeModel.coefficients.calendar_number)return false;
    render(saved.pair,true);return true;
  }catch(e){return false;}
}
async function copyText(text){
  if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
    await navigator.clipboard.writeText(text);return;
  }
  const temp=document.createElement('textarea');
  temp.value=text;temp.style.position='fixed';temp.style.left='-200vw';document.body.append(temp);temp.select();
  try{if(!document.execCommand('copy'))throw Error('Cópia indisponível.');}
  finally{temp.remove();}
}
async function copySelection(which){
  if(!activePair)return;
  const f=EuroDuasChaves.format;
  let value='';
  if(which==='first')value='EUROLAB · Chave 1 — Frequências históricas\n'+f(activePair.first);
  else if(which==='second')value='EUROLAB · Chave 2 — Crowd Intelligence\n'+f(activePair.second);
  else value='EUROLAB · DUAS CHAVES\n1 · Frequências históricas: '+f(activePair.first)+
    '\n2 · Crowd Intelligence: '+f(activePair.second);
  try{await copyText(value);showStatus('Chaves copiadas.',false);}
  catch(e){showStatus('Não foi possível copiar: seleciona manualmente os números.',true);}
}
async function fetchJson(path){
  const response=await fetch(path,{cache:'no-cache'});
  if(!response.ok)throw Error('Falha ao carregar '+path+' ('+response.status+').');
  return response.json();
}
async function init(){
  get('generate').disabled=true;
  for(const id of ['copy-1','copy-2','copy-both'])get(id).disabled=true;
  showStatus('A carregar modelos estatísticos e histórico validado…',false);
  try{
    const [data,model]=await Promise.all([
      fetchJson('data/dados-validados.json'),fetchJson('data/modelo-popularidade-v14.json')
    ]);
    if(!Array.isArray(data.draws))throw Error('O histórico não tem o formato esperado.');
    if(model.id!=='eurolab-crowd-calendar-v1'||model.version!=='1.4.0')
      throw Error('O modelo Crowd não corresponde à versão esperada.');
    EuroDuasChaves.cleanHistory(data);
    activeData=data;activeModel=model;
    get('generate').disabled=false;
    if(!restore())generatePair();
  }catch(e){
    activeData=null;activeModel=null;
    showStatus('Modelos indisponíveis — nenhuma chave foi gerada. '+e.message,true);
    get('saved-info').textContent='Confirma a ligação à internet e atualiza a página para tentar novamente.';
  }
}
get('generate').addEventListener('click',generatePair);
get('copy-1').addEventListener('click',()=>copySelection('first'));
get('copy-2').addEventListener('click',()=>copySelection('second'));
get('copy-both').addEventListener('click',()=>copySelection('both'));
init();
