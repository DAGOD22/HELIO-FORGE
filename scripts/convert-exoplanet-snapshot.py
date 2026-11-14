#!/usr/bin/env python3
"""Convert the saved NASA TAP CSV to the browser's compact JSON snapshot."""
import csv
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'public' / 'data'
with (root / 'exoplanet-snapshot.csv').open(newline='', encoding='utf-8') as source:
    rows = list(csv.DictReader(source))
with (root / 'exoplanet-references.json').open(encoding='utf-8') as refs_file:
    refs_data = json.load(refs_file)
refs = {item['pl_name']: item for item in refs_data['rows']}
assert refs_data['retrievedDate'] == '2026-11-13' and len(refs) == len(rows)
strings = {'pl_name', 'hostname', 'pl_bmassprov', 'discoverymethod'}
for row in rows:
    for key, value in row.items():
        if key not in strings:
            row[key] = float(value) if value else None
    ref = refs[row['pl_name']]
    assert ref['hostname'] == row['hostname']
    row.update({key: ref[key] for key in ('pl_refname', 'pl_controv_flag', 'soltype')})
with (root / 'exoplanet-snapshot.json').open('w', encoding='utf-8') as target:
    json.dump({'retrievedDate': '2026-11-13', 'source': 'NASA Exoplanet Archive, Planetary Systems table (default_flag=1)', 'rows': rows}, target, separators=(',', ':'))
