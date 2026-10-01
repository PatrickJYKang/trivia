"""Build a compact GeoNames search index: python3 scripts/build-city-database.py cities15000.zip admin1CodesASCII.txt"""
import json, sys, zipfile
from pathlib import Path
admin = {}
for line in Path(sys.argv[2]).read_text().splitlines():
    f = line.split('\t')
    admin[f[0]] = f[1]
rows = []
with zipfile.ZipFile(sys.argv[1]) as archive:
    for line in archive.read('cities15000.txt').decode().splitlines():
        f = line.split('\t')
        rows.append([int(f[0]), f[1], f[8], admin.get(f[8]+'.'+f[10], ''), int(f[14]), list(dict.fromkeys([f[2], *f[3].split(',')])), float(f[4]), float(f[5])])
rows.sort(key=lambda r: -r[4])
out = Path(__file__).resolve().parents[1] / 'dist/city-database.json'
out.write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')))
print(f'{len(rows):,} cities; {out.stat().st_size:,} bytes')
