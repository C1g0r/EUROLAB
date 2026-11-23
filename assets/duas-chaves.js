/* EUROLAB v1.8 — geração individual com manómetros de estudos não preditivos. */
'use strict';
const STORAGE_KEY='eurolab-v18-chaves-individuais';
let first=null,second=null,secondStudy=null,activeData=null,activeModel=null,activeSelection=null;
const el=id=>document.getElementById(id);
const validKey=x=>EuroDuasChaves.validKey(x);
function randIndex(max){
 if(!Number.isSafeInteger(max)||max<1||max>4294967296)throw Error('Limite aleatório inválido.');
 if(!globalThis.crypto?.getRandomValues)throw Error('Aleatoriedade criptográfica indisponível.');
 const range=4294967296,lim=range-range%max,buf=new Uint32Array(1);
 do{crypto.getRandomValues(buf);}while(buf[0]>=lim);
 return buf[0]%max;
}
function status(message,error=false){
 el('status').textContent=message;el('status').classList.toggle('error',error);
}
function formatDate(iso){return String(iso).split('-').reverse().join('/');}
function fmt(v,d=4){return Number(v).toFixed(d).replace('.',',');}
function balls(id,values,star){
 const target=el(id);target.replaceChildren();
 if(!values){
   const label=document.createElement('span');label.className='placeholder';
   label.textContent='Por gerar';target.append(label);return;
 }
 for(const n of values){const item=document.createElement('span');item.className='ball'+(star?' star':'');
   item.textContent=String(n).padStart(2,'0');target.append(item);}
}
function meter(id,value,min,max,label){
 const gauge=el('gauge'+id);
 const ratio=Math.max(0,Math.min(1,(value-min)/(max-min)));
 const angle=Math.PI*(1-ratio),x=120+96*Math.cos(angle),y=112-96*Math.sin(angle);
 const point=[x,y].map(n=>n.toFixed(2));
 gauge.hidden=false;
 el('gauge'+id+'-progress').setAttribute('d',
   'M 24 112 A 96 96 0 0 1 '+point[0]+' '+point[1]);
 el('gauge'+id+'-needle').setAttribute('transform',
   'rotate('+(-90+ratio*180).toFixed(2)+' 120 112)');
 el('gauge'+id+'-value').textContent=label;
}
function ranking(){
 const place=el('ranking-body');place.replaceChildren();
 if(!activeSelection)return;
 const table=document.createElement('table');table.className='ranking-table';
 const head=document.createElement('thead'),tr=document.createElement('tr');
 for(const title of ['Modelo','Pontuação','Números','Estrelas']){
   const th=document.createElement('th');th.textContent=title;tr.append(th);
 }
 head.append(tr);table.append(head);
 const body=document.createElement('tbody');
 for(const item of activeSelection.rankings){
   const line=document.createElement('tr');
   if(item.mode===activeSelection.selected)line.className='ranking-selected';
   for(const text of [item.label,fmt(item.score),fmt(item.number_hits_per_draw),fmt(item.star_hits_per_draw)]){
      const td=document.createElement('td');td.textContent=text;line.append(td);
   }
   body.append(line);
 }
 table.append(body);place.append(table);
 el('ranking-period').textContent='De '+formatDate(activeSelection.eval_from)+
   ' a '+formatDate(activeSelection.eval_until)+' · '+activeSelection.draws_evaluated+
   ' concursos × '+activeSelection.seeds+' sementes; acertos ponderados por chave.';
}
function render(){
 balls('key1-numbers',first?.numbers,false);balls('key1-stars',first?.stars,true);
 balls('key2-numbers',second?.numbers,false);balls('key2-stars',second?.stars,true);
 el('copy-1').disabled=!first;el('copy-2').disabled=!second;el('copy-both').disabled=!(first&&second);
 if(activeSelection){
   el('method-one-title').textContent=EuroSeletor.LABELS[activeSelection.selected];
   el('model1-info').textContent='Selecionado entre 5 métodos · '+activeSelection.draws_evaluated+
     ' concursos · até '+formatDate(activeSelection.history_end)+'.';
   el('model1-signal').textContent='Média histórica '+fmt(activeSelection.selected_score)+
     ' · aleatório '+fmt(activeSelection.baseline_score)+
     ' · expectativa teórica '+fmt(activeSelection.expected_score)+
     '. O melhor histórico pode não ser melhor no próximo sorteio.';
   if(first)meter(1,activeSelection.selected_score,0,1.5,fmt(activeSelection.selected_score)+' acertos');
 }
 el('gauge1').hidden=!first;
 if(activeModel&&second&&secondStudy){
   const delta=(secondStudy.relative_index-1)*100;
   el('model2-info').textContent='Crowd v1.4 · '+secondStudy.dates+
     ' números de 1–31 · '+secondStudy.observations+' observações.';
   el('model2-signal').textContent='Índice relativo '+(delta>=0?'+':'')+fmt(delta,1)+
     '% face ao grupo com três números de calendário. Não é probabilidade de partilha.';
   meter(2,secondStudy.relative_index,0.85,1.15,fmt(secondStudy.relative_index,4)+' índice');
 }else{
   el('model2-info').textContent=activeModel?'Modelo Crowd carregado · por gerar.':'A carregar o modelo Crowd…';
   el('model2-signal').textContent='O indicador é experimental e só aparecerá depois de gerar a Chave 2.';
 }
 el('gauge2').hidden=!second;
 ranking();
}
function save(){
 try{
   localStorage.setItem(STORAGE_KEY,JSON.stringify({
     version:4,first,second,secondStudy,
     history_end:activeSelection.history_end,
     selection_method:activeSelection.selected,
     selected_score:activeSelection.selected_score,
     calibration_end:activeModel.calibration_end,
     coefficient:activeModel.coefficients.calendar_number,
     updated_at:new Date().toISOString()
   }));
   el('saved-info').textContent='Chaves guardadas neste navegador; podes gerar novamente cada uma sem alterar a outra.';
 }catch(e){el('saved-info').textContent='Não foi possível guardar neste navegador; copia as chaves.';}
}
function restore(){
 try{
   const raw=localStorage.getItem(STORAGE_KEY);
   if(!raw)return false;
   const obj=JSON.parse(raw);
   if(obj.version!==4||obj.history_end!==activeSelection.history_end||
     obj.selection_method!==activeSelection.selected||
     obj.selected_score!==activeSelection.selected_score||
     obj.calibration_end!==activeModel.calibration_end||
     obj.coefficient!==activeModel.coefficients.calendar_number)return false;
   if(obj.first!==null&&!validKey(obj.first))return false;
   if(obj.second!==null&&!validKey(obj.second))return false;
   if(obj.second!==null){
     const d=obj.second.numbers.filter(n=>n<=31).length,observ=Number(activeModel.coverage_by_calendar_numbers[String(d)]);
     const ratio=EuroDuasChaves.crowdIndex(obj.second.numbers,activeModel);
     if(!obj.secondStudy||obj.secondStudy.model!=='crowd-calendar-v14'||
       obj.secondStudy.dates!==d||obj.secondStudy.observations!==observ||
       Math.abs(obj.secondStudy.relative_index-ratio)>1e-10||
       observ<EuroDuasChaves.CROWD_MIN_OBSERVATIONS)return false;
   }
   if(obj.first&&obj.second&&!EuroDuasChaves.disjoint(obj.first,obj.second))return false;
   first=obj.first;second=obj.second;secondStudy=obj.secondStudy;
   return true;
 }catch(e){return false;}
}
function generateOne(which){
 if(!activeData||!activeModel||!activeSelection){status('Os estudos ainda não estão disponíveis.',true);return;}
 try{
   if(which===1){
     const value=EuroDuasChaves.generateFirst(activeData,randIndex,activeSelection,second);
     first=value;
   }else if(which===2){
     const result=EuroDuasChaves.generateSecond(activeModel,randIndex,first);
     second=result.key;secondStudy=result.study;
   }else{
     const candidate=EuroDuasChaves.generateFirst(activeData,randIndex,activeSelection);
     const result=EuroDuasChaves.generateSecond(activeModel,randIndex,candidate);
     first=candidate;second=result.key;secondStudy=result.study;
   }
   render();save();
   status(which===1?'Chave 1 atualizada; Chave 2 preservada.':
     which===2?'Chave 2 atualizada; Chave 1 preservada.':'Duas chaves geradas através dos modelos.');
 }catch(e){status('Não foi possível gerar: '+e.message,true);}
}
async function clipboard(text){
 if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);
 const temp=document.createElement('textarea');temp.value=text;temp.style.position='fixed';temp.style.left='-200vw';
 document.body.append(temp);temp.select();
 try{if(!document.execCommand('copy'))throw Error('Cópia indisponível.');}
 finally{temp.remove();}
}
async function copy(which){
 const part=which===1?first:which===2?second:null;
 if(which!==3&&!part||which===3&&(!first||!second))return;
 const label=EuroSeletor.LABELS[activeSelection.selected];
 const text=which===1?'EUROLAB · Chave 1 — '+label+'\n'+EuroDuasChaves.format(first):
  which===2?'EUROLAB · Chave 2 — Crowd Intelligence\n'+EuroDuasChaves.format(second):
  'EUROLAB · DUAS CHAVES\n1 · '+label+': '+EuroDuasChaves.format(first)+
  '\n2 · Crowd Intelligence: '+EuroDuasChaves.format(second);
 try{await clipboard(text);status('Chave(s) copiadas.');}
 catch(e){status('Falha ao copiar automaticamente.',true);}
}
async function loadJson(path){
 const r=await fetch(path,{cache:'no-store'});
 if(!r.ok)throw Error(path+': HTTP '+r.status);
 return r.json();
}
async function init(){
 ['generate','generate-1','generate-2','copy-1','copy-2','copy-both'].forEach(id=>el(id).disabled=true);
 status('A carregar o histórico, selecionar o melhor modelo e preparar Crowd Intelligence…');
 try{
   const [data,model]=await Promise.all([loadJson('data/dados-validados.json'),loadJson('data/modelo-popularidade-v14.json')]);
   if(!Array.isArray(data.draws)||model?.id!=='eurolab-crowd-calendar-v1'||model.version!=='1.4.0')
      throw Error('Dados ou calibração incompatíveis.');
   EuroDuasChaves.cleanHistory(data);
   const selection=EuroSeletor.evaluate(data,EuroDuasChaves.generateMode);
   activeData=data;activeModel=model;activeSelection=selection;
   ['generate','generate-1','generate-2'].forEach(id=>el(id).disabled=false);
   const restored=restore();render();
   status(restored?'Chaves anteriores recuperadas; podes gerar cada uma separadamente.':
     'Estudos carregados. Escolhe qual das chaves queres gerar primeiro.');
 }catch(e){
   activeData=null;activeModel=null;activeSelection=null;
   status('Não foi possível carregar os estudos: '+e.message,true);
 }
}
el('generate-1').addEventListener('click',()=>generateOne(1));
el('generate-2').addEventListener('click',()=>generateOne(2));
el('generate').addEventListener('click',()=>generateOne(3));
el('copy-1').addEventListener('click',()=>copy(1));
el('copy-2').addEventListener('click',()=>copy(2));
el('copy-both').addEventListener('click',()=>copy(3));
init();
