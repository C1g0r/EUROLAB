/* EUROLAB v1.7 — seleção adaptativa de método por backtest walk-forward.
   A seleção por resultados históricos é exploratória e NÃO prova previsão. */
(function(root,factory){
 'use strict';
 const api=factory();root.EuroSeletor=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MODES=['aleatorio','frequentes','raros','equilibrado','antidatas'];
 const LABELS={aleatorio:'Aleatório uniforme',frequentes:'Frequências altas',raros:'Frequências baixas',
   equilibrado:'Equilíbrio estatístico',antidatas:'Anti-datas'};
 const WINDOW=250,EVAL_COUNT=250;
 const SEEDS=[20261120,1171026,31415926,27182818,9042004];
 const STAR_FACTOR=0.5;
 function seeded(seed){
   let s=seed>>>0;
   return max=>{
     if(!Number.isInteger(max)||max<1||max>4294967296)throw Error('Índice aleatório inválido.');
     s=(s+0x6D2B79F5)>>>0;
     let z=s;z=Math.imul(z^(z>>>15),z|1);
     z^=z+Math.imul(z^(z>>>7),z|61);
     return Math.floor((((z^(z>>>14))>>>0)/4294967296)*max);
   };
 }
 function validSet(v,n,max){return Array.isArray(v)&&v.length===n&&new Set(v).size===n&&v.every(x=>Number.isInteger(x)&&x>=1&&x<=max);}
 function evaluate(draws,generateMode){
   if(typeof generateMode!=='function')throw Error('Motor de estratégias indisponível.');
   const all=Array.isArray(draws)?draws:draws?.draws;
   if(!Array.isArray(all))throw Error('Histórico validado indisponível.');
   const era=all.filter(d=>d?.date>='2016-09-27').slice().sort((a,b)=>a.date.localeCompare(b.date));
   if(era.length<WINDOW+EVAL_COUNT)throw Error('Concursos insuficientes para comparar os cinco métodos.');
   if(new Set(era.map(d=>d.date)).size!==era.length)throw Error('Datas duplicadas na comparação.');
   for(const d of era)if(!validSet(d.numbers,5,50)||!validSet(d.stars,2,12))
     throw Error('Dados históricos inválidos na comparação: '+d.date);
   const start=era.length-EVAL_COUNT,rows=[];
   for(let mi=0;mi<MODES.length;mi++){
     const mode=MODES[mi];let nh=0,sh=0;
     for(let si=0;si<SEEDS.length;si++){
       const rand=seeded((SEEDS[si]+Math.imul(mi+1,0x9e3779b9))>>>0);
       for(let i=start;i<era.length;i++){
         const past=era.slice(i-WINDOW,i),target=era[i];
         if(past.at(-1).date>=target.date)throw Error('Fuga temporal de dados.');
         const candidate=generateMode(mode,past,rand);
         if(!validSet(candidate?.numbers,5,50)||!validSet(candidate?.stars,2,12))
            throw Error('Método devolveu uma chave inválida.');
         nh+=candidate.numbers.filter(n=>target.numbers.includes(n)).length;
         sh+=candidate.stars.filter(n=>target.stars.includes(n)).length;
       }
     }
     const attempts=EVAL_COUNT*SEEDS.length;
     rows.push({mode,label:LABELS[mode],numbers_hits:nh,stars_hits:sh,
       score:((nh+STAR_FACTOR*sh)/attempts),
       number_hits_per_draw:nh/attempts,star_hits_per_draw:sh/attempts,
       simulations:attempts});
   }
   rows.sort((a,b)=>b.score-a.score||MODES.indexOf(a.mode)-MODES.indexOf(b.mode));
   const random=rows.find(r=>r.mode==='aleatorio');
   const winner=rows[0];
   return {
      version:'1.7',method:'walk-forward-250x5',selected:winner.mode,selected_label:winner.label,
      history_end:era.at(-1).date,eval_from:era[start].date,eval_until:era.at(-1).date,
      window:WINDOW,draws_evaluated:EVAL_COUNT,seeds:SEEDS.length,
      score_unit:'acertos ponderados por chave (números + 0,5 × estrelas)',
      selected_score:winner.score,baseline_score:random.score,
      expected_score:0.5+STAR_FACTOR/3,rankings:rows,
      disclaimer:'Escolha pelo desempenho histórico observado. Sem ajuste por múltiplas comparações, sem prova de vantagem preditiva. Cinco sementes não equivalem a cinco conjuntos independentes de sorteios.'
   };
 }
 return {evaluate,MODES,LABELS,WINDOW,EVAL_COUNT,SEEDS,STAR_FACTOR,seeded};
});
