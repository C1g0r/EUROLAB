/* EUROLAB v1.5 — duas chaves distintas. Sem previsão estatística. */
(function (root, factory) {
  'use strict';
  const api = factory();
  root.EuroDuasChaves = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAIN = Array.from({length:50}, (_,i)=>i+1);
  const STARS = Array.from({length:12}, (_,i)=>i+1);
  const isValidSet = (values, count, max) =>
    Array.isArray(values) && values.length === count &&
    values.every(v=>Number.isInteger(v) && v>=1 && v<=max) &&
    new Set(values).size === count;

  function pick(pool, count, randomIndex) {
    if(!Array.isArray(pool)||!Number.isInteger(count)||count<0||count>pool.length){
      throw Error('Universo de geração inválido.');
    }
    const values=pool.slice(), chosen=[];
    for(let i=0;i<count;i++){
      const index=randomIndex(values.length);
      if(!Number.isInteger(index)||index<0||index>=values.length){
        throw Error('Fonte de aleatoriedade inválida.');
      }
      chosen.push(values.splice(index,1)[0]);
    }
    return chosen.sort((a,b)=>a-b);
  }
  function validate(pair) {
    if(!pair||!pair.first||!pair.second) return false;
    const a=pair.first,b=pair.second;
    if(!isValidSet(a.numbers,5,50)||!isValidSet(b.numbers,5,50)||
       !isValidSet(a.stars,2,12)||!isValidSet(b.stars,2,12))return false;
    if(b.numbers.filter(v=>v<=31).length!==2||b.numbers.filter(v=>v>31).length!==3)return false;
    if(a.numbers.some(v=>b.numbers.includes(v))||a.stars.some(v=>b.stars.includes(v)))return false;
    return true;
  }
  function generate(randomIndex) {
    if(typeof randomIndex!=='function')throw Error('Fonte de aleatoriedade em falta.');
    const first={numbers:pick(MAIN,5,randomIndex),stars:pick(STARS,2,randomIndex)};
    const used=new Set(first.numbers);
    const lower=MAIN.filter(v=>v<=31&&!used.has(v));
    const upper=MAIN.filter(v=>v>31&&!used.has(v));
    const second={
      numbers:pick(lower,2,randomIndex).concat(pick(upper,3,randomIndex)).sort((a,b)=>a-b),
      stars:pick(STARS.filter(v=>!first.stars.includes(v)),2,randomIndex)
    };
    const result={first,second};
    if(!validate(result))throw Error('A validação interna das duas chaves falhou.');
    return result;
  }
  function format(key) {
    return key.numbers.map(n=>String(n).padStart(2,'0')).join(' · ')+
      '   +   '+key.stars.map(n=>String(n).padStart(2,'0')).join(' · ');
  }
  return {generate,validate,format};
});
