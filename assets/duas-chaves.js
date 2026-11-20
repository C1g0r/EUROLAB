/* EUROLAB v1.5 — Interface simples: duas chaves, dois métodos. */
'use strict';

const STORAGE_KEY = 'eurolab-v15-duas-chaves';
let activePair = null;
const get = id => document.getElementById(id);

function secureRandomIndex(max) {
  if (!Number.isInteger(max) || max < 1 || max > 50) throw Error('Limite aleatório inválido.');
  if (!globalThis.crypto || typeof crypto.getRandomValues !== 'function') {
    throw Error('É necessária uma ligação segura (HTTPS) para gerar chaves aleatórias.');
  }
  const range = 4294967296;
  const limit = range - range % max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}
function showStatus(message, isError) {
  const node=get('status');
  node.textContent=message;
  node.classList.toggle('error', !!isError);
}
function renderBalls(target, numbers, stars) {
  const container=get(target);
  container.replaceChildren();
  for (const n of numbers) {
    const ball=document.createElement('span');
    ball.className='ball'+(stars?' star':'');
    ball.textContent=String(n).padStart(2,'0');
    container.append(ball);
  }
}
function render(pair, wasRestored) {
  if (!EuroDuasChaves.validate(pair)) throw Error('Chaves inválidas.');
  activePair=pair;
  renderBalls('key1-numbers',pair.first.numbers,false);
  renderBalls('key1-stars',pair.first.stars,true);
  renderBalls('key2-numbers',pair.second.numbers,false);
  renderBalls('key2-stars',pair.second.stars,true);
  ['copy-1','copy-2','copy-both'].forEach(id=>get(id).disabled=false);
  get('saved-info').textContent='As duas chaves ficam guardadas neste navegador até gerarmos outras.';
  showStatus(wasRestored?'Recuperámos as tuas últimas duas chaves.':'Duas chaves geradas e validadas. Não há números nem estrelas repetidos.',false);
}
function save(pair) {
  try {localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,pair,generated_at:new Date().toISOString()}));}
  catch(e){get('saved-info').textContent='O navegador não permitiu guardar as chaves. Podes copiá-las antes de sair.';}
}
function generatePair() {
  try {
    const pair=EuroDuasChaves.generate(secureRandomIndex);
    render(pair,false);
    save(pair);
  } catch(e) {
    showStatus('Não foi possível gerar as chaves: '+e.message,true);
  }
}
function restore() {
  try {
    const text=localStorage.getItem(STORAGE_KEY);
    if (!text) return false;
    const saved=JSON.parse(text);
    if (saved.version!==1 || !EuroDuasChaves.validate(saved.pair)) return false;
    render(saved.pair,true);
    return true;
  } catch(e) {return false;}
}
async function copyText(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText==='function') {
    await navigator.clipboard.writeText(text);
    return;
  }
  const temp=document.createElement('textarea');
  temp.value=text;
  temp.style.position='fixed';
  temp.style.left='-200vw';
  document.body.append(temp);
  temp.select();
  try {
    if (!document.execCommand('copy')) throw Error('Cópia não suportada.');
  } finally {temp.remove();}
}
function formatOne(key){return EuroDuasChaves.format(key);}
async function copySelection(which) {
  if (!activePair)return;
  let text,what;
  if(which==='first'){text='EUROLAB · Chave 1 — Aleatório uniforme\n'+formatOne(activePair.first);what='Chave 1';}
  else if(which==='second'){text='EUROLAB · Chave 2 — Diversificação\n'+formatOne(activePair.second);what='Chave 2';}
  else{
    text='EUROLAB · DUAS CHAVES\n1 — Aleatório uniforme: '+formatOne(activePair.first)+
      '\n2 — Diversificação (2 números 1–31; 3 números 32–50): '+formatOne(activePair.second);
    what='Duas chaves';
  }
  try {await copyText(text);showStatus(what+' copiada(s) para a área de transferência.',false);}
  catch(e){showStatus('Não foi possível copiar automaticamente; seleciona os números apresentados.',true);}
}
get('generate').addEventListener('click',generatePair);
get('copy-1').addEventListener('click',()=>copySelection('first'));
get('copy-2').addEventListener('click',()=>copySelection('second'));
get('copy-both').addEventListener('click',()=>copySelection('both'));
if (!restore()) generatePair();
