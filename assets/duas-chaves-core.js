/* EUROLAB v1.7 — Chave 1 usa o modelo vencedor de backtests reproduzíveis;
   Chave 2 usa modelo Crowd experimental. Não provam capacidade preditiva. */
(function(root,factory){
 'use strict';
 const api=factory();
 root.EuroDuasChaves=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MAIN=Array.from({length:50},(_,i)=>i+1);
 const STARS=Array.from({length:12},(_,i)=>i+1);
 const HIST_WINDOW=250;
 const CROWD_MIN_OBSERVATIONS=80;
 const RNG_SCALE=16777216; // 2^24 sorteios discretos, fonte criptográfica no navegador.
 const methods=['aleatorio','frequentes','raros','equilibrado','antidatas'];
 const firstId='walk-forward-v17',secondId='crowd-calendar-v14';

 function validSet(v,n,max){
   return Array.isArray(v)&&v.length===n&&v.every(x=>Number.isInteger(x)&&x>=1&&x<=max)&&new Set(v).size===n;
 }
 function randomUnit(randomIndex){
   const idx=randomIndex(RNG_SCALE);
   if(!Number.isInteger(idx)||idx<0||idx>=RNG_SCALE)throw Error('Fonte aleatória inválida.');
   return idx/RNG_SCALE;
 }
 function weightedPick(pool,count,weights,randomIndex){
   if(!Array.isArray(pool)||!Array.isArray(weights)||pool.length!==weights.length||
      count<1||count>pool.length||weights.some(w=>!Number.isFinite(w)||w<=0))
      throw Error('Pesos estatísticos inválidos.');
   let items=pool.slice(),mass=weights.slice(),selected=[];
   for(let i=0;i<count;i++){
     let total=mass.reduce((a,b)=>a+b,0),target=randomUnit(randomIndex)*total,chosen=mass.length-1;
     for(let j=0;j<mass.length;j++){target-=mass[j];if(target<0){chosen=j;break;}}
     selected.push(items.splice(chosen,1)[0]);
     mass.splice(chosen,1);
   }
   return selected.sort((a,b)=>a-b);
 }
 function uniformPick(pool,count,randomIndex){
   let items=pool.slice(),chosen=[];
   if(!Number.isInteger(count)||count>items.length||count<0)throw Error('Universo incompleto.');
   for(let i=0;i<count;i++){
     const idx=randomIndex(items.length);
     if(!Number.isInteger(idx)||idx<0||idx>=items.length)throw Error('Fonte aleatória inválida.');
     chosen.push(items.splice(idx,1)[0]);
   }
   return chosen.sort((a,b)=>a-b);
 }
 function historicalWeights(pool,past,field){
   // Mesma transformação do método "frequentes" em assets/app.js v1.1: 1 + 4*(f-min)/(max-min).
   const counts=Array(Math.max(...pool)+1).fill(0);
   for(const draw of past)for(const x of draw[field])counts[x]++;
   const vals=pool.map(x=>counts[x]),lo=Math.min(...vals),hi=Math.max(...vals),spread=hi-lo||1;
   return pool.map(x=>1+4*(counts[x]-lo)/spread);
 }
 function generateMode(mode,past,randomIndex){
   if(!methods.includes(mode)||!Array.isArray(past)||past.length!==HIST_WINDOW)
     throw Error('Estratégia ou janela histórica inválida.');
   const numbersWeights=mode==='frequentes'?historicalWeights(MAIN,past,'numbers'):
      mode==='raros'?historicalWeights(MAIN,past,'numbers').map(x=>6-x):
      mode==='antidatas'?MAIN.map(x=>x>31?2.8:0.6):MAIN.map(()=>1);
   const starsWeights=mode==='frequentes'?historicalWeights(STARS,past,'stars'):
      mode==='raros'?historicalWeights(STARS,past,'stars').map(x=>6-x):STARS.map(()=>1);
   const attempt=()=>({numbers:weightedPick(MAIN,5,numbersWeights,randomIndex),
                        stars:weightedPick(STARS,2,starsWeights,randomIndex)});
   for(let i=0;i<700;i++){
     const candidate=attempt(),ns=candidate.numbers;
     if(mode==='equilibrado'){
       const odd=ns.filter(x=>x%2!==0).length,span=ns[4]-ns[0];
       const decades=new Set(ns.map(x=>Math.floor((x-1)/10))).size;
       if(!([2,3].includes(odd)&&span>=20&&decades>=3))continue;
     }
     if(mode==='antidatas'&&ns.filter(x=>x>31).length<3)continue;
     return candidate;
   }
   return attempt(); // mesma salvaguarda do gerador v1.1
 }
 function cleanHistory(history){
   const draws=Array.isArray(history)?history:history?.draws;
   if(!Array.isArray(draws))throw Error('Histórico validado indisponível.');
   const recent=draws.filter(d=>d&&typeof d.date==='string'&&d.date>='2016-09-27')
       .slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,HIST_WINDOW);
   if(recent.length<HIST_WINDOW)throw Error('Não existem 250 concursos da era das 12 estrelas.');
   if(new Set(recent.map(d=>d.date)).size!==recent.length)throw Error('Datas duplicadas no histórico.');
   for(const d of recent){
     if(!validSet(d.numbers,5,50)||!validSet(d.stars,2,12))
       throw Error('Dados históricos inválidos: '+d.date);
   }
   return recent;
 }
 function checkCrowd(model){
   if(!model||model.id!=='eurolab-crowd-calendar-v1'||model.version!=='1.4.0'||
      !Number.isFinite(model.coefficients?.calendar_number)||
      !Number.isInteger(model.reference_calendar_count)||
      !model.coverage_by_calendar_numbers||typeof model.calibration_end!=='string'){
     throw Error('O modelo Crowd Intelligence não está disponível ou está incorreto.');
   }
   return model;
 }
 function comb(n,k){
   if(k<0||k>n)return 0;
   let result=1;
   for(let i=1;i<=k;i++)result=result*(n-i+1)/i;
   return result;
 }
 function crowdIndex(numbers,model){
   let dates=numbers.filter(x=>x<=31).length;
   return Math.exp(model.coefficients.calendar_number*(dates-model.reference_calendar_count));
 }
 function makeFirst(past,randomIndex,selectedMethod){
   return generateMode(selectedMethod,past,randomIndex);
 }
 function makeSecond(first,model,randomIndex){
   const used=new Set(first.numbers),low=MAIN.filter(x=>x<=31&&!used.has(x)),
         high=MAIN.filter(x=>x>31&&!used.has(x));
   const cohorts=[];
   for(let d=0;d<=5;d++){
     const observations=Number(model.coverage_by_calendar_numbers[String(d)]);
     if(!Number.isFinite(observations)||observations<CROWD_MIN_OBSERVATIONS)continue;
     const possibilities=comb(low.length,d)*comb(high.length,5-d);
     if(possibilities<1)continue;
     const factor=Math.exp(-model.coefficients.calendar_number*(d-model.reference_calendar_count));
     cohorts.push({dates:d,weight:possibilities*factor,observations});
   }
   if(!cohorts.length)throw Error('Não há grupos de calendário com evidência suficiente.');
   const selected=weightedPick(cohorts,1,cohorts.map(c=>c.weight),randomIndex)[0];
   const numbers=uniformPick(low,selected.dates,randomIndex)
       .concat(uniformPick(high,5-selected.dates,randomIndex)).sort((a,b)=>a-b);
   const stars=uniformPick(STARS.filter(x=>!first.stars.includes(x)),2,randomIndex);
   return {numbers,stars};
 }
 function validate(pair){
   if(!pair||!pair.first||!pair.second||!pair.models)return false;
   const a=pair.first,b=pair.second,m=pair.models;
   if(!validSet(a.numbers,5,50)||!validSet(a.stars,2,12)||
      !validSet(b.numbers,5,50)||!validSet(b.stars,2,12))return false;
   if(a.numbers.some(x=>b.numbers.includes(x))||a.stars.some(x=>b.stars.includes(x)))return false;
   if(m.first!==firstId||!methods.includes(m.selected_method)||m.selector_version!=='1.7'||
      m.evaluation_draws!==250||m.evaluation_seeds!==5||
      !Number.isFinite(m.evaluation_score)||!Number.isFinite(m.baseline_score)||
      typeof m.evaluation_from!=='string'||m.evaluation_until!==m.history_end||
      m.second!==secondId||m.window!==HIST_WINDOW||
      typeof m.history_end!=='string'||typeof m.crowd_calibrated_until!=='string'||
      !Number.isFinite(m.crowd_relative_index)||m.crowd_relative_index<=0||
      !Number.isInteger(m.crowd_dates)||m.crowd_dates!==b.numbers.filter(x=>x<=31).length||
      m.crowd_support<CROWD_MIN_OBSERVATIONS)return false;
   return true;
 }
 function generate(history,crowdModel,randomIndex,selection){
   if(typeof randomIndex!=='function')throw Error('Fonte aleatória criptográfica indisponível.');
   const past=cleanHistory(history),model=checkCrowd(crowdModel);
   if(!selection||selection.version!=='1.7'||!methods.includes(selection.selected)||
      selection.window!==HIST_WINDOW||selection.draws_evaluated!==250||
      selection.seeds!==5||selection.history_end!==past[0].date||
      selection.eval_until!==past[0].date||
      !Number.isFinite(selection.selected_score)||!Number.isFinite(selection.baseline_score))
      throw Error('Avaliação comparativa dos métodos indisponível ou desatualizada.');
   const first=makeFirst(past,randomIndex,selection.selected),
         second=makeSecond(first,model,randomIndex);
   const dates=second.numbers.filter(x=>x<=31).length;
   const pair={first,second,models:{
     first:firstId,selected_method:selection.selected,selector_version:selection.version,
     evaluation_draws:selection.draws_evaluated,evaluation_seeds:selection.seeds,
     evaluation_score:selection.selected_score,baseline_score:selection.baseline_score,
     evaluation_from:selection.eval_from,evaluation_until:selection.eval_until,
     second:secondId,window:HIST_WINDOW,
     history_end:past[0].date,
     crowd_calibrated_until:model.calibration_end,
     crowd_dates:dates,
     crowd_support:Number(model.coverage_by_calendar_numbers[String(dates)]),
     crowd_relative_index:crowdIndex(second.numbers,model),
     crowd_coefficient:model.coefficients.calendar_number
   }};
   if(!validate(pair))throw Error('Falha na verificação dos modelos e das chaves.');
   return pair;
 }
 function validKey(key){
   return !!key&&validSet(key.numbers,5,50)&&validSet(key.stars,2,12);
 }
 function disjoint(a,b){
   return !a.numbers.some(n=>b.numbers.includes(n))&&
          !a.stars.some(n=>b.stars.includes(n));
 }
 function assertSelection(past,selection){
   if(!selection||selection.version!=='1.7'||!methods.includes(selection.selected)||
      selection.window!==HIST_WINDOW||selection.draws_evaluated!==250||
      selection.seeds!==5||selection.history_end!==past[0].date||
      selection.eval_until!==past[0].date||
      !Number.isFinite(selection.selected_score)||!Number.isFinite(selection.baseline_score))
      throw Error('Avaliação comparativa dos métodos indisponível ou desatualizada.');
 }
 function generateFirst(history,randomIndex,selection,other=null){
   if(typeof randomIndex!=='function')throw Error('Fonte aleatória indisponível.');
   const past=cleanHistory(history);
   assertSelection(past,selection);
   if(other!==null&&!validKey(other))throw Error('Chave 2 existente inválida.');
   for(let i=0;i<3000;i++){
     const candidate=makeFirst(past,randomIndex,selection.selected);
     if(other===null||disjoint(candidate,other))return candidate;
   }
   throw Error('Não foi possível gerar uma chave independente da Chave 2.');
 }
 function generateSecond(crowdModel,randomIndex,other=null){
   if(typeof randomIndex!=='function')throw Error('Fonte aleatória indisponível.');
   const model=checkCrowd(crowdModel);
   if(other!==null&&!validKey(other))throw Error('Chave 1 existente inválida.');
   const candidate=makeSecond(other||{numbers:[],stars:[]},model,randomIndex);
   const dates=candidate.numbers.filter(n=>n<=31).length;
   if(!validKey(candidate)||other!==null&&!disjoint(other,candidate))
     throw Error('Falha na validação da Chave 2.');
   return {key:candidate,study:{
      model:secondId,calibrated_until:model.calibration_end,
      dates,observations:Number(model.coverage_by_calendar_numbers[String(dates)]),
      relative_index:crowdIndex(candidate.numbers,model),
      coefficient:model.coefficients.calendar_number
   }};
 }
 function fingerprint(key){
   return key.numbers.join('-')+'|'+key.stars.join('-');
 }
 function validBatch(keys){
   return Array.isArray(keys)&&keys.length<=5&&keys.length>=0&&
     keys.every(validKey)&&new Set(keys.map(fingerprint)).size===keys.length;
 }
 function generateBatch(method,count,history,crowdModel,selection,randomIndex,opposite=[]){
   if(![1,2].includes(method)||!Number.isInteger(count)||count<1||count>5)
     throw Error('O número de apostas deve estar entre 1 e 5.');
   if(!validBatch(opposite))throw Error('As apostas do outro método são inválidas.');
   // Só é garantida ausência total de números/estrelas repetidos no caso de 1+1.
   // Para até 10 apostas, a ausência de estrelas em comum seria impossível.
   const strictOther=count===1&&opposite.length===1?opposite[0]:null;
   const used=new Set(opposite.map(fingerprint));
   const keys=[],studies=[];
   for(let i=0;i<count;i++){
     let generated=null;
     for(let attempt=0;attempt<3000;attempt++){
       const result=method===1?
         {key:generateFirst(history,randomIndex,selection,strictOther)}:
         generateSecond(crowdModel,randomIndex,strictOther);
       if(used.has(fingerprint(result.key)))continue;
       generated=result;break;
     }
     if(!generated)throw Error('Não foi possível obter apostas distintas.');
     keys.push(generated.key);
     studies.push(method===2?generated.study:null);
     used.add(fingerprint(generated.key));
   }
   if(!validBatch(keys))throw Error('O gerador produziu apostas repetidas ou inválidas.');
   return {keys,studies};
 }
 function format(key){
   return key.numbers.map(n=>String(n).padStart(2,'0')).join(' · ')+'   +   '+
     key.stars.map(n=>String(n).padStart(2,'0')).join(' · ');
 }
 return {generate,generateFirst,generateSecond,generateBatch,validBatch,fingerprint,generateMode,validKey,disjoint,validate,format,historicalWeights,crowdIndex,cleanHistory,
         MODEL_1:firstId,MODEL_2:secondId,HIST_WINDOW,CROWD_MIN_OBSERVATIONS,methods};
});
