"""Build documented CC BY-SA 4.0 HYG 4.0 inner subset and optional shell.
Usage: python3 scripts/extract-hyg.py path/to/hygdata_v40.csv.gz
"""
import csv, gzip, json, math, sys

inner, outer = [], []
with gzip.open(sys.argv[1], 'rt', encoding='utf-8', newline='') as source:
    for row in csv.DictReader(source):
        try:
            dist, ra, dec = (float(row[k]) for k in ('dist', 'ra', 'dec'))
        except (ValueError, TypeError):
            continue
        if not (0 < dist <= 50 and 0 <= ra < 24 and -90 <= dec <= 90):
            continue
        def num(field):
            try:
                value = float(row[field])
                return value if math.isfinite(value) else None
            except (ValueError, TypeError):
                return None
        star = {'id': int(row['id']), 'hip': row['hip'] or None,
                'name': row['proper'] or row['gl'] or ('HIP '+row['hip'] if row['hip'] else 'HD '+row['hd'] if row['hd'] else 'HYG '+row['id']),
                'ra': ra, 'dec': dec, 'dist': dist, 'mag': num('mag'),
                'spect': row['spect'] or None, 'ci': num('ci'), 'absmag': num('absmag'),
                'hd': row['hd'] or None, 'gl': row['gl'] or None, 'bf': row['bf'] or None}
        (inner if dist <= 20 else outer).append(star)
for stars, filename in [(inner, 'hyg-nearby-20pc.json'), (outer, 'hyg-shell-20-50pc.json')]:
    stars.sort(key=lambda x: (x['dist'], x['id']))
    with open('public/data/'+filename, 'w', encoding='utf-8') as out:
        json.dump(stars, out, ensure_ascii=False, separators=(',', ':'))
    print(filename, len(stars), 'stars')
