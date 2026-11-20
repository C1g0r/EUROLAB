#!/usr/bin/env python3
"""EUROLAB v0.9: financial quality audit from supplied FDJ ZIP exports.
Pure standard library. Preserves raw values; does not modify historic draw results.
"""
from pathlib import Path
from collections import Counter
from datetime import datetime
import csv, hashlib, io, json, re, shutil, zipfile

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT
ARC=OUT/'fontes'/'originais'

def dec(b):
    for enc in ('utf-8-sig','cp1252','latin1'):
        try:return b.decode(enc)
        except UnicodeDecodeError:continue
    return b.decode('utf-8',errors='replace')

def parse_count(s):
    if s is None or not str(s).strip():return None
    v=re.sub(r'[\s\u00a0\u202f]','',str(s))
    if re.fullmatch(r'\d+',v):return int(v)
    raise ValueError('Contagem não inteira: '+str(s))

def parse_prize(s):
    if s is None or not str(s).strip():return None
    v=re.sub(r'[\s\u00a0\u202f]','',str(s)).replace(',','.')
    if re.fullmatch(r'\d+(?:\.\d+)?',v):return float(v)
    raise ValueError('Prémio numérico inesperado: '+str(s))

def normalize_date(s):
    for fmt in ('%d/%m/%Y','%d/%m/%y','%Y%m%d','%Y-%m-%d'):
        try:return datetime.strptime(s.strip(),fmt).strftime('%Y-%m-%d')
        except ValueError:pass
    raise ValueError('Data desconhecida: '+repr(s))

files=sorted(ARC.glob('euromillions*.zip'))
reports=[]; source_manifest=[]; all_checks=Counter(); flag_summary=Counter(); bad_count=0; source_stats=[]
for archive in files:
    raw=archive.read_bytes()
    source_manifest.append({'zip':archive.name,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)})
    with zipfile.ZipFile(archive) as z:
        member=next(n for n in z.namelist() if n.lower().endswith('.csv'))
        text=dec(z.read(member))
        reader=csv.DictReader(io.StringIO(text),delimiter=';')
        headers=reader.fieldnames or []
        ranks={}
        for rank in range(1,14):
            f=next((k for k in headers if re.search(r'rang'+str(rank)+r'_.*en_france$',k)),None)
            e=next((k for k in headers if re.search(r'rang'+str(rank)+r'_.*en_europe$',k)),None)
            p=next((k for k in headers if re.fullmatch(r'rapport_du_rang'+str(rank)+r'(?:_Euro_Millions)?',k)),None)
            if f and e and p:ranks[rank]=(f,e,p)
        assert len(ranks) in (12,13),(archive.name,len(ranks))
        number=0
        for line, row in enumerate(reader,2):
            number+=1
            day=normalize_date(row['date_de_tirage'])
            issues=[]; tiers=[]
            for rank,(fc,ec,pc) in ranks.items():
                fr=eu=pay=None
                try:fr=parse_count(row[fc]);eu=parse_count(row[ec]);pay=parse_prize(row[pc]);
                except ValueError as err:issues.append({'type':'formato_invalido','rank':rank,'reason':str(err)});flag_summary['formato_invalido']+=1
                all_checks['pares_territoriais']+=1
                if fr is not None and eu is not None and fr>eu:
                    issues.append({'type':'franca_superior_europa','rank':rank,'reason':f'{fr} vencedores França > {eu} vencedores Europa'})
                    flag_summary['franca_superior_europa']+=1
                if fr is None or eu is None:all_checks['pares_com_campo_omisso']+=1
                if pay is None:all_checks['premios_omissos']+=1
                tiers.append({'rank':rank,'france':fr,'europe_raw':eu,'payout_eur_raw':pay,'europe_reliable':not (fr is not None and eu is not None and fr>eu)})
            draw={'date':day,'draw_number':row.get('annee_numero_de_tirage',''),'archive':archive.name,'csv_row':line,'rank_count':len(ranks),'tiers':tiers,'issues':issues}
            reports.append(draw)
        source_stats.append({'archive':archive.name,'csv_rows':number,'paying_ranks_in_schema':len(ranks),'csv_columns':len(headers)})
