/* EUROLAB v1.3 — comparação visual dos cinco métodos sobre o mesmo período. */
'use strict';
let cmpReport=null;

function cmpSigned(v,precision=1){return (v>=0?'+':'')+v.toFixed(precision);}
function cmpChart(points){
  if(!points.length)return '';
  const x0=52,x1=786,y0=28,y1=226,values=points.map(d=>d.cumulative_number_difference);
  const lim=Math.max(5,Math.ceil(Math.max(...values.map(Math.abs))/5)*5);
  const xp=i=>x0+i*(x1-x0)/Math.max(1,points.length-1);
  const yp=v=>y0+(lim-v)/(2*lim)*(y1-y0);
  const poly=values.map((v,i)=>xp(i).toFixed(2)+','+yp(v).toFixed(2)).join(' ');
  const z=yp(0).toFixed(1),first=points[0].date,last=points.at(-1).date;
  return `<svg class="cmp-linechart" viewBox="0 0 820 280" role="img" aria-label="Diferença acumulada entre acertos de números e a expectativa do acaso, sem provar vantagem"><title>Desvio acumulado face à expectativa de números acertados</title>
  <line x1="${x0}" y1="${z}" x2="${x1}" y2="${z}" stroke="#638586" stroke-dasharray="7 6" stroke-width="1.5"/>
  <line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="#38585d"/>
  <text x="43" y="32" text-anchor="end" fill="#8badad" font-size="14">+${lim}</text>
  <text x="43" y="${Number(z)+5}" text-anchor="end" fill="#8badad" font-size="14">0</text>
  <text x="43" y="231" text-anchor="end" fill="#8badad" font-size="14">−${lim}</text>
  <polyline fill="none" stroke="#4ee4bc" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${poly}"/>
  <circle cx="${xp(points.length-1)}" cy="${yp(values.at(-1))}" r="5" fill="#4ee4bc"/>
  <text x="${x0}" y="263" fill="#8badad" font-size="13">${normalDate(first)}</text>
  <text x="${x1}" y="263" fill="#8badad" font-size="13" text-anchor="end">${normalDate(last)}</text>
  </svg>`;
}
function cmpRun(){
  if(!D.draws.length){toast('O histórico ainda está a carregar.');return;}
  const input={window:Number(document.getElementById('cmp-window').value),count:Number(document.getElementById('cmp-count').value),seed:Number(document.getElementById('cmp-seed').value)};
  try{
    cmpReport=EuroCompare.evaluate(D.draws,input,generateOne,testRng);
    document.getElementById('cmp-export-json').disabled=false;
    document.getElementById('cmp-export-csv').disabled=false;
    cmpRender();
    toast('Comparação concluída: cinco estratégias, mesma amostra.');
  }catch(e){document.getElementById('cmp-results').textContent='Não foi possível comparar: '+e.message;toast(e.message);}
}
function cmpRender(){
  if(!cmpReport)return;
  const x=cmpReport,n=x.draws_evaluated,en=x.expected.numbers,es=x.expected.stars;
  const methods=x.strategies;
  const rows=methods.map(m=>{
    const dn=m.numbers_hits-en,ds=m.stars_hits-es;
    return `<tr><th scope="row">${m.label}</th><td>${m.numbers_hits}<small>${cmpSigned(dn)} vs. acaso</small></td><td>${m.stars_hits}<small>${cmpSigned(ds)} vs. acaso</small></td><td>${m.two_or_more}</td><td>${m.three_or_more}</td></tr>`;
  }).join('');
  document.getElementById('cmp-results').innerHTML=`
    <div class="cmp-kpis">
      <div class="cmp-kpi"><small>CONCURSOS NO TESTE</small><strong>${n}</strong></div>
      <div class="cmp-kpi"><small>NÚMEROS ESPERADOS / CHAVE</small><strong>0,50</strong></div>
      <div class="cmp-kpi"><small>ESTRELAS ESPERADAS / CHAVE</small><strong>0,33</strong></div>
      <div class="cmp-kpi"><small>VANTAGEM DEMONSTRADA</small><strong>Não</strong></div>
    </div>
    <div class="bt-table-wrap"><table class="bt-table cmp-table">
     <thead><tr><th>Método</th><th>Acertos números</th><th>Acertos estrelas</th><th>2+ números</th><th>3+ números</th></tr></thead>
     <tbody>${rows}</tbody></table></div>
    <p class="muted tiny">Mesmo período para os cinco métodos: ${normalDate(x.first_date)} a ${normalDate(x.last_date)}. Esperados pelo acaso: <b>${en.toFixed(1)}</b> acertos individuais de números e <b>${es.toFixed(1)}</b> de estrelas. Uma chave por sorteio, sem usar o resultado desse sorteio para construir a chave.</p>
    <p class="muted tiny">Referência ilustrativa de 95% sob um modelo justo, com aproximação normal (não corrigida para múltiplas comparações): números ${x.expected.number_band_95.map(v=>v.toFixed(1)).join('–')}; estrelas ${x.expected.star_band_95.map(v=>v.toFixed(1)).join('–')}. Não são intervalos de previsão nem prova de vantagem.</p>`;
  const sel=document.getElementById('cmp-chart-mode');
  if(!sel.options.length)sel.innerHTML=methods.map(m=>`<option value="${m.mode}">${m.label}</option>`).join('');
  if(!methods.some(m=>m.mode===sel.value))sel.value='aleatorio';
  document.getElementById('cmp-chart-panel').classList.remove('hidden');
  cmpRenderChart();
}
function cmpRenderChart(){
  if(!cmpReport)return;
  const mode=document.getElementById('cmp-chart-mode').value;
  const row=cmpReport.strategies.find(s=>s.mode===mode)||cmpReport.strategies[0];
  document.getElementById('cmp-chart').innerHTML=cmpChart(row.details);
  const years=Object.entries(row.by_year).map(([year,x])=>`<tr><td>${year}</td><td>${x.draws}</td><td>${x.numbers}</td><td>${cmpSigned(x.numbers-x.draws*.5)}</td><td>${x.stars}</td><td>${cmpSigned(x.stars-x.draws/3)}</td></tr>`).join('');
  document.getElementById('cmp-year-table').innerHTML=`<table class="bt-table"><thead><tr><th>Ano</th><th>Sorteios</th><th>Números</th><th>Δ números</th><th>Estrelas</th><th>Δ estrelas</th></tr></thead><tbody>${years}</tbody></table>`;
}
function cmpDownload(type){
  if(!cmpReport)return;
  if(type==='json'){
    downloadFile(JSON.stringify(cmpReport,null,2),'EUROLAB_comparacao_v13.json','application/json');return;
  }
  const lines=['metodo;data;n1;n2;n3;n4;n5;e1;e2;acertos_numeros;acertos_estrelas'];
  for(const s of cmpReport.strategies)for(const d of s.details)lines.push([s.mode,d.date,...d.numbers,...d.stars,d.number_hits,d.star_hits].join(';'));
  downloadFile(lines.join('\n'),'EUROLAB_comparacao_v13.csv','text/csv;charset=utf-8');
}
function cmpInit(){
  document.getElementById('cmp-run').addEventListener('click',cmpRun);
  document.getElementById('cmp-chart-mode').addEventListener('change',cmpRenderChart);
  document.getElementById('cmp-export-json').addEventListener('click',()=>cmpDownload('json'));
  document.getElementById('cmp-export-csv').addEventListener('click',()=>cmpDownload('csv'));
}
cmpInit();
