"""Build the documented, CC BY-SA 4.0 HYG 4.0 nearby-star subset.
Usage: python3 scripts/extract-hyg.py path/to/hygdata_v40.csv.gz
"""
import csv, gzip, json, sys
with gzip.open(sys.argv[1], 'rt', encoding='utf-8', newline='') as source:
    stars=[]
    for row in csv.DictReader(source):
        try: dist=float(row['dist']); ra=float(row['ra']); dec=float(row['dec'])
        except (ValueError,TypeError): continue
        if not 0 < dist <= 20: continue
        def num(field):
            try: return float(row[field])
            except (ValueError,TypeError): return None
        stars.append({'id':int(row['id']),'hip':row['hip'] or None,'name':row['proper'] or row['gl'] or ('HIP '+row['hip'] if row['hip'] else 'HD '+row['hd'] if row['hd'] else 'HYG '+row['id']),
                      'ra':ra,'dec':dec,'dist':dist,'mag':num('mag'),'spect':row['spect'] or None,'ci':num('ci')})
stars.sort(key=lambda x:(x['dist'],x['id']))
with open('public/data/hyg-nearby-20pc.json','w',encoding='utf-8') as out:
    json.dump(stars,out,ensure_ascii=False,separators=(',',':'))
print(len(stars),'stars')
