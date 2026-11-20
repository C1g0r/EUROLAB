#!/usr/bin/env python3
"""Verificações estruturais básicas, não certificação dos arquivos de origem."""
from datetime import date
from pathlib import Path
import json
BASE = Path(__file__).resolve().parents[1]
DATA = BASE / 'data'
for path in DATA.glob('*.json'):
    with path.open(encoding='utf-8') as f:
        json.load(f)
info = json.loads((DATA / 'dados-validados.json').read_text(encoding='utf-8'))
draws = info['draws']
assert len(draws) >= 1999, f'Histórico truncado: {len(draws)} sorteios'
dates = []
for draw in draws:
    d = date.fromisoformat(draw['date'])
    dates.append(d)
    n, s = draw['numbers'], draw['stars']
    assert len(n) == len(set(n)) == 5 and all(1 <= x <= 50 for x in n), draw
    assert len(s) == len(set(s)) == 2 and all(1 <= x <= 12 for x in s), draw
    assert sorted(draw['numbers_raw']) == sorted(n), draw
    assert sorted(draw['stars_raw']) == sorted(s), draw
assert len(set(dates)) == len(dates), 'Datas duplicadas'
assert min(dates).isoformat() == '2004-02-13'
assert max(dates).isoformat() == info['meta']['expected_through']
assert len(draws) == info['meta']['imported']
audit = json.loads((DATA / 'auditoria-financeira-v09.json').read_text(encoding='utf-8'))
assert len(audit['records']) == len(draws)
assert audit['summary']['draws'] == len(draws)
assert len({d['date'] for d in audit['records']}) == len(draws)
assert set(d['date'] for d in audit['records']) == set(datestr.isoformat() for datestr in dates)
print(f'OK: JSON válido, {len(draws)} sorteios únicos até {max(dates)} e consistência estrutural financeira.')
