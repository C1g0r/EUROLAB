#!/usr/bin/env python3
"""Regenerate and verify EUROLAB v1.4's frozen crowd-calendar proxy.

Only pre-2024 drawings fit the coefficients; 2024–2026 is unseen holdout.
This is descriptive modelling of winner counts, NOT jackpot prediction.
"""
from __future__ import annotations
import json
from math import log
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def fit(rows):
    mean_x = sum(x for x, _ in rows) / len(rows)
    mean_y = sum(y for _, y in rows) / len(rows)
    b = sum((x - mean_x) * (y - mean_y) for x, y in rows) / sum((x - mean_x) ** 2 for x, _ in rows)
    return mean_y - b * mean_x, b

def mse(data, func):
    return sum((y - func(x)) ** 2 for x, y in data) / len(data)

def main():
    d = json.loads((ROOT / "data" / "dados-validados.json").read_text(encoding="utf-8"))
    a = json.loads((ROOT / "data" / "auditoria-financeira-v09.json").read_text(encoding="utf-8"))
    model = json.loads((ROOT / "data" / "modelo-popularidade-v14.json").read_text(encoding="utf-8"))
    by_date = {r["date"]: r for r in d["draws"]}
    rows = []
    counts = dict.fromkeys(range(6), 0)
    for r in a["records"]:
        ds = r["date"]
        if ds < model["regime_start"] or ds > model["calibration_end"] or r["issues"]:
            continue
        if ds not in by_date:
            raise ValueError("Contagens sem resultado correspondente: " + ds)
        tiers = {x["rank"]: x for x in r["tiers"]}
        if 10 not in tiers or 13 not in tiers or not all(tiers[k]["europe_reliable"] for k in (10, 13)):
            continue
        v10, v13 = tiers[10]["europe_raw"], tiers[13]["europe_raw"]
        if v10 is None or v13 is None or v13 <= 0:
            continue
        x = sum(n <= 31 for n in by_date[ds]["numbers"])
        y = log((v10 + 0.5) / (v13 + 0.5))
        rows.append((ds, x, y))
        counts[x] += 1
    train = [(x, y) for ds, x, y in rows if ds < model["validation_start"]]
    holdout = [(x, y) for ds, x, y in rows if ds >= model["validation_start"]]
    assert len(rows) == model["usable_draws"]
    assert len(train) == model["training_draws"]
    assert len(holdout) == model["validation_draws"]
    assert {str(k): v for k, v in counts.items()} == model["coverage_by_calendar_numbers"]
    intercept, slope = fit(train)
    err_baseline = mse(holdout, lambda x: sum(y for _, y in train) / len(train))
    err_model = mse(holdout, lambda x: intercept + slope * x)
    reduction = 1 - err_model / err_baseline
    assert abs(intercept - model["coefficients"]["intercept"]) < 1e-7
    assert abs(slope - model["coefficients"]["calendar_number"]) < 1e-7
    assert abs(err_baseline - model["validation"]["mse_simple_baseline"]) < 1e-9
    assert abs(err_model - model["validation"]["mse_feature_model"]) < 1e-9
    print(f"OK:  {len(train)} treino, {len(holdout)} validação; "
          f"beta={slope:.8f}; redução relativa de EQM={reduction*100:.2f}%.")
    print("Aviso: associação agregada, não probabilidade de dividir um prémio.")

if __name__ == "__main__":
    main()
