#!/usr/bin/env python3
"""EUROLAB v0.6 — comparações temporais e teste retrospetivo.
Requer: numpy (pip install numpy). Descritivo/exploratório, não preditivo.
Usar: python3 scripts/temporal_lab.py
"""
import json
from pathlib import Path
from datetime import date
import math
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
IN=ROOT/'data/dados-validados.json'
OUT=ROOT/'data/analise-temporal-v06.json'
SEED=20261120
RNG=np.random.default_rng(SEED)
B=4000
B_BACK=12000
WINDOW=100

raw=json.loads(IN.read_text(encoding='utf8'))
draws=sorted(raw['draws'], key=lambda d:d['date'])
assert len(draws)==1999

def era(d):
    if d<'2011-05-10': return '2004-2011',9
    if d<'2016-09-27': return '2011-2016',11
    return '2016-2026',12

def row_matrix(items, key, total):
    a=np.zeros((len(items),total), dtype=np.int16)
    for i,d in enumerate(items): a[i, np.array(d[key])-1]=1
    return a

def chi2_2xk(a, totals, n1, n2):
    expa=totals*(n1/(n1+n2))
    expb=totals*(n2/(n1+n2))
    keep=totals>0
    b=totals-a
    return float((((a[keep]-expa[keep])**2/expa[keep])+((b[keep]-expb[keep])**2/expb[keep])).sum())

def mc_split(M):
    n=len(M);h=n//2
    totals=M.sum(axis=0)
    obs=chi2_2xk(M[:h].sum(axis=0),totals,h,n-h)
    hits=0
    for _ in range(B):
        idx=RNG.permutation(n)[:h]
        t=chi2_2xk(M[idx].sum(axis=0),totals,h,n-h)
        if t>=obs-1.e-10: hits+=1
    return {'statistic':round(obs,6),'mc_p':(hits+1)/(B+1),'replications':B,'seed':SEED,'n_early':h,'n_late':n-h}

results=[]; groups=[]
for eid,m in [('2004-2011',9),('2011-2016',11),('2016-2026',12)]:
    seq=[d for d in draws if era(d['date'])[0]==eid]
    mid=len(seq)//2
    groups.append({'period':eid,'n':len(seq),'stars_range':m,'first':seq[0]['date'],'last':seq[-1]['date'],'end_first_half':seq[mid-1]['date'],'start_second_half':seq[mid]['date']})
    for key, total, label in [('numbers',50,'principais'),('stars',m,'estrelas')]:
        mtx=row_matrix(seq,key,total)
        r=mc_split(mtx)
        results.append({'period':eid,'variable':label,'universe':total,**r})

# ajuste Holm para família fechada de 6 testes exploratórios (divisão 50/50 por época)
ordered=sorted(range(len(results)),key=lambda i:results[i]['mc_p'])
maxp=0
for rank,i in enumerate(ordered):
    adj=min(1.,(len(results)-rank)*results[i]['mc_p'])
    maxp=max(maxp,adj)
    results[i]['holm_p']=maxp

# Backtest walk-forward de regra fixada neste relatório: últimos 100 concursos MESMO regime,
# top 5 números e top 2 estrelas (empate = número menor); nenhuma informação futura.
records=[]
for eid,m in [('2004-2011',9),('2011-2016',11),('2016-2026',12)]:
    seq=[d for d in draws if era(d['date'])[0]==eid]
    for i in range(WINDOW,len(seq)):
        prev=seq[i-WINDOW:i]; cur=seq[i]
        cntN=np.bincount([v for d in prev for v in d['numbers']], minlength=51)
        cntS=np.bincount([v for d in prev for v in d['stars']], minlength=m+1)
        hotN=sorted(range(1,51),key=lambda k:(-cntN[k],k))[:5]
        hotS=sorted(range(1,m+1),key=lambda k:(-cntS[k],k))[:2]
        rec={'date':cur['date'],'era':eid,'stars_pool':m,
             'predicted_numbers':hotN,'predicted_stars':hotS,
             'actual_numbers':cur['numbers'],'actual_stars':cur['stars'],
             'hits_numbers':len(set(hotN)&set(cur['numbers'])),
             'hits_stars':len(set(hotS)&set(cur['stars']))}
        records.append(rec)

