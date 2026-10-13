#!/usr/bin/env python3
"""CSV plesů -> data/plesy.json ; obce -> data/psc.json. Spusť po každém novém sběru:
   python3 scripts/build_data.py [cesta_k_csv]"""
import csv, json, re, sys, collections, pathlib, hashlib
R = pathlib.Path(__file__).resolve().parent.parent
src = sys.argv[1] if len(sys.argv) > 1 else "/workspace/plesy/plesy_cr.csv"
def price(t):
    t2 = re.sub(r"\([^)]*\)", "", t or "")
    n = [int(x) for x in re.findall(r"(?<![\d.])\d{2,5}(?![\d.])", t2)] if re.search(r"Kč|,-", t2) else []
    n = [x for x in n if x > 0] or ([0] if re.search(r"zdarma|volný", t or "", re.I) else [])
    return min(n) if n else None
out = []
with open(src, encoding="utf-8-sig") as f:
    for i, r in enumerate(csv.DictReader(f, delimiter=";")):
        r = {k: (v or "").strip() for k, v in r.items()}
        try: lat, lon = float(r["gps_lat"]), float(r["gps_lon"])
        except ValueError: lat = lon = None
        approx = bool(re.search(r"přibližn|střed obce", r["poznamka"], re.I))
        d = {k: v for k, v in r.items() if v and k not in ("gps_lat", "gps_lon")}
        d.update(id=i + 1, lat=lat, lon=lon, priblizne=approx, cena_num=price(r["cena_vstupenky"]),
                 zdroje=[u.strip() for u in r["zdroj_url"].split("|") if u.strip()])
        d.pop("zdroj_url", None)
        k = hashlib.sha1(f"{r['nazev']}|{r['datum']}|{r['obec']}".encode()).hexdigest()[:12]
        if r.get("plakat_url") and (R / f"img/plakaty/{k}.webp").exists(): d["plakat"] = k
        else: d.pop("plakat_url", None); d.pop("plakat_zdroj", None)
        out.append(d)
json.dump(out, open(R / "data/plesy.json", "w"), ensure_ascii=False, separators=(",", ":"))
acc = collections.defaultdict(list)
for r in csv.DictReader(open(R / "tools/souradnice_obci.csv", encoding="utf-8")):
    nm = r["Obec"]
    if nm.isupper():  # některá krajská města jsou ve zdroji VELKÝMI písmeny
        nm = re.sub(r"\b(Nad|Pod|U|V|Ve|Na|Pri|Při)\b", lambda m: m.group(1).lower(), nm.title())
    acc[r["PSČ"].replace(" ", "")].append((float(r["Latitude"]), float(r["Longitude"]), nm))
psc = {k: [round(sum(a[0] for a in v)/len(v), 4), round(sum(a[1] for a in v)/len(v), 4), v[0][2]] for k, v in acc.items()}
for r in out:  # doplň PSČ z plesů s přesnou polohou
    p = r.get("psc", "").replace(" ", "")
    if p and r["lat"] and not r["priblizne"]: psc[p] = [round(r["lat"], 4), round(r["lon"], 4), r.get("obec", "")]
for k in [f"500{n:02d}" for n in range(1, 13)]:  # HK městské části -> střed HK
    psc[k] = psc.get("50002", psc.get(k))
json.dump(psc, open(R / "data/psc.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "plesů,", len(psc), "PSČ")
