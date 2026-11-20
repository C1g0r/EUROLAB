/* EUROLAB v1.2 — Estratégia configurável e diário técnico. Sem serviços externos. */
'use strict';
const ST_CONFIG_KEY='eurolab-v12-strategy';
const ST_EVIDENCE_KEY='eurolab-v12-evidence';
let stGenerated=[],stReport=null,evidence=[];
const byId=id=>document.getElementById(id);
const strategyPresets={
 neutro:{freq:0,stars:0,parity:'qualquer',above:0,min:15,max:240,exclude:''},
 quentes:{freq:2,stars:2,parity:'qualquer',above:0,min:15,max:240,exclude:''},
 frios:{freq:-2,stars:-2,parity:'qualquer',above:0,min:15,max:240,exclude:''},
 equilibrio:{freq:0,stars:0,parity:'2-3',above:0,min:95,max:170,exclude:''},
 datas:{freq:0,stars:0,parity:'qualquer',above:3,min:15,max:240,exclude:''}
};
function stConfig(){
 let excluded=byId('st-exclude').value.trim().split(/[\s,;]+/).filter(Boolean);
 if(excluded.some(x=>!/^\d+$/.test(x)))throw Error('Os números excluídos devem ser inteiros de 1 a 50.');
 let exclude=[...new Set(excluded.map(Number))].sort((a,b)=>a-b);
 if(exclude.some(n=>n<1||n>50)||exclude.length>45)throw Error('Exclusões inválidas: são necessários pelo menos cinco números disponíveis.');
 let cfg={freq:Number(byId('st-freq').value),stars:Number(byId('st-stars').value),parity:byId('st-parity').value,above:Number(byId('st-above').value),min:Number(byId('st-sum-min').value),max:Number(byId('st-sum-max').value),exclude,window:Number(byId('st-window').value)};
 if(!Number.isInteger(cfg.min)||!Number.isInteger(cfg.max)||cfg.min<15||cfg.max>240||cfg.min>cfg.max)throw Error('A soma mínima e máxima deve estar entre 15 e 240, com mínimo ≤ máximo.');
 if(![100,250].includes(cfg.window)||![-3,-2.5,-2,-1.5,-1,-0.5,0,0.5,1,1.5,2,2.5,3].includes(cfg.freq)||Math.abs(cfg.stars)>3)throw Error('Configuração inválida.');
 return cfg;
}
function stSetConfig(p){
 byId('st-freq').value=p.freq;
 byId('st-stars').value=p.stars;
 byId('st-parity').value=p.parity;
 byId('st-above').value=p.above;
 byId('st-sum-min').value=p.min;
 byId('st-sum-max').value=p.max;
 byId('st-exclude').value=Array.isArray(p.exclude)?p.exclude.join(', '):p.exclude;
 if(p.window)byId('st-window').value=p.window;
 stUpdateSlider();
}
function stUpdateSlider(){for(const id of ['freq','stars'])byId('st-'+id+'-value').textContent=Number(byId('st-'+id).value)>0?'+'+byId('st-'+id).value:byId('st-'+id).value;}
function stWeights(values,pool,k){
 const counts=Array(Math.max(...pool)+1).fill(0);
 values.forEach(x=>x.forEach(n=>{if(n in counts)counts[n]++}));
 const all=pool.map(n=>counts[n]),mn=Math.min(...all),mx=Math.max(...all),span=mx-mn;
 return pool.map(n=>Math.exp(span?k*(2*(counts[n]-mn)/span-1)/2:0));
}
function stSatisfies(nums,c){
 let odds=nums.filter(n=>n%2!==0).length;
 if(c.parity==='2-3'&&(odds<2||odds>3))return false;
 if(c.parity==='1-4'&&(odds<1||odds>4))return false;
 if(nums.filter(n=>n>31).length<c.above)return false;
 const sum=nums.reduce((a,b)=>a+b,0);
 return sum>=c.min&&sum<=c.max;
}
function stMakeKey(c,past,rng){
 const ex=new Set(c.exclude);
 const nums=Array.from({length:50},(_,i)=>i+1).filter(n=>!ex.has(n));
 const stars=Array.from({length:12},(_,i)=>i+1);
 const nW=stWeights(past.map(d=>d.numbers),nums,c.freq);
 const sW=stWeights(past.map(d=>d.stars),stars,c.stars);
 for(let tries=0;tries<1800;tries++){
  let numbers=pickWeighted(nums,5,nW,rng),ss=pickWeighted(stars,2,sW,rng);
  if(stSatisfies(numbers,c))return {numbers,stars:ss};
 }
 throw Error('Critérios demasiado restritivos. Alarga a soma, a paridade ou as exclusões.');
}
function stWarn(msg){byId('st-warning').textContent=msg||'';}
function stGenerate(){
 try{
  if(!D.draws.length)throw Error('Histórico ainda não carregado.');
  const c=stConfig(),past=[...D.draws].filter(d=>d.date>='2016-09-27').slice(0,c.window);
  if(past.length<c.window)throw Error('Não há histórico suficiente no regime atual.');
  let count=Number(byId('st-count').value),seen=new Set();stGenerated=[];
  for(let i=0;i<count;i++){
   let key=null;
   for(let j=0;j<90;j++){
    const x=stMakeKey(c,past,randomUnit);
    if(!seen.has(fullKey(x))){key=x;break;}
   }
   if(!key)throw Error('Não foi possível gerar chaves distintas com estes critérios.');
   seen.add(fullKey(key));stGenerated.push(key);
  }
  byId('st-keys').classList.remove('empty');
  byId('st-keys').innerHTML=stGenerated.map((k,i)=>`<div class="generated-entry"><div class="generated-entry-head"><strong>CHAVE ${String(i+1).padStart(2,'0')}</strong></div><div class="balls">${ballsHTML(k.numbers,k.stars)}</div></div>`).join('');
  byId('st-vault').disabled=false;byId('st-keys-export').disabled=false;
  stWarn(`${stGenerated.length} combinações geradas. Critérios de escolha, não previsão.`);
 }catch(e){stWarn(e.message);toast(e.message);}
}
function stTest(){
 try{
  if(!D.draws.length)throw Error('Histórico não disponível.');
  const c=stConfig(),seed=Number(byId('st-seed').value),lim=Number(byId('st-test-size').value);
  if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Semente inválida: inteiro entre 0 e 4294967295.');
  const era=D.draws.filter(d=>d.date>='2016-09-27').slice().reverse();
  const begin=Math.max(c.window,era.length-lim),rng=testRng(seed),predictions=[],details=[];
  let hitN=0,hitS=0,atLeast2=0,atLeast3=0;
  for(let i=begin;i<era.length;i++){
   const past=era.slice(i-c.window,i),key=stMakeKey(c,past,rng),draw=era[i],hn=intersect(key.numbers,draw.numbers),hs=intersect(key.stars,draw.stars);
   predictions.push(key);hitN+=hn;hitS+=hs;if(hn>=2)atLeast2++;if(hn>=3)atLeast3++;
   details.push({date:draw.date,chosen:key,number_hits:hn,star_hits:hs});
  }
  if(!predictions.length)throw Error('Não há concursos para o intervalo escolhido.');
  // Comparação descritiva condicional às chaves obtidas. NÃO simula a reotimização
  // da estratégia em histórias alternativas, por isso não oferece p-valores confirmatórios.
  const simRng=testRng((seed^0xA918D45E)>>>0),refN=[],refS=[];
  const allN=Array.from({length:50},(_,i)=>i+1),allS=Array.from({length:12},(_,i)=>i+1);
  for(let r=0;r<500;r++){
   let hN=0,hS=0;
   for(const key of predictions){
    const rn=pickWeighted(allN,5,allN.map(()=>1),simRng),rs=pickWeighted(allS,2,allS.map(()=>1),simRng);
    hN+=intersect(rn,key.numbers);hS+=intersect(rs,key.stars);
   }
   refN.push(hN);refS.push(hS);
  }
  refN.sort((a,b)=>a-b);refS.sort((a,b)=>a-b);
  const quantile=(xs,p)=>xs[Math.floor(p*(xs.length-1))];
  stReport={version:'EUROLAB v1.2',date_data_end:era.at(-1).date,method:'walk-forward; uma chave por concurso; sem fuga de dados; 500 simulações de referência condicionais às previsões fixas',seed,parameters:c,draws_evaluated:predictions.length,first_date:details[0].date,last_date:details.at(-1).date,results:{number_hits:hitN,star_hits:hitS,two_or_more:atLeast2,three_or_more:atLeast3,expected_number_hits:predictions.length*.5,expected_star_hits:predictions.length/3,simulation_90_interval_numbers:[quantile(refN,.05),quantile(refN,.95)],simulation_90_interval_stars:[quantile(refS,.05),quantile(refS,.95)]},limitations:'Comparação exploratória. Simulações condicionam nas chaves previstas; não reexecutam a estratégia em histórias alternativas. Não são valores-p calibrados nem vantagem preditiva demonstrada. Resultados ficam contaminados por qualquer ajuste dos parâmetros após observar o teste.',details};
  byId('st-test-results').innerHTML=`<div class="lab-report"><div class="status-grid"><div class="status-tile"><small>CONCURSOS TESTADOS</small><strong>${fmt.format(predictions.length)}</strong></div><div class="status-tile"><small>ACERTOS DE NÚMEROS</small><strong>${hitN}</strong></div><div class="status-tile"><small>ACERTOS DE ESTRELAS</small><strong>${hitS}</strong></div><div class="status-tile"><small>CONCURSOS COM 3+ NÚMEROS</small><strong>${atLeast3}</strong></div></div><p class="muted tiny">Esperado pelo acaso: ${(.5*predictions.length).toFixed(1)} acertos de números e ${(predictions.length/3).toFixed(1)} de estrelas. Banda descritiva de 90% (simulação): números [${quantile(refN,.05)}–${quantile(refN,.95)}], estrelas [${quantile(refS,.05)}–${quantile(refS,.95)}].</p><p class="muted tiny">Período: ${normalDate(details[0].date)} a ${normalDate(details.at(-1).date)}. A banda é condicional às chaves previstas; não é um teste confirmatório de vantagem.</p></div>`;
  byId('st-test-export').disabled=false;stWarn('Teste concluído. Compara os resultados com a referência aleatória, sem extrapolar previsões.');
 }catch(e){stWarn(e.message);toast(e.message);}
}
function stCSV(){const header='numero_da_chave;n1;n2;n3;n4;n5;e1;e2';return header+'\n'+stGenerated.map((k,i)=>[i+1,...k.numbers,...k.stars].join(';')).join('\n');}
function stEvidenceLoad(){try{const raw=JSON.parse(localStorage.getItem(ST_EVIDENCE_KEY)||'[]');evidence=Array.isArray(raw)?raw.filter(x=>x&&typeof x.date==='string').slice(0,150):[]}catch{evidence=[]}}
function stEvidenceRender(){
 byId('ev-list').innerHTML=evidence.length?evidence.slice().reverse().map((x,i)=>`<div class="ev-record"><b>${escapeHTML(x.date)} · Máquina ${escapeHTML(x.machine||'?')} · Lote ${escapeHTML(x.balls||'?')}</b><small>${escapeHTML(x.origin)} · Registo do utilizador, não validado</small><p>${escapeHTML(x.note||'')}</p><div class="inline-actions">${x.url?`<a class="text-action" target="_blank" rel="noopener noreferrer" href="${escapeHTML(x.url)}">Consultar fonte ↗</a>`:''}<button class="text-action danger-text" data-ev-remove="${evidence.length-1-i}">Eliminar</button></div></div>`).join(''):'<p class="muted tiny">Ainda não adicionaste observações.</p>';
}
function stEvidenceAdd(){
 const date=byId('ev-date').value,draw=D.draws.find(x=>x.date===date),machine=byId('ev-machine').value.trim(),balls=byId('ev-balls').value.trim(),url=byId('ev-url').value.trim(),note=byId('ev-note').value.trim(),origin=byId('ev-origin').value;
 if(!draw){toast('Indica uma data que exista no histórico até 17/11/2026.');return;}
 if(!machine&&!balls){toast('Preenche pelo menos um identificador.');return;}
 if(url&&!/^https?:\/\//i.test(url)){toast('A ligação deve começar por https:// ou http://.');return;}
 if(evidence.length>=150){toast('Limite de 150 observações; exporta antes de adicionar mais.');return;}
 evidence.push({date,machine,balls,url,note,origin,recorded_at:new Date().toISOString()});
 try{localStorage.setItem(ST_EVIDENCE_KEY,JSON.stringify(evidence))}catch{toast('Não foi possível guardar localmente. Exporta o diário.');}
 stEvidenceRender();toast('Observação registada (não verificada).');
}
function stInit(){
 byId('st-preset').addEventListener('change',e=>stSetConfig(strategyPresets[e.target.value]));
 for(const id of ['st-freq','st-stars'])byId(id).addEventListener('input',stUpdateSlider);
 byId('st-generate').addEventListener('click',stGenerate);
 byId('st-save-config').addEventListener('click',()=>{try{const c=stConfig();localStorage.setItem(ST_CONFIG_KEY,JSON.stringify(c));toast('Estratégia guardada neste navegador.')}catch(e){toast(e.message)}});
 byId('st-vault').addEventListener('click',()=>addVault(stGenerated));
 byId('st-keys-export').addEventListener('click',()=>{if(stGenerated.length)downloadFile(stCSV(),'EUROLAB_estrategia_chaves.csv','text/csv')});
 byId('st-test').addEventListener('click',stTest);
 byId('st-test-export').addEventListener('click',()=>{if(stReport)downloadFile(JSON.stringify(stReport,null,2),'EUROLAB_estrategia_teste_v12.json','application/json')});
 byId('ev-add').addEventListener('click',stEvidenceAdd);
 byId('ev-export').addEventListener('click',()=>downloadFile(JSON.stringify({version:1,source:'EUROLAB, notas manuais não verificadas',records:evidence},null,2),'EUROLAB_diario_evidencias.json','application/json'));
 byId('ev-list').addEventListener('click',e=>{const b=e.target.closest('[data-ev-remove]');if(!b)return;evidence.splice(Number(b.dataset.evRemove),1);localStorage.setItem(ST_EVIDENCE_KEY,JSON.stringify(evidence));stEvidenceRender()});
 try{const saved=JSON.parse(localStorage.getItem(ST_CONFIG_KEY)||'null');if(saved)stSetConfig(saved)}catch{}
 stEvidenceLoad();stEvidenceRender();stUpdateSlider();
}
stInit();
