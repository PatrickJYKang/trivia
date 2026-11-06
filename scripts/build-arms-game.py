"""Bundle Commons artwork and attribution from the researched national-symbol manifest.
Usage: python3 scripts/build-arms-game.py /path/to/arms-research/manifest.json
SVG artwork is copied unchanged; the manifest supplies sourcePath and public credits.
"""
import hashlib
import html
import json
import shutil
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads(Path(sys.argv[1]).read_text())
assets = ROOT / 'dist' / 'arms-images'
assets.mkdir(exist_ok=True)
records = []
extra_aliases = {
    'Republic of the Congo': ['Congo'],
    'Democratic Republic of the Congo': ['Congo'],
    'North Korea': ['Korea'], 'South Korea': ['Korea'],
    'Ireland': ['Republic of Ireland', 'Eire', 'Éire'],
    'Tanzania': ['United Republic of Tanzania'],
    'Moldova': ['Republic of Moldova'],
    'Papua New Guinea': ['PNG'],
    'Saint Kitts and Nevis': ['St Kitts Nevis'],
    'São Tomé and Príncipe': ['Sao Tome Principe'],
    'Trinidad and Tobago': ['Trinidad & Tobago'],
}
renames = {'Czech Republic': 'Czechia', 'Cape Verde': 'Cabo Verde'}
for country in manifest:
    source = Path(country['sourcePath'])
    root = ET.parse(source).getroot()
    assert root.tag.endswith('svg'), country['name']
    for el in root.iter():
        assert el.tag.split('}')[-1] != 'script', country['name']
        if el.tag.split('}')[-1] == 'foreignObject':
            # Illustrator exports may retain a non-rendering private PGF reference.
            assert el.get('requiredExtensions') == 'http://ns.adobe.com/AdobeIllustrator/10.0/', country['name']
            assert all(child.tag == '{http://ns.adobe.com/AdobeIllustrator/10.0/}pgfRef' for child in el), country['name']
            assert all(not key.endswith('href') or value.startswith('#') for child in el for key, value in child.attrib.items()), country['name']
        assert not any(k.lower().startswith('on') for k in el.attrib), country['name']
        # Links in metadata are attribution; rendered external images would make
        # the bundled clue depend on a separate network resource.
        if el.tag.split('}')[-1] in {'image', 'use'}:
            assert all(not k.endswith('href') or v.startswith(('#', 'data:')) for k, v in el.attrib.items()), country['name']
    filename = Path(country['image']).name
    shutil.copyfile(source, assets / filename)
    record = {key: country[key] for key in ['id', 'name', 'aliases', 'image', 'source', 'credit', 'license', 'note', 'originalFile']}
    if record['credit'] == 'Author information on the original Commons file page' and record['license']['name'] == 'Public domain':
        record['credit'] = 'Wikimedia Commons'
    record['aliases'] = list(dict.fromkeys([*country['aliases'], *extra_aliases.get(country['name'], [])]))
    if country['name'] in renames:
        record['name'] = renames[country['name']]
        record['aliases'].append(country['name'])
    record['originalImage'] = country['originalUrl'].split('?')[0]
    record['sha256'] = hashlib.sha256(source.read_bytes()).hexdigest()
    records.append(record)
data = {
    'version': 1, 'checked': '2026-11-05',
    'scope': 'Current countries: UN members and the two observer states with a selected national coat of arms, emblem or state seal.',
    'gallery': 'https://en.wikipedia.org/wiki/Gallery_of_coats_of_arms_of_sovereign_states',
    'omitted': ['Lebanon', 'Libya', 'Türkiye'],
    'countries': records,
}
(ROOT / 'dist' / 'arms-data.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
escape = html.escape
cards = []
for country in records:
    name, credit, source = (escape(str(country[k])) for k in ['name', 'credit', 'source'])
    license_name, license_url = (escape(country['license'][k]) for k in ['name', 'url'])
    note = '<p>' + escape(country['note']) + '</p>' if country['note'] else ''
    cards.append(f'<article id="{escape(country["id"])}"><h2>{name}</h2><p><a href="{source}">Original artwork</a> · {escape(country["id"])}</p><p>{credit}</p><p><a href="{license_url}">{license_name}</a></p>{note}</article>')
credits = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Coat of Arms — Image credits</title><link rel="icon" href="https://raw.githubusercontent.com/PatrickJYKang/sports-event-rarity/main/assets/favicon.png"><link rel="stylesheet" href="style.css"><style>main{padding-top:28px;padding-bottom:40px}h1{margin:20px 0}p{font-size:13px;line-height:1.7;color:#626a72}a{overflow-wrap:anywhere}section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}article{padding:18px;background:white;border:1px solid #dce0e3;border-radius:4px;overflow-wrap:anywhere}article h2{font-size:18px}article p{margin:8px 0 0}@media(max-width:600px){section{grid-template-columns:1fr}}</style></head><body><main><a href="arms.html">← Coat of Arms</a><h1>Image credits</h1><p>National coats of arms, emblems and state seals from <a href="https://commons.wikimedia.org/">Wikimedia Commons</a>. Artwork is reproduced unchanged, including lettering; files have neutral names for play. Each image retains its individual licence below. The source file page contains full authorship, history and licence details.</p><section>'''
credits += ''.join(cards) + '</section></main></body></html>\n'
(ROOT / 'dist' / 'arms-credits.html').write_text(credits)
print(f'Bundled {len(records)} current country symbols with individual image credits.')