# Probability-matched independent simulations of future outcomes under null.
# Any predictable strategy choosing five distinct numbers has HG(50,5,5) per future draw.
# Star distribution HG(pool,2,2), conditioned on date's pool.
num_obs=sum(r['hits_numbers'] for r in records)
star_obs=sum(r['hits_stars'] for r in records)
num_expected=.5*len(records)
star_expected=sum(4/r['stars_pool'] for r in records)
nullN=np.zeros(B_BACK,dtype=np.int32);nullS=np.zeros(B_BACK,dtype=np.int32)
for e,m in [('2004-2011',9),('2011-2016',11),('2016-2026',12)]:
    count=sum(r['era']==e for r in records)
    if not count: continue
    # vectorized in smaller blocks, max 12k x 1059, memory reasonable
    for j in range(0,count,50):
        n=min(50,count-j)
        nullN+=RNG.hypergeometric(5,45,5,size=(B_BACK,n)).sum(axis=1)
        nullS+=RNG.hypergeometric(2,m-2,2,size=(B_BACK,n)).sum(axis=1)

def p2(obs,sims,exp):
    return (1+int(np.count_nonzero(np.abs(sims-exp)>=abs(obs-exp)-1.e-8)))/(len(sims)+1)

backtest={
    'rule':'Em cada sorteio, escolher os 5 números e 2 estrelas mais frequentes nos 100 sorteios imediatamente anteriores DENTRO do mesmo regime. Empates: números menores.',
    'lookback_draws':WINDOW,'evaluated_draws':len(records),'first_evaluated':records[0]['date'],'last_evaluated':records[-1]['date'],
    'total_number_hits':num_obs,'expected_number_hits':num_expected,'mean_number_hits':num_obs/len(records),'expected_mean_number_hits':.5,
    'total_star_hits':star_obs,'expected_star_hits':round(star_expected,5),'mean_star_hits':star_obs/len(records),
    'expected_mean_star_hits':star_expected/len(records),
    'null_p_two_sided_numbers':p2(num_obs,nullN,num_expected),'null_p_two_sided_stars':p2(star_obs,nullS,star_expected),
    'null_simulations':B_BACK,'null_simulations_seed':SEED,
    'warning':'A escolha do método após observar o histórico é exploratória. Comparações com o acaso não demonstram previsibilidade. Para confirmação, bloquear o algoritmo e avaliar apenas sorteios FUTUROS ainda não conhecidos.',
    'sample':records[-5:],
    'by_era':[]
}
for eid,m in [('2004-2011',9),('2011-2016',11),('2016-2026',12)]:
    sub=[r for r in records if r['era']==eid]
    backtest['by_era'].append({'era':eid,'n':len(sub),'mean_number_hits':sum(r['hits_numbers'] for r in sub)/len(sub),'expected_number_hits':.5,'mean_star_hits':sum(r['hits_stars'] for r in sub)/len(sub),'expected_star_hits':4/m})

out={
    'project':'EUROLAB','version':'0.6.0','generated':'2026-11-20','sources':'Arquivos CSV/ZIP fornecidos pelo utilizador com origem FDJ declarada; não autenticados por download independente',
    'range':{'from':draws[0]['date'],'to':draws[-1]['date'],'draws':len(draws)},
    'methods':{'temporal':'Teste de homogeneidade de contagens 2 x N para a primeira/segunda metade de cada período de regras, com embaralhamento de SORTEIOS inteiros para conservar as 5 e as 2 bolas sem reposição','samples_mc':B,'p_formula':'(excedências+1)/(B+1)','family':'6 testes predefinidos (3 épocas × números/estrelas), ajuste Holm-Bonferroni','seed':SEED,'interpretation':'Testes exploratórios de mudança de distribuição; nenhuma associação causal a máquinas, lote de bolas ou ambiente sem registos técnicos por sorteio.'},
    'groups':groups,'temporal_tests':results,'backtest':backtest,
    'technical_conclusion':'Máquinas/lotes de bolas não ligados individualmente aos sorteios: comparação com equipamento é impossível neste estado.'
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Guardado:',OUT)
print('Sorteios',len(draws),'backtest:',len(records),'num hits',num_obs,'exp',num_expected,'stars hits',star_obs,'exp',star_expected)
for a in results:print(a['period'],a['variable'],'p',round(a['mc_p'],5),'Holm',round(a['holm_p'],5))
print('backtest p',backtest['null_p_two_sided_numbers'],backtest['null_p_two_sided_stars'])
