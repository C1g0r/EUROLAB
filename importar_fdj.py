#!/usr/bin/env python3
"""EUROLAB: converte arquivos ZIP/CSV oficiais FDJ para JSON local.
Uso: python3 importar_fdj.py arquivo1.zip ... arquivo6.zip
Sem pacotes externos. Nunca descarrega dados ou inventa sorteios.
"""
import argparse,csv,io,json,re,sys,unicodedata,zipfile
from datetime import date
from pathlib import Path

LIMIT=date(2026,11,20)
START=date(2004,2,13)

def normalized(s):
    s=unicodedata.normalize('NFKD',str(s).lower())
    return re.sub(r'[^a-z0-9]','', ''.join(c for c in s if not unicodedata.combining(c)))

def parse_date(v):
    s=str(v).strip().split(' ')[0]
    if re.fullmatch(r'\d{8}',s):
        from datetime import datetime
        return datetime.strptime(s,'%Y%m%d').date()
    for fmt in ('%Y-%m-%d','%d/%m/%Y','%d/%m/%y','%d-%m-%Y','%Y/%m/%d'):
        try:
            from datetime import datetime
            return datetime.strptime(s,fmt).date()
        except ValueError:pass
    raise ValueError('data inválida '+str(v))

def maxstar(d):
    return 9 if d<date(2011,5,10) else 11 if d<date(2016,9,27) else 12

def decode(b):
    for enc in ('utf-8-sig','cp1252','latin-1'):
        try:return b.decode(enc)
        except UnicodeDecodeError:pass
    return b.decode('utf-8',errors='replace')

def parse_table(raw,source):
    text=decode(raw).replace('\x00','')
    # CSV da FDJ geralmente usa ; e cabeçalhos com campos boule_1/etoile_1
    lines=[l for l in text.splitlines() if l.strip()]
    if not lines:return [],[(source,'ficheiro vazio')]
    sep=max(';',',','\t',key=lambda s:lines[0].count(s))
    rows=csv.DictReader(io.StringIO('\n'.join(lines)),delimiter=sep)
    if not rows.fieldnames:return [],[(source,'sem cabeçalhos')]
    fields={normalized(h):h for h in rows.fieldnames if h}
    def pick(*names):
        for name in names:
            if normalized(name) in fields:return fields[normalized(name)]
        return None
    datecol=pick('date_de_tirage','date_tirage','date','date du tirage','datedutirage')
    bcols=[pick(f'boule_{i}',f'boule{i}',f'numero_{i}',f'numero{i}',f'num{i}',f'n{i}',f'ball{i}') for i in range(1,6)]
    ecols=[pick(f'etoile_{i}',f'etoile{i}',f'e{i}',f'star{i}') for i in range(1,3)]
    if not datecol or any(c is None for c in bcols+ecols):
        return [],[(source, 'cabeçalhos não reconhecidos: '+', '.join(rows.fieldnames[:24]))]
    output=[];invalid=[]
    for line,row in enumerate(rows,2):
        try:
            d=parse_date(row[datecol]);n=[int(str(row[c]).strip()) for c in bcols];s=[int(str(row[c]).strip()) for c in ecols]
            if d<START or d>LIMIT:continue
            if len(set(n))!=5 or any(x<1 or x>50 for x in n):raise ValueError('números incorretos')
            if len(set(s))!=2 or any(x<1 or x>maxstar(d) for x in s):raise ValueError('estrelas fora do regime')
            output.append({'date':d.isoformat(),'numbers':sorted(n),'stars':sorted(s),'numbers_raw':n,'stars_raw':s,'source_archive':source.split('/')[0],'source_csv_row':line})
        except Exception as ex:invalid.append((f'{source}:{line}',str(ex)))
    return output,invalid

def extract(paths):
    for p in paths:
        if p.suffix.lower()=='.zip':
            with zipfile.ZipFile(p) as z:
                for name in z.namelist():
                    if name.lower().endswith(('.csv','.txt')) and not name.startswith('__MACOSX'):
                        yield f'{p.name}/{name}',z.read(name)
        elif p.suffix.lower() in ('.csv','.txt'):
            yield p.name,p.read_bytes()
        else: raise ValueError(f'Formato não suportado: {p}')

def run(paths,out):
    by_date={}; rejected=[]; duplicates=0;conflicts=[];sources=[]
    for name,blob in extract(paths):
        sources.append(name)
        rows,errors=parse_table(blob,name);rejected.extend(errors)
        print(f'{name}: {len(rows)} registos válidos, {len(errors)} rejeitados')
        for r in rows:
            old=by_date.get(r['date'])
            if old is None:by_date[r['date']]=r
            elif all(old[k]==r[k] for k in ('date','numbers','stars','numbers_raw','stars_raw')):duplicates+=1
            else:conflicts.append({'date':r['date'],'previous':old,'incoming':r,'file':name})
    result=sorted(by_date.values(),key=lambda x:x['date'],reverse=True)
    meta={'source':'ZIP/CSV fornecidos pelo utilizador (origem declarada: FDJ)','files':sources,'imported':len(result),'rejected':len(rejected),'duplicates':duplicates,'conflicts':len(conflicts),'cutoff':'2026-11-20','validation':'Validação estrutural + deteção de conflitos; proveniência depende dos arquivos fornecidos'}
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps({'meta':meta,'draws':result},ensure_ascii=False,indent=2),encoding='utf-8')
    report=out.parent/'relatorio-validacao.json'
    report.write_text(json.dumps({'summary':meta,'errors':rejected[:1000],'conflicts':conflicts},ensure_ascii=False,indent=2),encoding='utf-8')
    print('\nTOTAL:',len(result),'| duplicados:',duplicates,'| conflitos:',len(conflicts),'| rejeitados:',len(rejected))
    print('JSON:',out,'\nRelatório:',report)
    if conflicts or rejected:print('ATENÇÃO: rever relatorio-validacao.json antes de considerar os dados verificados.')
    return 1 if conflicts or rejected else 0

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('files',nargs='+',type=Path)
    parser.add_argument('--output',type=Path,default=Path('data/dados-validados.json'))
    a=parser.parse_args()
    try:sys.exit(run(a.files,a.output))
    except Exception as ex:print('ERRO:',ex,file=sys.stderr);sys.exit(2)
