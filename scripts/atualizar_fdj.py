#!/usr/bin/env python3
"""EUROLAB v1.4: append-only FDJ update with conservative validation.

Only new, scheduled drawings may be appended. Existing rows and original ZIPs
are never silently replaced. When a check fails, fail closed and retain the
published history. For CI usage: python3 scripts/atualizar_fdj.py
For offline tests: python3 scripts/atualizar_fdj.py --archive path.zip --root /tmp/copy
"""
from __future__ import annotations
import argparse
import csv
from datetime import date, timedelta
import hashlib
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import re
import urllib.parse
import urllib.request
import zipfile

PAGE_URL = "https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/historique"
FALLBACK_URL = "https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afe6"
MAX_DOWNLOAD = 5_000_000

class ArchiveLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        for k, v in attrs:
            if k == "href" and v:
                self.links.append(v)

def approved_url(url: str) -> bool:
    p = urllib.parse.urlparse(url)
    return (p.scheme == "https" and p.hostname in {"sto.api.fdj.fr", "www.sto.api.fdj.fr"}
            and p.path.startswith("/anonymous/service-draw-info/v3/documentations/"))

def get_url_data(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "EUROLAB-research-updater/1.4 (+public FDJ archive)"})
    with urllib.request.urlopen(request, timeout=35) as response:
        if not approved_url(response.geturl()) and url != PAGE_URL:
            raise ValueError("Arquivo redirecionado para endereço não autorizado")
        content = response.read(MAX_DOWNLOAD + 1)
    if len(content) > MAX_DOWNLOAD:
        raise ValueError("Arquivo remoto excessivamente grande")
    return content

def download_archive() -> bytes:
    # Fail closed: only accept the published FDJ archive host and ZIP bytes.
    try:
        parser = ArchiveLinks()
        parser.feed(get_url_data(PAGE_URL).decode("utf-8", errors="replace"))
        candidates = [urllib.parse.urljoin(PAGE_URL, x) for x in parser.links]
        candidates = [x for x in candidates if approved_url(x)]
    except Exception as e:
        print("Aviso: não foi possível descobrir a ligação FDJ:", str(e))
        candidates = []
    if FALLBACK_URL not in candidates:
        candidates.append(FALLBACK_URL)
    for url in candidates:
        try:
            payload = get_url_data(url)
            if zipfile.is_zipfile(io.BytesIO(payload)):
                return payload
        except Exception as e:
            print("Arquivo FDJ indisponível:", str(e))
    raise RuntimeError("Não foi possível transferir um arquivo ZIP FDJ válido")

def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))

def parse_date(raw: str) -> str:
    value = raw.strip()
    if re.fullmatch(r"\d{8}", value):
        return date(int(value[:4]), int(value[4:6]), int(value[6:])).isoformat()
    if re.fullmatch(r"\d{2}/\d{2}/\d{4}", value):
        dd, mm, yyyy = map(int, value.split("/"))
        return date(yyyy, mm, dd).isoformat()
    return date.fromisoformat(value).isoformat()

def parse_number(v: str) -> int:
    value = str(v or "").replace(" ", "").replace("\u00a0", "").replace("\u202f", "")
    if not value.isdecimal():
        raise ValueError("Contagem de vencedores não numérica: " + repr(v))
    return int(value)

def parse_money(v: str) -> float:
    value = str(v or "").replace(" ", "").replace("\u00a0", "").replace("\u202f", "").replace(",", ".")
    result = float(value)
    if result < 0 or not result < float("inf"):
        raise ValueError("Montante inválido")
    return result

def rows_from_zip(data: bytes):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        paths = [x for x in archive.namelist() if x.lower().endswith(".csv") and not x.startswith("__MACOSX")]
        if len(paths) != 1:
            raise ValueError("O arquivo FDJ deve conter exatamente um CSV.")
        name = paths[0]
        raw = archive.read(name)
    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        content = raw.decode("cp1252")
    reader = csv.DictReader(io.StringIO(content), delimiter=";")
    needed = ["date_de_tirage"] + ["boule_" + str(i) for i in range(1, 6)] + ["etoile_1", "etoile_2"]
    if not reader.fieldnames or not all(key in reader.fieldnames for key in needed):
        raise ValueError("O CSV FDJ mudou de esquema ou faltam colunas críticas.")
    parsed = {}
    for lineno, row in enumerate(reader, 2):
        ds = parse_date(row["date_de_tirage"])
        if ds in parsed:
            raise ValueError("Data repetida no arquivo FDJ: " + ds)
        nraw = [parse_number(row["boule_" + str(i)]) for i in range(1, 6)]
        sraw = [parse_number(row["etoile_" + str(i)]) for i in (1, 2)]
        if (len(set(nraw)) != 5 or any(x < 1 or x > 50 for x in nraw)
                or len(set(sraw)) != 2 or any(x < 1 or x > 12 for x in sraw)):
            raise ValueError("Combinação FDJ inválida: " + ds)
        parsed[ds] = (nraw, sraw, row, lineno)
    return parsed, len(reader.fieldnames)

def next_draw(d: date) -> date:
    d += timedelta(days=1)
    while d.weekday() not in (1, 4):  # Tuesday, Friday
        d += timedelta(days=1)
    return d

