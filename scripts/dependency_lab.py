#!/usr/bin/env python3
"""Reproduz analise-dependencias-v07.json; numpy necessario."""
from pathlib import Path
import json, math, datetime
import numpy as np
DEST=Path(__file__).resolve().parents[1]
# All tests at v0.7 are explicit, exploratory, with strict 10-test correction.
rng=np.random.default_rng(20261120)
rows=sorted(json.loads((DEST/'data/dados-validados.json').read_text())['draws'],key=lambda d:d['date'])
assert len(rows)==1999
regimes=[('2004–2011','2004-02-13','2011-05-09',9),('2011–2016','2011-05-10','2016-09-26',11),('2016–2026','2016-09-27','2026-11-20',12)]

def p_dist(pop,draw):
    c=math.comb(pop,draw)
    return [math.comb(draw,k)*math.comb(pop-draw,draw-k)/c for k in range(draw+1)]

def dist_stat(counts,expect):
    return float(sum((x-y)**2/y for x,y in zip(counts,expect) if y>0))

def cdf_pmc_multinomial(counts,prob,B=50000):
    obs=dist_stat(counts,np.array(prob)*sum(counts))
    sims=rng.multinomial(sum(counts),prob,size=B)
    ex=np.array(prob)*sum(counts)
    stat=((sims-ex)**2/ex).sum(axis=1)
    return obs,(1+int(np.count_nonzero(stat>=obs-1e-12)))/(B+1),B

def mat(seq,key,univ):
    m=np.zeros((len(seq),univ),dtype=np.int8)
    for i,d in enumerate(seq):m[i,np.array(d[key],dtype=int)-1]=1
    return m

def chi2_group(x,weights,group_n):
    # hypergeometric-permutation label-exchangeable statistic; preserve each draw as whole
    totals=x.sum(axis=0).astype(float)
    a=weights
    n=len(x)
    expected=totals*group_n/n
    complement=totals-expected
    b=totals-a
    keep=(expected>0)&(complement>0)
    return float(np.sum((a[keep]-expected[keep])**2/expected[keep]+(b[keep]-complement[keep])**2/complement[keep]))

tests=[]
overlap=[]
weekdays=[]
for title,start,end,m in regimes:
    ds=[d for d in rows if start<=d['date']<=end]
    assert ds
    for var,N,choose,label in [('numbers',50,5,'Números'),('stars',m,2,'Estrelas')]:
        # Each set in consecutive draws is independent under the fair-draw null.
        vals=[len(set(ds[i-1][var])&set(ds[i][var])) for i in range(1,len(ds))]
        # Three bins: 0,1,2+ (main numbers) / 0,1,2 (stars).
        counts=([vals.count(0),vals.count(1),sum(v>=2 for v in vals)] if choose==5 else [vals.count(k) for k in range(3)])
        full=p_dist(N,choose)
        probs=[full[0],full[1],sum(full[2:])]
        expected=[len(vals)*p for p in probs]
        stat,p,B=cdf_pmc_multinomial(counts,probs)
        record={'id':f'overlap-{start}-{var}','family':'10 testes exploratórios v0.7','type':'sobreposicao','period':title,'variable':label,'n_pairs':len(vals),'star_pool':m,'bins':(['0','1','2 ou mais'] if choose==5 else ['0','1','2']),'observed':counts,'expected':[round(x,3) for x in expected], 'probabilities':[round(x,8) for x in probs], 'chi2_stat':round(stat,5),'mc_p':p,'replications':B,'simulation':'Multinomial calibrada com probabilidades hipergeométricas exatas'}
        overlap.append(record);tests.append(record)
    # Weekday test in regimes where both days are present; shuffle complete draws.
    if start<'2011-05-10':continue
    days=[datetime.date.fromisoformat(d['date']).weekday() for d in ds]
    assert set(days)=={1,4},set(days)
    i_tue=np.flatnonzero(np.array(days)==1);n_tue=len(i_tue)
    for var,pool,label in [('numbers',50,'Números'),('stars',m,'Estrelas')]:
        x=mat(ds,var,pool)
        obs=chi2_group(x,x[i_tue].sum(axis=0),n_tue)
        B=6000; exceed=0
        for _ in range(B):
            ix=rng.choice(len(ds),size=n_tue,replace=False)
            sim=chi2_group(x,x[ix].sum(axis=0),n_tue)
            if sim>=obs-1e-12:exceed+=1
        p=(exceed+1)/(B+1)
        d={'id':f'weekday-{start}-{var}','family':'10 testes exploratórios v0.7','type':'dia_semana','period':title,'variable':label,'tuesdays':n_tue,'fridays':len(ds)-n_tue,'chi2_stat':round(obs,5),'mc_p':p,'replications':B,'simulation':'Permutação das etiquetas Ter/Sex preservando sorteios completos e quantidades observadas'}
        weekdays.append(d);tests.append(d)
