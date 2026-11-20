import json,numpy as np
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'data/analise-estatistica.json';j=json.loads(p.read_text());rng=np.random.default_rng(20261120)
def simulate(n,m,k,b=1000):
 obs=None; return None
for name,r in [('overall',j['overall']),*j['eras'].items()]:
 n=r['draws']; counts=np.array(r['main']['observed']); target=np.sum((counts-n/10)**2/(n/10)); exceed=0
 for i in range(1000):
  picks=np.argpartition(rng.random((n,50)),4,axis=1)[:,:5]
  c=np.bincount(picks.ravel(),minlength=50)
  stat=np.sum((c-n/10)**2/(n/10));exceed+=(stat>=target)
 r['main']['montecarlo']={'simulations':1000,'seed':20261120,'p_value':(exceed+1)/1001,'method':'1000 random draws sequences under uniformly chosen 5 distinct from 50; Pearson statistic; plus-one p'}
 if name!='overall':
  m=r['stars']['max'];v=np.array(r['stars']['observed']);target=np.sum((v-2*n/m)**2/(2*n/m));exceed=0
  for i in range(1000):
   picks=np.argpartition(rng.random((n,m)),1,axis=1)[:,:2]
   c=np.bincount(picks.ravel(),minlength=m);stat=np.sum((c-2*n/m)**2/(2*n/m));exceed+=(stat>=target)
  r['stars']['montecarlo']={'simulations':1000,'seed':20261120,'p_value':(exceed+1)/1001}
 print(name,'p_MC_nums',r['main']['montecarlo']['p_value'],'p_MC_stars',r['stars'].get('montecarlo',{}).get('p_value'))
j['meta']['method']+='; 1000 Monte Carlo uniform-without-replacement replicates for main and era star frequencies';j['meta']['warnings'].append('Monte Carlo results based on 1000 replicates (resolution approximately 0.001), exploratory; not adjusted for multiple comparisons.')
p.write_text(json.dumps(j,ensure_ascii=False,indent=2))