def build_tiers(row):
    tiers = []
    for rank in range(1, 14):
        prefix = "nombre_de_gagnant_au_rang" + str(rank) + "_Euro_Millions_"
        fr = parse_number(row[prefix + "en_france"])
        eu = parse_number(row[prefix + "en_europe"])
        pay = parse_money(row["rapport_du_rang" + str(rank) + "_Euro_Millions"])
        if fr > eu:
            raise ValueError("Mais vencedores franceses do que europeus: escalão " + str(rank))
        tiers.append({"rank": rank, "france": fr, "europe_raw": eu,
                      "payout_eur_raw": pay, "europe_reliable": True})
    return tiers

def save_json(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def update(root: Path, payload: bytes):
    data_dir = root / "data"
    hist_path = data_dir / "dados-validados.json"
    audit_path = data_dir / "auditoria-financeira-v09.json"
    validation_path = data_dir / "relatorio-validacao.json"
    existing = load_json(hist_path)
    audit = load_json(audit_path)
    valid = load_json(validation_path)
    known = {x["date"]: x for x in existing["draws"]}
    if len(known) != len(existing["draws"]):
        raise ValueError("O nosso histórico contém duplicações")
    latest = max(known)
    current, columns = rows_from_zip(payload)
    # The latest FDJ archive begins in 2020. Enforce a substantial overlap.
    overlap = set(known) & set(current)
    if len(overlap) < 100:
        raise ValueError("Arquivo novo sem sobreposição histórica suficiente")
    for ds in sorted(overlap):
        old = known[ds]
        n, s = current[ds][:2]
        if sorted(n) != old["numbers"] or sorted(s) != old["stars"]:
            raise ValueError("Conflito com histórico existente: " + ds)
    new_dates = sorted(x for x in current if x not in known)
    if not new_dates:
        print("FDJ: sem sorteios novos; nenhum ficheiro alterado.")
        return 0
    if len(new_dates) > 40:
        raise ValueError("Demasiados sorteios novos; revisão manual necessária")
    if new_dates[0] <= latest:
        raise ValueError("Arquivo introduz concurso anterior ao histórico sem aprovação")
    expected = date.fromisoformat(latest)
    for ds in new_dates:
        expected = next_draw(expected)
        dt = date.fromisoformat(ds)
        if dt != expected or dt > date.today():
            raise ValueError("Datas FDJ com lacunas ou no futuro: " + ds)
    sha = hashlib.sha256(payload).hexdigest()
    archive_name = "fdj-" + new_dates[-1] + "-" + sha[:10] + ".zip"
    new_entries, finance = [], []
    for ds in new_dates:
        nr, sr, row, lineno = current[ds]
        tiers = build_tiers(row)
        new_entries.append({"date": ds, "numbers": sorted(nr), "stars": sorted(sr),
                            "numbers_raw": nr, "stars_raw": sr,
                            "source_archive": archive_name, "source_csv_row": lineno})
        finance.append({"date": ds, "draw_number": str(row.get("annee_numero_de_tirage") or ""),
                        "archive": archive_name, "csv_row": lineno,
                        "rank_count": 13, "tiers": tiers, "issues": []})
    # All validations finish before editing any file.
    existing["draws"] = sorted(new_entries + existing["draws"], key=lambda d: d["date"], reverse=True)
    meta = existing["meta"]
    meta["imported"] = len(existing["draws"])
    meta["expected_through"] = new_dates[-1]
    meta["checked_at"] = date.today().isoformat()
    meta["original_order_checked_records"] = len(existing["draws"])
    meta.setdefault("files", []).append("fontes/atualizacoes/" + archive_name)
    meta.setdefault("source_zip_sha256", {})[archive_name] = sha
    audit["records"] = sorted(finance + audit["records"], key=lambda d: d["date"], reverse=True)
    audit["summary"]["draws"] = len(audit["records"])
    audit["summary"]["date_end"] = new_dates[-1]
    audit["summary"]["checked_pairs"] += 13 * len(finance)
    audit["summary"]["sources"].append({"archive": archive_name, "csv_rows": len(finance),
                                          "paying_ranks_in_schema": 13, "csv_columns": columns})
    valid["summary"]["imported"] = len(existing["draws"])
    valid["summary"]["expected_through"] = new_dates[-1]
    valid["summary"]["checked_at"] = date.today().isoformat()
    valid["summary"].setdefault("source_sha256", {})[archive_name] = sha
    archive_dir = root / "fontes" / "atualizacoes"
    archive_dir.mkdir(parents=True, exist_ok=True)
    (archive_dir / archive_name).write_bytes(payload)
    save_json(hist_path, existing)
    save_json(audit_path, audit)
    save_json(validation_path, valid)
    csv_path = data_dir / "historico-euromilhoes.csv"
    with csv_path.open("a", encoding="utf-8", newline="") as out:
        writer = csv.writer(out, delimiter=";", lineterminator="\n")
        for row in new_entries:
            writer.writerow([row["date"], *row["numbers"], *row["stars"]])
    save_json(data_dir / "ultima-atualizacao-fdj.json", {
        "source_url": PAGE_URL, "archive_name": archive_name,
        "archive_sha256": sha, "dates_added": new_dates,
        "last_validated": new_dates[-1], "checked_at": date.today().isoformat(),
        "mode": "append-only; source FDJ; overlap and weekday validation"})
    print("FDJ: adicionados", len(new_entries), "sorteios até", new_dates[-1])
    return len(new_entries)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    p.add_argument("--archive", help="ZIP FDJ local para testes; omitir para transferir arquivo oficial")
    args = p.parse_args()
    content = Path(args.archive).read_bytes() if args.archive else download_archive()
    update(Path(args.root), content)

if __name__ == "__main__":
    main()