assert len(tests)==10
ordering=sorted(tests,key=lambda r:r['mc_p'])
maxadj=0
for pos,r in enumerate(ordering):
    raw=min(1,(len(tests)-pos)*r['mc_p'])
    maxadj=max(maxadj,raw)
    r['holm_p']=maxadj
    r['holm_significant_5pct']=maxadj<.05
report={
 'version':'0.7.0','cutoff':'2026-11-20','draws':len(rows),'draws_through':rows[-1]['date'],
 'source':'6 ZIP entregues pelo utilizador; origem declarada FDJ; validação estrutural, proveniência externa ainda não certificada',
 'methodology':{
  'overlap':'Em cada regime histórico, contar números repetidos entre sorteios adjacentes; não comparar transições que mudam o universo de estrelas. Probabilidade teórica de k elementos partilhados por dois subconjuntos independentes: C(r,k)*C(N-r,r-k)/C(N,r). Para números, agrupar em 0, 1, >=2; estrelas: 0,1,2.',
  'overlap_calibration':'Valor-p de Pearson calibrado por simulação multinomial de 50 000 réplicas. Dentro de um regime, a distribuição de sobreposição entre sorteios sucessivos é constante e as contagens de sobreposição são independentes sob a hipótese nula de sorteios iid uniformes.',
  'weekday':'Apenas nos dois regimes com Terça e Sexta. Permutar etiquetas de dia da semana entre sorteios INTEIROS; mantém a dependência sem reposição dos números de cada extração e os totais por dia.',
  'multiple_testing':'Dez hipóteses desta versão (6 de sobreposição + 4 de dia da semana), corrigidas conjuntamente por Holm-Bonferroni. Não engloba exploração anterior: interpretações continuam exploratórias.',
  'random_seed':20261120,'p_estimator':'(excedências+1)/(replicações+1)',
  'scope_warning':'Diferenças por dia da semana não comprovam alterações ambientais, problemas das bolas, interferência ou vantagem de previsão. Rastreabilidade física por sorteio está ausente.'},
 'eras':[{'name':title,'n':sum(start<=x['date']<=end for x in rows),'from':start,'to':end,'stars':m} for title,start,end,m in regimes],
 'overlap_tests':overlap,'weekday_tests':weekdays,
 'summary':{'min_raw_p':min(t['mc_p'] for t in tests),'min_adjusted_p':min(t['holm_p'] for t in tests),'holm_significant_count':sum(t['holm_significant_5pct'] for t in tests),
 'interpretation':'Os testes com correção Holm devem ser interpretados como exploração, não diagnóstico de manipulação nem previsão.'},
 'source_verification':{'zip_user_hashes_in':'data/relatorio-validacao.json','original_fdj_downloads_independent_match':False,'individual_machine_or_ball_serial_links':0,'video_order_transcripts_verified_in_package':0}
}
(DEST/'data/analise-dependencias-v07.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')

