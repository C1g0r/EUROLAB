import json,math,collections,statistics,datetime
from pathlib import Path
from scipy.stats import chisquare,binomtest,hypergeom
root=Path(__file__).resolve().parents[1]; data=json.loads((root/'data/dados-validados.json').read_text()); draws=sorted(data['draws'],key=lambda d:d['date'])
def era(date): return '2004-2011' if date<'2011-05-10' else '2011-2016' if date<'2016-09-27' else '2016-2026'
def analyze(arr, starmax):
 n=len(arr); nc=collections.Counter(v for d in arr for v in d['numbers']);sc=collections.Counter(v for d in arr for v in d['stars']);counts=[nc[i] for i in range(1,51)]; stars=[sc[i] for i in range(1,starmax+1)]
 rep=[len(set(a['numbers'])&set(b['numbers'])) for a,b in zip(arr,arr[1:])]
 # expected adjacent duplicates distribution hypergeom 50 population, 5 success, draw 5
 hist=[rep.count(i) for i in range(6)]; exp=[len(rep)*float(hypergeom.pmf(i,50,5,5)) for i in range(6)]
 # group 3+ for reasonable chi-square expected bins
 hist3=hist[:3]+[sum(hist[3:])]; exp3=exp[:3]+[sum(exp[3:])]
 chi_repeat=chisquare(hist3,exp3) if len(rep)>0 else None
 return {'draws':n,'main':{'observed':counts,'expected_per_number':n/10,'chi2':float(chisquare(counts).statistic),'p_value':float(chisquare(counts).pvalue),'top5':sorted([[i+1,v] for i,v in enumerate(counts)],key=lambda x:-x[1])[:5],'bottom5':sorted([[i+1,v] for i,v in enumerate(counts)],key=lambda x:x[1])[:5]},'stars':{'max':starmax,'observed':stars,'expected_per_star':2*n/starmax,'chi2':float(chisquare(stars).statistic),'p_value':float(chisquare(stars).pvalue)},'consecutive_overlap':{'sample_pairs':len(rep),'observed':hist,'expected':exp,'mean':(statistics.mean(rep) if rep else None),'expected_mean':0.5,'chi2_bins_0_1_2_3plus':{'observed':hist3,'expected':exp3,'chi2':float(chi_repeat.statistic) if chi_repeat else None,'p_value':float(chi_repeat.pvalue) if chi_repeat else None}}}
res={'meta':{'created':'2026-11-20','range':'2004-02-13 through 2026-11-17','method':'Pearson goodness-of-fit (marginal counts), hypergeometric 5/50 overlap, each era tested separately','warnings':['Exploratory tests; p-values unadjusted for multiple analyses and model-selection.','Counts in one draw are not independent, but Pearson marginal goodness-of-fit provides an approximate diagnostic; Monte Carlo draw-level null simulation should be preferred for confirmatory inference.','Era star ranges and expected counts must not be merged.','Consecutive-overlap analysis only within same selected era.','A statistically significant result would not automatically imply predictability or physical bias.']},'overall':analyze(draws,12),'eras':{}}
res['overall']['stars']['p_value']=None
res['overall']['stars']['chi2']=None
res['overall']['stars']['note']='Estrelas sem teste global: universos históricos distintos'
for key, mx in [('2004-2011',9),('2011-2016',11),('2016-2026',12)]: res['eras'][key]=analyze([d for d in draws if era(d['date'])==key],mx)
(root/'data/analise-estatistica.json').write_text(json.dumps(res,ensure_ascii=False,indent=2))
for k,r in [('overall',res['overall']),*res['eras'].items()]:
 print(k,r['draws'],'main p',round(r['main']['p_value'],6),'stars p',r['stars']['p_value'],'overlap',round(r['consecutive_overlap']['chi2_bins_0_1_2_3plus']['p_value'],6))