assert len(reports)==1999,len(reports)
dates=[r['date'] for r in reports]; assert len(set(dates))==1999,'Datas duplicadas'
reports.sort(key=lambda r:r['date'],reverse=True)
flagged=[r for r in reports if r['issues']]
assert len(flagged)==1,(len(flagged),[(x['date'],x['archive']) for x in flagged[:12]])
assert flagged[0]['date']=='2020-01-31',flagged[0]['date']
assert len(flagged[0]['issues'])==12,flagged[0]['issues']
# Zero imputation: markers apply only to invalid raw regional counts; unverified values remain null.
scanned=sum(s['csv_rows']*s['paying_ranks_in_schema'] for s in source_stats)
assert scanned==all_checks['pares_territoriais']
for r in flagged:
    for tier in r['tiers']:
        if not tier['europe_reliable']:tier['europe_for_analysis']=None
        else:tier['europe_for_analysis']=tier['europe_raw']

finance={
  'meta':{'project':'EUROLAB','version':'0.9','cutoff':'2026-11-17','data_note':'Valores transcritos de arquivos fornecidos pelo utilizador, anunciados como FDJ; nenhuma correção silenciosa.','method':'Uma observação por concurso e por escalão. Validar contagem de vencedores europeus >= franceses no mesmo escalão. Zero pode ser legítimo se ambos forem zero. Todos os campos financeiros continuam distintos dos números extraídos.','readme':'RELATORIO_V09.md'},
  'summary':{'draws':len(reports),'date_start':min(dates),'date_end':max(dates),'checked_pairs':scanned,'rows_with_issues':len(flagged),'failed_pairs':flag_summary['franca_superior_europa'],'invalid_formats':flag_summary['formato_invalido'],'missing_region_pairs':all_checks['pares_com_campo_omisso'],'missing_payouts':all_checks['premios_omissos'],'sources':source_stats},
  'flagged_dates':[{'date':r['date'],'archive':r['archive'],'csv_row':r['csv_row'],'issues':r['issues']} for r in flagged],
  'records':reports,
  'files':source_manifest,
  'external_cross_check':{'date':'2020-01-31','rank':2,'europe_winners_secondary':12,'france_winners_zip':4,'source':'https://www.tirage-euromillions.net/euromillions/resultats/2020/vendredi-31-janvier/','level':'independent_secondary','note':'Comparação localizada: arquivo indica 0 Europa e 4 França no escalão 2; a fonte independente indica 12 Europa e 4 França. Não altera outros valores.'}
}
(OUT/'data'/'auditoria-financeira-v09.json').write_text(json.dumps(finance,ensure_ascii=False,indent=2),encoding='utf-8')

registry={
  'meta':{'project':'EUROLAB','version':'0.9','evidence_warning':'Registos oriundos de um site independente Euro-Millions.com. Os identificadores não são certificações oficiais da FDJ, nem provam modelo de máquina, número de série ou lote físico inequívoco.','video_audited':False},
  'rows':[
    {'date':'2004-02-13','machine':'Machine 1','ball_set':'E1','source':'https://www.euro-millions.com/fr/resultats/13-02-2004','confidence':'secundaria_nao_auditada','notes':'Nomenclatura histórica do fornecedor de resultados; não comparável automaticamente com a nomenclatura moderna.'},
    {'date':'2016-09-16','machine':'3','ball_set':'4','source':'https://www.euro-millions.com/fr/resultats/16-09-2016','confidence':'secundaria_nao_auditada','notes':'Sem certificado primário de correspondência com o equipamento físico.'},
    {'date':'2020-01-31','machine':'1','ball_set':'19','source':'https://www.euro-millions.com/fr/resultats/31-01-2020','confidence':'secundaria_nao_auditada','notes':'Neste mesmo concurso, o arquivo FDJ fornecido tem 12 inconsistências de vencedores europeus.'},
    {'date':'2026-11-17','machine':'13','ball_set':'21','source':'https://www.euro-millions.com/fr/resultats/17-11-2026','confidence':'secundaria_nao_auditada','notes':'Conjunto de bolas da fonte independente; composição exata e definição técnica a confirmar.'},
  ]
}
known=set(dates)
assert all(r['date'] in known for r in registry['rows'])
draws={r['date']:r for r in json.loads((OUT/'data'/'dados-validados.json').read_text())['draws']}
for r in registry['rows']:
    src=draws[r['date']]
    r['numbers']=src['numbers'];r['stars']=src['stars'];r['numbers_csv_order']=src['numbers_raw'];r['stars_csv_order']=src['stars_raw'];r['source_archive']=src['source_archive']
(OUT/'data'/'maquinas-external-v09.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2),encoding='utf-8')

print('Auditoria financeira regenerada:',len(reports),'sorteios,',scanned,'pares,',len(flagged),'datas afetadas,',flag_summary['franca_superior_europa'],'campos inconsistentes')
