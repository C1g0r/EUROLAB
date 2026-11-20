#!/usr/bin/env python3
"""EUROLAB v1.4: offline regression tests for the FDJ append-only updater."""
import csv
import io
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts.atualizar_fdj import update  # noqa: E402

SOURCE_ZIP = ROOT / "fontes" / "originais" / "euromillions_202002.zip"
REQUIRED = ["dados-validados.json", "auditoria-financeira-v09.json",
            "relatorio-validacao.json", "historico-euromilhoes.csv"]

def mock_archive(new_date="20/11/2026", conflict=False):
    with zipfile.ZipFile(SOURCE_ZIP) as original:
        csv_filename = [name for name in original.namelist() if name.endswith(".csv")][0]
        text = original.read(csv_filename).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text), delimiter=";")
    rows = list(reader)
    if conflict:
        row = rows[0]
    else:
        row = rows[0].copy()
        row["date_de_tirage"] = new_date
        row["annee_numero_de_tirage"] = "26093"
        row["jour_de_tirage"] = "VE"
        rows.insert(0, row)
    values = [4, 12, 30, 42, 49]
    stars = [2, 11]
    for idx, num in enumerate(values, 1):
        row["boule_" + str(idx)] = str(num)
    for idx, num in enumerate(stars, 1):
        row["etoile_" + str(idx)] = str(num)
    row["boules_gagnantes_en_ordre_croissant"] = "-"+"-".join(map(str,values))+"-"
    row["etoiles_gagnantes_en_ordre_croissant"] = "-"+"-".join(map(str,stars))+"-"
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=reader.fieldnames, delimiter=";", lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    target = io.BytesIO()
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as result:
        result.writestr(csv_filename, buf.getvalue().encode("utf-8-sig"))
    return target.getvalue()

class UpdateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "data").mkdir()
        for item in REQUIRED:
            shutil.copy2(ROOT / "data" / item, self.root / "data" / item)
        self.baseline = (self.root / "data" / "dados-validados.json").read_bytes()

    def test_existing_archive_no_changes(self):
        count = update(self.root, SOURCE_ZIP.read_bytes())
        self.assertEqual(count, 0)
        self.assertEqual((self.root / "data" / "dados-validados.json").read_bytes(), self.baseline)

    def test_appends_new_draw_and_preserves_old(self):
        count = update(self.root, mock_archive())
        self.assertEqual(count, 1)
        draws = json.loads((self.root / "data" / "dados-validados.json").read_text())["draws"]
        self.assertEqual(draws[0]["date"], "2026-11-20")
        self.assertEqual(draws[0]["numbers"], [4, 12, 30, 42, 49])
        self.assertEqual(len(draws), 2000)
        audit = json.loads((self.root / "data" / "auditoria-financeira-v09.json").read_text())
        self.assertEqual(audit["summary"]["draws"], 2000)
        self.assertEqual(audit["records"][0]["date"], "2026-11-20")
        self.assertEqual(len(audit["records"][0]["tiers"]), 13)
        self.assertEqual(len(list((self.root / "fontes" / "atualizacoes").glob("*.zip"))), 1)

    def test_rejects_unscheduled_draw(self):
        with self.assertRaisesRegex(ValueError, "lacunas|futuro"):
            update(self.root, mock_archive("22/11/2026"))
        self.assertEqual((self.root / "data" / "dados-validados.json").read_bytes(), self.baseline)

    def test_rejects_rewritten_existing_draw(self):
        with self.assertRaisesRegex(ValueError, "Conflito"):
            update(self.root, mock_archive(conflict=True))
        self.assertEqual((self.root / "data" / "dados-validados.json").read_bytes(), self.baseline)

if __name__ == "__main__":
    unittest.main()
