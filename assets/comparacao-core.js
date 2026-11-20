/* EUROLAB v1.3 — Núcleo puro e testável da comparação walk-forward. */
(function(root){
  "use strict";
  function compareRun(draws, settings, choose, makeRng) {
  const modes = ["aleatorio","frequentes","raros","equilibrado","antidatas"];
  const labels = {aleatorio:"Aleatório uniforme",frequentes:"Frequências altas",raros:"Frequências baixas",equilibrado:"Equilibrado",antidatas:"Anti-datas"};
  const windowSize = Number(settings.window), count = Number(settings.count), seed=Number(settings.seed);
  if (![100,250,500].includes(windowSize)||![120,250,500].includes(count)||!Number.isInteger(seed)||seed<0||seed>4294967295) throw new Error("Parâmetros de comparação inválidos.");
  if (typeof choose!=="function"||typeof makeRng!=="function"||!Array.isArray(draws)) throw new Error("Motor de comparação indisponível.");
  const era=draws.filter(d=>d.date>="2016-09-27").slice().sort((a,b)=>a.date.localeCompare(b.date));
  if(era.length<=windowSize)throw new Error("Histórico insuficiente no regime das 12 estrelas.");
  const start=Math.max(windowSize,era.length-count);
  const n=era.length-start, numberVar=5*(5/50)*(45/50)*(45/49), starVar=2*(2/12)*(10/12)*(10/11);
  const reference={numbers:n*.5,stars:n/3,number_band_95:[Math.max(0,n*.5-1.96*Math.sqrt(n*numberVar)),n*.5+1.96*Math.sqrt(n*numberVar)],star_band_95:[Math.max(0,n/3-1.96*Math.sqrt(n*starVar)),n/3+1.96*Math.sqrt(n*starVar)]};
  const strategies=modes.map((mode,mi)=>{
    const rng=makeRng((seed+Math.imul(mi+1,0x9e3779b9))>>>0);
    let numberHits=0,starHits=0,two=0,three=0;
    const distribution=[0,0,0,0,0,0],years={},details=[];
    for(let i=start;i<era.length;i++){
      const past=era.slice(i-windowSize,i), target=era[i], key=choose(mode,past,rng);
      const nums=key?.numbers,stars=key?.stars;
      if(!Array.isArray(nums)||!Array.isArray(stars)||nums.length!==5||stars.length!==2||new Set(nums).size!==5||new Set(stars).size!==2||nums.some(v=>!Number.isInteger(v)||v<1||v>50)||stars.some(v=>!Number.isInteger(v)||v<1||v>12))throw new Error("Gerador devolveu uma chave inválida.");
      if(past.some(d=>d.date>=target.date))throw new Error("Fuga temporal de dados detetada.");
      const hn=nums.filter(v=>target.numbers.includes(v)).length, hs=stars.filter(v=>target.stars.includes(v)).length;
      numberHits+=hn;starHits+=hs;distribution[hn]++;if(hn>=2)two++;if(hn>=3)three++;
      const yr=target.date.slice(0,4);if(!years[yr])years[yr]={draws:0,numbers:0,stars:0};years[yr].draws++;years[yr].numbers+=hn;years[yr].stars+=hs;
      details.push({date:target.date,numbers:nums,stars,number_hits:hn,star_hits:hs,cumulative_number_difference:numberHits-(details.length+1)*.5});
    }
    return {mode,label:labels[mode],numbers_hits:numberHits,stars_hits:starHits,two_or_more:two,three_or_more:three,number_distribution:distribution,by_year:years,details};
  });
  return {version:"1.3",method:"Walk-forward, uma chave por concurso; cinco métodos, janela e período idênticos; gerador v1.2; PRNG com semente fixa.",scope:"Exclusivamente regime com 12 estrelas",window:windowSize,seed,draws_evaluated:n,first_date:era[start].date,last_date:era.at(-1).date,expected:reference,strategies,limitations:"Exploratório. Bandas normais aproximadas sob sorteios justos, não corrigidas por seleção da melhor estratégia ou múltiplas comparações. Ajustar métodos após observar resultados invalida inferências confirmatórias."};
}
  root.EuroCompare={evaluate:compareRun};
})(typeof globalThis!=="undefined"?globalThis:this);
