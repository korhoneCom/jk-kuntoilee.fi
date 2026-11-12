#!/usr/bin/env python3
"""Muuntaa painonpudotus-laskentataulukon (Google Sheets CSV) sivuston dataan.

Syöte:  sheet.csv  (Google Sheets -vienti)
Tulos:  data_painotus.js  (SITE_DATA + muokatut tiedot)

Käsittelee suomalaiset desimaalipilkut, "kg"-päätteet ja viivat.
"""
import csv
import json
import os
import re
from datetime import datetime, date

HERE = os.path.dirname(os.path.abspath(__file__))


def num(s):
    """'148,3kg' -> 148.3 ; '−2,8kg' -> -2.8 ; '25,90%' -> 25.9"""
    if s is None:
        return None
    s = str(s).strip()
    if not s:
        return None
    s = s.replace("−", "-").replace("\u2212", "-")
    s = s.replace("%", "").replace("kg", "").replace("cm", "")
    s = s.replace("\u00a0", "").replace(" ", "")
    if not s:
        return None
    try:
        return float(s.replace(",", "."))
    except ValueError:
        return None


def pvm(s):
    """'14.11.2024' -> date"""
    if not s:
        return None
    s = s.strip()
    m = re.match(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", s)
    if not m:
        return None
    d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
    try:
        return date(y, mo, d)
    except ValueError:
        return None


def iso(d):
    return d.isoformat() if d else None


def main():
    rows = list(csv.reader(open(os.path.join(HERE, "sheet.csv"), encoding="utf-8")))
    header = rows[0]

    # Sarakkeiden nimet ja indeksit
    cols = {
        "pvm": 1, "kg": 2, "pudotus": 3, "pudotus_yht": 4, "bmi": 5, "fat": 6,
        "luustolihas": 9, "viscera": 10, "perusaineenv": 11, "neste": 12,
        "luun_mineraali": 14, "proteiini": 15, "lihasmassa": 17,
    }

    data = []
    for r in rows[1:]:
        if not any(x.strip() for x in r):
            continue
        d = pvm(r[cols["pvm"]] if len(r) > cols["pvm"] else "")
        if not d:
            continue
        rec = {
            "pvm": iso(d),
            "paiva": d.strftime("%a").lower(),
            "kg": num(r[cols["kg"]]) if len(r) > cols["kg"] else None,
            "pudotus": num(r[cols["pudotus"]]) if len(r) > cols["pudotus"] else None,
            "pudotusYht": num(r[cols["pudotus_yht"]]) if len(r) > cols["pudotus_yht"] else None,
            "bmi": num(r[cols["bmi"]]) if len(r) > cols["bmi"] else None,
            "rasva": num(r[cols["fat"]]) if len(r) > cols["fat"] else None,
            "luustolihas": num(r[cols["luustolihas"]]) if len(r) > cols["luustolihas"] else None,
            "viscera": num(r[cols["viscera"]]) if len(r) > cols["viscera"] else None,
            "perusaineenv": num(r[cols["perusaineenv"]]) if len(r) > cols["perusaineenv"] else None,
            "neste": num(r[cols["neste"]]) if len(r) > cols["neste"] else None,
            "luunMineraali": num(r[cols["luun_mineraali"]]) if len(r) > cols["luun_mineraali"] else None,
            "proteiini": num(r[cols["proteiini"]]) if len(r) > cols["proteiini"] else None,
            "lihasmassa": num(r[cols["lihasmassa"]]) if len(r) > cols["lihasmassa"] else None,
        }
        if rec["kg"] is None:
            continue
        data.append(rec)

    data.sort(key=lambda x: x["pvm"])

    # Yhteenveto
    alku = data[0]
    loppu = data[-1]
    alin = min(data, key=lambda x: x["kg"])
    yht = alku["kg"] - loppu["kg"]
    eniten = alku["kg"] - alin["kg"]
    paivat = (datetime.fromisoformat(loppu["pvm"]) - datetime.fromisoformat(alku["pvm"])).days
    kuukaudet = round(paivat / 30.44, 1)

    # Kuukausittaiset keskiarvot
    kk = {}
    for r in data:
        key = r["pvm"][:7]
        kk.setdefault(key, []).append(r["kg"])
    kuukaudet_data = [
        {"kk": k, "keskiarvo": round(sum(v) / len(v), 1), "kpl": len(v),
         "alku": v[0], "loppu": v[-1]}
        for k, v in sorted(kk.items())
    ]

    # Merkkipaikat (joka 10 kg pudotettu)
    milestone = []
    for r in data:
        pudotettu = alku["kg"] - r["kg"]
        if not milestone or pudotettu >= milestone[-1]["tavoite"] + 10:
            milestone.append({"pvm": r["pvm"], "kg": r["kg"],
                              "pudotettu": round(pudotettu, 1),
                              "tavoite": int(pudotettu // 10) * 10})

    summary = {
        "alkupaino": alku["kg"],
        "alkupvm": alku["pvm"],
        "alinpaino": alin["kg"],
        "alinpainoPvm": alin["pvm"],
        "viimeisin": loppu["kg"],
        "viimeisinPvm": loppu["pvm"],
        "pudotettuAlusta": round(yht, 1),
        "enitenPudotettu": round(eniten, 1),
        "nousuaAlimmasta": round(loppu["kg"] - alin["kg"], 1),
        "paivat": paivat,
        "kuukaudet": kuukaudet,
        "viikottain": round(yht / (paivat / 7), 2),
        "merkkipaalut": milestone,
        "kuukaudetData": kuukaudet_data,
    }

    out = {
        "summary": summary,
        "data": data,
        "generated": datetime.now().isoformat(),
        "lahde": "Google Sheets -laskentataulukko",
    }

    with open(os.path.join(HERE, "data_painotus.js"), "w") as f:
        f.write("const PAINOTUS_DATA = ")
        json.dump(out, f, ensure_ascii=False)
        f.write(";\n")

    print(f"Merkintöjä: {len(data)}")
    print(f"Alku: {alku['kg']} kg ({alku['pvm']}) → Loppu: {loppu['kg']} kg ({loppu['pvm']})")
    print(f"Pudotettu: {round(yht,1)} kg · {paivat} päivää · {kuukaudet} kk · {round(yht/(paivat/7),2)} kg/vko")
    print(f"Kuukausia: {len(kuukaudet_data)}")
    print(f"-> data_painotus.js ({os.path.getsize(os.path.join(HERE,'data_painotus.js'))} tavua)")


if __name__ == "__main__":
    main()
