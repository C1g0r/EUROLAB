#!/usr/bin/env python3
"""Preserva as colunas FDJ na ordem original e reconcilia-as com o EUROLAB v0.7.

Uso: python3 scripts/recover_order.py
Não exige rede, não infere ordem física; confirma os campos ordenados publicados no CSV.
"""
import csv
import hashlib
import io
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from importar_fdj import parse_date,decode
NAMES=('euromillions.zip','euromillions_2.zip','euromillions_3.zip','euromillions_4.zip','euromillions_201902.zip','euromillions_202002.zip')

def run():
    data_path=ROOT/'data'/'dados-validados.json'
    obj=json.loads(data_path.read_text(encoding='utf-8'))
    by_date={d['date']:d for d in obj['draws']}
    if len(by_date)!=1999:raise RuntimeError('Base anterior inesperada; recusada atualização')
    count=0;conflicts=[];hashes={}
    for archive in NAMES:
        p=ROOT/'fontes'/'originais'/archive
        hashes[archive]=hashlib.sha256(p.read_bytes()).hexdigest()
        with zipfile.ZipFile(p) as z:
            for csvname in (n for n in z.namelist() if n.lower().endswith('.csv')):
                rows=csv.DictReader(io.StringIO(decode(z.read(csvname))),delimiter=';')
                for i,row in enumerate(rows,2):
                    if not row.get('date_de_tirage') or not row.get('boule_1'):continue
                    date=parse_date(row['date_de_tirage']).isoformat()
                    nums=[int(row[f'boule_{i}']) for i in range(1,6)]
                    stars=[int(row[f'etoile_{i}']) for i in range(1,3)]
                    ascnums=[int(x) for x in re.findall(r'\d+',row['boules_gagnantes_en_ordre_croissant'])]
                    ascstars=[int(x) for x in re.findall(r'\d+',row['etoiles_gagnantes_en_ordre_croissant'])]
                    rec=by_date.get(date)
                    if rec is None or sorted(nums)!=sorted(ascnums) or sorted(stars)!=sorted(ascstars) or sorted(nums)!=rec['numbers'] or sorted(stars)!=rec['stars']:
                        conflicts.append({'date':date,'archive':archive,'csvrow':i,'reason':'valores divergentes'})
                        continue
                    if 'numbers_raw' in rec and (rec['numbers_raw']!=nums or rec['stars_raw']!=stars):
                        conflicts.append({'date':date,'archive':archive,'csvrow':i,'reason':'ordem em conflito'})
                        continue
                    rec['numbers_raw']=nums;rec['stars_raw']=stars
                    rec['source_archive']=archive;rec['source_csv_row']=i
                    count+=1
    if conflicts or count!=1999 or any('numbers_raw' not in d for d in obj['draws']):
        raise RuntimeError('Falha de reconciliação (sem alterações efetuadas): '+json.dumps({'count':count,'conflicts':conflicts[:8]},ensure_ascii=False))
    obj['meta'].update({
        'original_column_sequences_preserved':True,
        'original_order_semantics':'colunas_boule_1_a_5_e_etoile_1_a_2;_nao_certificada_ordem_fisica',
        'ascending_check_mismatches':0,
        'source_zip_sha256':hashes,
        'original_order_checked_records':count,
    })
    data_path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    report={'as_of':'2026-11-20','origin':'arquivos do utilizador (FDJ declarado)','total_rows':count,
        'unique_dates':len(by_date),'sorted_field_mismatches':0,'source_sha256':hashes,
        'unsorted_numbers':sum(d['numbers_raw']!=sorted(d['numbers_raw']) for d in obj['draws']),
        'unsorted_stars':sum(d['stars_raw']!=sorted(d['stars_raw']) for d in obj['draws']),
        'note':'As colunas originais NÃO foram independentemente certificadas como ordem física de extração.'}
    (ROOT/'data'/'auditoria-ordens-v08.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Reconciliados',count,'sorteios; divergências=0; não ordenados',report['unsorted_numbers'],report['unsorted_stars'])
    return report
if __name__=='__main__':run()
