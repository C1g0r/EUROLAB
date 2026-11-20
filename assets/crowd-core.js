/* EUROLAB v1.4 — Indicador experimental de padrões de calendário.
   NÃO estima probabilidades de sorteio, vencedores individuais ou jackpot. */
(function(root){
 "use strict";
 function normalize(numbers,stars){
   if(!Array.isArray(numbers)||!Array.isArray(stars))throw Error('Os números e as estrelas devem ser listas.');
   if(numbers.length!==5||stars.length!==2)throw Error('Indica cinco números e duas estrelas.');
   const n=numbers.map(Number).sort((a,b)=>a-b),s=stars.map(Number).sort((a,b)=>a-b);
   if(n.some(x=>!Number.isInteger(x)||x<1||x>50)||new Set(n).size!==5)throw Error('Números principais inválidos: 5 distintos de 1 a 50.');
   if(s.some(x=>!Number.isInteger(x)||x<1||x>12)||new Set(s).size!==2)throw Error('Estrelas inválidas: 2 distintas de 1 a 12.');
   return {numbers:n,stars:s};
 }
 function parse(text,count){
   const values=String(text??'').trim().split(/[\s,;|]+/).filter(Boolean);
   if(values.length!==count||values.some(x=>!/^[0-9]+$/.test(x)))throw Error(count===5?'Indica exatamente cinco números inteiros.':'Indica exatamente duas estrelas inteiras.');
   return values.map(Number);
 }
 function evaluate(key,model){
   if(!model||model.version!=='1.4.0'||!model.coefficients||!Number.isFinite(model.coefficients.calendar_number))throw Error('Modelo de investigação inválido.');
   const k=normalize(key.numbers,key.stars),b=k.numbers.filter(x=>x<=31).length,ref=model.reference_calendar_count;
   const ratio=Math.exp((b-ref)*model.coefficients.calendar_number);
   return {
     ...k,
     calendar_numbers:b,
     above_31:5-b,
     relative_proxy:ratio,
     relative_proxy_pct:(ratio-1)*100,
     evidence_draws:model.coverage_by_calendar_numbers[String(b)]||0,
     low_coverage:b<=1,
     band:b<=1?'Abaixo da referência (amostra reduzida)':b===2?'Abaixo da referência':b===3?'Referência': 'Acima da referência',
     interpretation:'Estimativa relativa de uma razão agregada entre contagens de vencedores. NÃO é uma estimativa da probabilidade desta combinação ter sido escolhida por outros jogadores.',
   };
 }
 root.EuroCrowd={normalize,parse,evaluate};
})(typeof globalThis!=='undefined'?globalThis:this);
