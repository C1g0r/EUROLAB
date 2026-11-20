/* EUROLAB v1.4 — interface Crowd Intelligence: índice de calendário, não previsão. */
'use strict';
let crowdModel=null;
function crowdPercent(v){return (v>=0?'+':'')+v.toFixed(1).replace('.',',')+'%';}
function crowdDrawResult(result){
 const rel=result.relative_proxy_pct,ref=result.calendar_numbers,delta=crowdPercent(rel);
 return `<div class="crowd-card">
   <div class="balls">${ballsHTML(result.numbers,result.stars)}</div>
   <div class="crowd-result-grid">
     <div><small>NÚMEROS DE CALENDÁRIO (1–31)</small><strong>${ref} / 5</strong></div>
     <div><small>FORA DAS DATAS (32–50)</small><strong>${result.above_31} / 5</strong></div>
     <div><small>INDICADOR RELATIVO*</small><strong>${delta}</strong></div>
     <div><small>AMOSTRA COM MESMA CONTAGEM</small><strong>${result.evidence_draws} concursos</strong></div>
   </div>
   <p class="muted tiny"><b>${result.band}.</b> *O valor relativo é a mudança prevista numa razão agregada de contagens de vencedores, face a cinco números dos quais três estejam entre 1–31. Não é a percentagem de apostas com esta chave, nem a probabilidade de partilhar prémios.</p>
   ${result.low_coverage?'<p class="notice">Atenção: existem poucos sorteios com 0 ou 1 números de calendário; a extrapolação é especialmente incerta.</p>':''}
 </div>`;
}
function crowdEvaluateManual(){
 if(!crowdModel)return toast('O indicador ainda não carregou.');
 try{
   const numbers=EuroCrowd.parse(document.getElementById('crowd-numbers').value,5);
   const stars=EuroCrowd.parse(document.getElementById('crowd-stars').value,2);
   const result=EuroCrowd.evaluate({numbers,stars},crowdModel);
   document.getElementById('crowd-manual-result').innerHTML=crowdDrawResult(result);
 }catch(e){document.getElementById('crowd-manual-result').textContent=e.message;}
}
function crowdEvaluateVault(){
 if(!crowdModel)return toast('O modelo ainda não está disponível.');
 const place=document.getElementById('crowd-vault-result');
 if(!vault.length){place.textContent='Ainda não tens chaves no Cofre. Gera ou adiciona primeiro as tuas combinações.';return;}
 const rows=vault.map((v,i)=>({number:i+1,score:EuroCrowd.evaluate(v,crowdModel)})).sort((a,b)=>a.score.relative_proxy-b.score.relative_proxy||a.number-b.number);
 place.innerHTML=`<p class="muted tiny">${rows.length} chaves ordenadas apenas por um indicador relativo de calendário. A ordem não representa a probabilidade de ganhar ou de dividir o prémio.</p>
 <div class="crowd-vault-list">${rows.slice(0,100).map(x=>`<div class="crowd-vault-row">
  <b>#${x.number}</b><div class="balls">${ballsHTML(x.score.numbers,x.score.stars)}</div>
  <span>${x.score.calendar_numbers} datas · ${crowdPercent(x.score.relative_proxy_pct)}</span>
 </div>`).join('')}</div>`;
}
async function crowdInit(){
 const status=document.getElementById('crowd-model-status');
 try{
   const response=await fetch('data/modelo-popularidade-v14.json',{cache:'no-cache'});
   if(!response.ok)throw Error('HTTP '+response.status);
   crowdModel=await response.json();
   if(crowdModel.version!=='1.4.0'||crowdModel.validation.validation_draws===0)throw Error('Estrutura do modelo incompatível.');
   status.textContent='Modelo experimental carregado · '+crowdModel.usable_draws+' sorteios · calibração até '+normalDate(crowdModel.calibration_end)+'.';
   document.getElementById('crowd-training').textContent=crowdModel.training_draws.toLocaleString('pt-PT');
   document.getElementById('crowd-validation').textContent=crowdModel.validation_draws.toLocaleString('pt-PT');
   document.getElementById('crowd-improvement').textContent=(crowdModel.validation.relative_mse_reduction*100).toFixed(1).replace('.',',')+'%';
   document.getElementById('crowd-manual-submit').disabled=false;
   document.getElementById('crowd-vault-submit').disabled=false;
 }catch(e){
   status.textContent='Não foi possível carregar o modelo: '+e.message+'.';
 }
}
document.getElementById('crowd-manual-submit').addEventListener('click',crowdEvaluateManual);
document.getElementById('crowd-vault-submit').addEventListener('click',crowdEvaluateVault);
crowdInit();
