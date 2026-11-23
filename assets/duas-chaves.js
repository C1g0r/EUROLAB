/* EUROLAB v1.9 — 1 a 5 apostas por método, estudos sem previsão. */
'use strict';
const STORAGE_KEY='eurolab-v19-apostas-por-metodo';
let batches=[[],[]],studies=[],activeData=null,activeModel=null,activeSelection=null;
const el=id=>document.getElementById(id);
const fmt=(x,n=4)=>Number(x).toFixed(n).replace('.',',');
function randIndex(max){
 if(!Number.isSafeInteger(max)||max<1||max>4294967296)throw Error('Limite aleatório inválido.');
 if(!globalThis.crypto?.getRandomValues)throw Error('Fonte criptográfica indisponível.');
 const range=4294967296,limit=range-range%max,v=new Uint32Array(1);
 do{crypto.getRandomValues(v);}while(v[0]>=limit);
 return v[0]%max;
}
function setStatus(message,error=false){
 el('status').textContent=message;el('status').classList.toggle('error',error);
}
function formatDate(iso){return String(iso).split('-').reverse().join('/');}
function meter(id,value,min,max,label){
 const ratio=Math.max(0,Math.min(1,(value-min)/(max-min)));
 const angle=Math.PI*(1-ratio),x=120+96*Math.cos(angle),y=112-96*Math.sin(angle);
 el('gauge'+id).hidden=false;
 el('gauge'+id+'-progress').setAttribute('d',
   'M 24 112 A 96 96 0 0 1 '+x.toFixed(2)+' '+y.toFixed(2));
 el('gauge'+id+'-needle').setAttribute('transform',
   'rotate('+(-90+180*ratio).toFixed(2)+' 120 112)');
 el('gauge'+id+'-value').textContent=label;
}
function ballLine(key,star){
 const line=document.createElement('div');line.className='ball-line';
 for(const number of key){
   const ball=document.createElement('span');
   ball.className='ball'+(star?' star':'');
   ball.textContent=String(number).padStart(2,'0');
   line.append(ball);
 }
 return line;
}
function drawBatch(method){
 const area=el('key'+method+'-list');area.replaceChildren();
 const keys=batches[method-1];
 if(!keys.length){
   const empty=document.createElement('p');empty.className='placeholder';
   empty.textContent='Escolhe a quantidade e carrega em gerar.';area.append(empty);return;
 }
 keys.forEach((key,index)=>{
   const ticket=document.createElement('div');ticket.className='bet-entry';
   const title=document.createElement('strong');title.className='bet-title';
   title.textContent='APOSTA '+String(index+1).padStart(2,'0');
   ticket.append(title,ballLine(key.numbers,false),ballLine(key.stars,true));
   if(method===2){
     const note=document.createElement('small');note.className='bet-study';
     const item=studies[index];
     note.textContent='Índice Crowd '+fmt(item.relative_index)+
       ' · '+item.dates+' números de calendário';
     ticket.append(note);
   }
   area.append(ticket);
 });
}
function ranking(){
 const panel=el('ranking-body');panel.replaceChildren();
 if(!activeSelection)return;
 const t=document.createElement('table');t.className='ranking-table';
 const head=document.createElement('thead'),r=document.createElement('tr');
 for(const h of ['Modelo','Pontuação','Números','Estrelas']){
   const cell=document.createElement('th');cell.textContent=h;r.append(cell);
 }
 head.append(r);t.append(head);
 const body=document.createElement('tbody');
 for(const item of activeSelection.rankings){
   const row=document.createElement('tr');
   if(item.mode===activeSelection.selected)row.className='ranking-selected';
   for(const v of [item.label,fmt(item.score),fmt(item.number_hits_per_draw),fmt(item.star_hits_per_draw)]){
     const cell=document.createElement('td');cell.textContent=v;row.append(cell);
   }
   body.append(row);
 }
 t.append(body);panel.append(t);
 el('ranking-period').textContent='De '+formatDate(activeSelection.eval_from)+
   ' a '+formatDate(activeSelection.eval_until)+' · '+activeSelection.draws_evaluated+
   ' concursos × '+activeSelection.seeds+' sementes.';
}
function draw(){
 drawBatch(1);drawBatch(2);
 const n1=batches[0].length,n2=batches[1].length;
 const count=n1+n2;
 el('odds-total').textContent=count?('Total: '+count+' apostas distintas · chance conjunta de jackpot: '+count+' em 139 838 160 (aprox. '+fmt(count/139838160*100,9)+'%).'):'Total: 0 apostas geradas.';
 el('copy-1').disabled=!n1;el('copy-2').disabled=!n2;
 el('copy-both').disabled=!(n1||n2);
 if(activeSelection){
   el('method-one-title').textContent=EuroSeletor.LABELS[activeSelection.selected];
   el('model1-info').textContent='Melhor resultado entre 5 métodos · até '+
     formatDate(activeSelection.history_end)+'.';
   el('model1-signal').textContent='Média histórica '+fmt(activeSelection.selected_score)+
     ' · referência aleatória '+fmt(activeSelection.baseline_score)+
     ' · expectativa matemática '+fmt(activeSelection.expected_score)+
     '. Não demonstra vantagem futura.';
   if(n1)meter(1,activeSelection.selected_score,0,1.5,fmt(activeSelection.selected_score)+' acertos');
 }
 el('gauge1').hidden=!n1;
 if(activeModel&&n2){
   const avg=studies.reduce((a,b)=>a+b.relative_index,0)/studies.length;
   meter(2,avg,0.85,1.15,fmt(avg)+' índice médio');
   el('model2-info').textContent='Crowd Intelligence v1.4 · '+n2+' apostas · média dos índices.';
   el('model2-signal').textContent='Média dos índices de relação agregada de vencedores. '+
     'O índice de cada aposta aparece na respetiva linha. Não mede probabilidade de ganhar ou de dividir prémios.';
 }else{
   el('model2-info').textContent=activeModel?'Crowd Intelligence pronto · sem apostas.':'A carregar o modelo Crowd…';
   el('model2-signal').textContent='O índice experimental aparece quando geras apostas do Método 2.';
 }
 el('gauge2').hidden=!n2;
 el('saved-info').textContent='Apostas guardadas neste navegador. '+
   'Podes voltar a gerar um método sem modificar as apostas do outro.';
 ranking();
}
function save(){
 try{
   localStorage.setItem(STORAGE_KEY,JSON.stringify({
     version:5,batches,studies,history_end:activeSelection.history_end,
     selection_method:activeSelection.selected,selected_score:activeSelection.selected_score,
     calibration_end:activeModel.calibration_end,coefficient:activeModel.coefficients.calendar_number
   }));
 }catch(e){el('saved-info').textContent='Não foi possível guardar: copia as apostas antes de sair.';}
}
function restore(){
 try{
   const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return false;
   const s=JSON.parse(raw);
   if(s.version!==5||s.history_end!==activeSelection.history_end||
      s.selection_method!==activeSelection.selected||s.selected_score!==activeSelection.selected_score||
      s.calibration_end!==activeModel.calibration_end||s.coefficient!==activeModel.coefficients.calendar_number||
      !Array.isArray(s.batches)||s.batches.length!==2||
      !EuroDuasChaves.validBatch(s.batches[0])||!EuroDuasChaves.validBatch(s.batches[1])||
      !Array.isArray(s.studies)||s.studies.length!==s.batches[1].length)return false;
   const all=s.batches.flat();
   if(new Set(all.map(EuroDuasChaves.fingerprint)).size!==all.length)return false;
   for(let i=0;i<s.studies.length;i++){
     const key=s.batches[1][i],study=s.studies[i];
     const dates=key.numbers.filter(v=>v<=31).length;
     const observations=Number(activeModel.coverage_by_calendar_numbers[String(dates)]);
     if(!study||study.model!=='crowd-calendar-v14'||study.dates!==dates||
       observations<80||study.observations!==observations||
       Math.abs(study.relative_index-EuroDuasChaves.crowdIndex(key.numbers,activeModel))>1e-10)
       return false;
   }
   if(s.batches[0].length===1&&s.batches[1].length===1&&
      !EuroDuasChaves.disjoint(s.batches[0][0],s.batches[1][0]))return false;
   batches=s.batches;studies=s.studies;
   el('count-1').value=String(batches[0].length||1);
   el('count-2').value=String(batches[1].length||1);
   return true;
 }catch(e){return false;}
}
function count(method){
 const val=Number(el('count-'+method).value);
 if(!Number.isInteger(val)||val<1||val>5)throw Error('Escolhe entre 1 e 5 apostas.');
 return val;
}
function generate(method){
 if(!activeData||!activeModel||!activeSelection){
   setStatus('Primeiro é necessário carregar os estudos.',true);return;
 }
 try{
   const make=m=>EuroDuasChaves.generateBatch(m,count(m),activeData,activeModel,
     activeSelection,randIndex,m===1?batches[1]:batches[0]);
   if(method===3){
     // Geração conjunta: as duas seleções são independentes; evitar duplicados completos.
     const a=EuroDuasChaves.generateBatch(1,count(1),activeData,activeModel,
       activeSelection,randIndex,[]);
     const b=EuroDuasChaves.generateBatch(2,count(2),activeData,activeModel,
       activeSelection,randIndex,a.keys);
     batches=[a.keys,b.keys];studies=b.studies;
   }else{
     const result=make(method);
     batches[method-1]=result.keys;
     if(method===2)studies=result.studies;
   }
   draw();save();
   const n=method===3?batches[0].length+batches[1].length:batches[method-1].length;
   setStatus(n+' aposta(s) gerada(s) com os métodos estatísticos. Nenhuma combinação completa se repete.');
 }catch(e){setStatus('Não foi possível gerar: '+e.message,true);}
}
async function clipboard(text){
 if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);
 const box=document.createElement('textarea');box.value=text;box.style.position='fixed';
 box.style.left='-200vw';document.body.append(box);box.select();
 try{if(!document.execCommand('copy'))throw Error('Cópia indisponível.');}
 finally{box.remove();}
}
async function copy(which){
 const selected=which===3?[...batches[0],...batches[1]]:batches[which-1];
 if(!selected.length)return;
 const text=(which===3?'EUROLAB · TODAS AS APOSTAS\n':'EUROLAB · MÉTODO '+which+'\n')+
    (which===3?[
       ...batches[0].map((k,i)=>'Método 1 · Aposta '+(i+1)+': '+EuroDuasChaves.format(k)),
       ...batches[1].map((k,i)=>'Método 2 · Aposta '+(i+1)+': '+EuroDuasChaves.format(k))
    ]:selected.map((k,i)=>'Aposta '+(i+1)+': '+EuroDuasChaves.format(k))).join('\n');
 try{await clipboard(text);setStatus('Apostas copiadas.');}
 catch(e){setStatus('Não foi possível copiar automaticamente.',true);}
}
async function loadJson(path){
 const res=await fetch(path,{cache:'no-store'});
 if(!res.ok)throw Error('Falha ao carregar '+path+': HTTP '+res.status);
 return res.json();
}
async function init(){
 for(const id of ['generate','generate-1','generate-2','copy-1','copy-2','copy-both','count-1','count-2'])
   el(id).disabled=true;
 setStatus('A carregar histórico, seleção walk-forward e Crowd Intelligence…');
 try{
   const [data,model]=await Promise.all([
     loadJson('data/dados-validados.json'),loadJson('data/modelo-popularidade-v14.json')]);
   if(!Array.isArray(data.draws)||model.id!=='eurolab-crowd-calendar-v1'||model.version!=='1.4.0')
      throw Error('Histórico ou modelo inválido.');
   EuroDuasChaves.cleanHistory(data);
   const selection=EuroSeletor.evaluate(data,EuroDuasChaves.generateMode);
   activeData=data;activeModel=model;activeSelection=selection;
   for(const id of ['generate','generate-1','generate-2','count-1','count-2'])el(id).disabled=false;
   const recovered=restore();draw();
   setStatus(recovered?'Apostas recuperadas; escolhe quantas queres voltar a gerar.':
      'Estudos carregados. Escolhe entre 1 e 5 apostas em cada método.');
 }catch(e){
   activeData=null;activeModel=null;activeSelection=null;
   setStatus('Os modelos não estão disponíveis: '+e.message,true);
 }
}
el('generate-1').addEventListener('click',()=>generate(1));
el('generate-2').addEventListener('click',()=>generate(2));
el('generate').addEventListener('click',()=>generate(3));
el('copy-1').addEventListener('click',()=>copy(1));
el('copy-2').addEventListener('click',()=>copy(2));
el('copy-both').addEventListener('click',()=>copy(3));
init();
