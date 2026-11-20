#!/usr/bin/env python3
"""EUROLAB v0.8 — auditoria dos campos boule_1..5 / etoile_1..2 da FDJ.

Usa somente a biblioteca padrão. As colunas originais são uma ordem registada,
mas a interpretação como ordem física de saída não foi certificada pela FDJ.
Testes de permutação condicionais à combinação efetiva: em cada iteração, embaralha
apenas a ordem dos valores de cada sorteio. Evita assumir independência entre bolas.

Uso: python3 scripts/order_lab.py --input data/dados-validados.json --output data/analise-posicoes-v08.json --simulations 2500
"""
import argparse
import json
import math
import random
from collections import Counter
from pathlib import Path

BOUNDARIES = [
    ('2004–2011', '2004-02-13', '2011-05-10', 9),
    ('2011–2016', '2011-05-10', '2016-09-27', 11),
    ('2016–2026', '2016-09-27', '2026-11-21', 12),
]

def matrix(draws, field, nslots, highest):
    observed = [[0]*(highest+1) for _ in range(nslots)]
    totals = [0]*(highest+1)
    for d in draws:
        values = d[field]
        if len(values) != nslots or len(set(values)) != nslots:
            raise ValueError('Sequência inválida: '+str(d['date']))
        for i,n in enumerate(values):
            if not (1<=n<=highest):raise ValueError('Número fora do intervalo: '+str(d['date']))
            observed[i][n]+=1
            totals[n]+=1
    return observed, totals

def chisq(observed, totals, nslots):
    return sum((observed[i][n]-totals[n]/nslots)**2/(totals[n]/nslots)
               for i in range(nslots) for n in range(1,len(totals)) if totals[n])

def monte_carlo(draws, field, nslots, highest, seed, simulations):
    obs,totals=matrix(draws,field,nslots,highest)
    stat=chisq(obs,totals,nslots)
    rng=random.Random(seed)
    exceed=0
    for _ in range(simulations):
        sim=[[0]*(highest+1) for _ in range(nslots)]
        for d in draws:
            values=d[field].copy()
            rng.shuffle(values)
            for i,n in enumerate(values):sim[i][n]+=1
        if chisq(sim,totals,nslots)>=stat-1e-12:exceed+=1
    p=(exceed+1)/(simulations+1)
    deviations=[]
    for i in range(nslots):
        for n in range(1,highest+1):
            expected=totals[n]/nslots
            if expected:
                deviations.append({'number':n,'position':i+1,'observed':obs[i][n],
                    'expected':round(expected,3),'delta':round(obs[i][n]-expected,3),
                    'standardized_delta':round((obs[i][n]-expected)/math.sqrt(expected),3)})
    deviations.sort(key=lambda v:abs(v['standardized_delta']),reverse=True)
    return {
        'n_draws':len(draws), 'positions':nslots, 'range':[1,highest],
        'statistic':round(stat,6),'simulations':simulations,'exceedances':exceed,
        'p_mc':round(p,6),'position_counts':[row[1:] for row in obs],
        'number_totals':totals[1:],'descriptive_largest_deviations':deviations[:10],
        'test': 'Permutações uniformes das posições dentro de cada sorteio; composição dos conjuntos fixa.',
    }

def holm(pvalues):
    order=sorted(range(len(pvalues)),key=lambda i:pvalues[i]); out=[0.0]*len(pvalues); prev=0
    for rank,i in enumerate(order):
        val=min(1.0,(len(pvalues)-rank)*pvalues[i]); prev=max(prev,val);out[i]=round(prev,6)
    return out

def run(src,out,simulations=2500,seed=20261120):
    obj=json.loads(Path(src).read_text(encoding='utf-8'))
    draws=obj['draws']
    if len(draws)!=1999:raise ValueError(f'Esperados 1999 sorteios; encontrados {len(draws)}')
    if any('numbers_raw' not in d or 'stars_raw' not in d for d in draws):
        raise ValueError('Faltam as sequências originais — executar scripts/recover_order.py primeiro')
    if any(sorted(d['numbers_raw'])!=d['numbers'] or sorted(d['stars_raw'])!=d['stars'] for d in draws):
        raise ValueError('Diferenças entre campos originais e combinações validadas')
    main=monte_carlo(draws,'numbers_raw',5,50,seed,simulations)
    results=[{'id':'numeros_todos','label':'Números — todos os 1 999 sorteios',**main}]
    for i,(label,start,end,m) in enumerate(BOUNDARIES):
        subset=[d for d in draws if start<=d['date']<end]
        results.append({'id':'estrelas_'+str(i),'label':'Estrelas — '+label,
            **monte_carlo(subset,'stars_raw',2,m,seed+11+i,simulations)})
    adjusted=holm([x['p_mc'] for x in results])
    for r,p in zip(results,adjusted):r['holm_p']=p;r['significant_5pct']=p<.05
    outdata={
        'version':'0.8','as_of':'2026-11-20','n_draws':len(draws),
        'columns':['boule_1','boule_2','boule_3','boule_4','boule_5','etoile_1','etoile_2'],
        'provenance':'Seis arquivos ZIP/CSV fornecidos pelo utilizador, origem declarada FDJ; hashes preservados.',
        'semantics':'ordem_de_colunas_origem_nao_confirmada_como_ordem_fisica',
        'warning':'Ordem de colunas não prova ordem real de saída. Não inferir máquinas, conjunto de bolas ou causalidade. Comparar pontualmente com vídeo integral.',
        'method':'Teste global do afastamento da uniformidade de posição, condicionado a cada combinação. O embaralhamento aleatório preserva exatamente as frequências dos números e os regimes de estrelas. Correção Holm em quatro testes.',
        'simulations':simulations,'seed':seed,
        'unsorted_numbers':sum(d['numbers_raw']!=sorted(d['numbers_raw']) for d in draws),
        'unsorted_stars':sum(d['stars_raw']!=sorted(d['stars_raw']) for d in draws),
        'results':results,
        'summary':{'tests':len(results),'significant_after_holm':sum(r['significant_5pct'] for r in results)}
    }
    Path(out).parent.mkdir(parents=True,exist_ok=True)
    Path(out).write_text(json.dumps(outdata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Escrito:',out,'| testes:',len(results))
    for r in results:print(r['label'],'qui2=',r['statistic'],'pMC=',r['p_mc'],'pHolm=',r['holm_p'])
    return outdata

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--input',default='data/dados-validados.json')
    p.add_argument('--output',default='data/analise-posicoes-v08.json')
    p.add_argument('--simulations',type=int,default=2500)
    p.add_argument('--seed',type=int,default=20261120)
    a=p.parse_args()
    run(a.input,a.output,a.simulations,a.seed)
