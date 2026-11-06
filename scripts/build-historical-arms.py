"""Bundle researched historical arms, reviewed SVG lettering edits and source credits.
Usage: python3 scripts/build-historical-arms.py manifest.json [reviewed-edits-directory]
The current-country dataset and artwork are never rewritten by this importer.
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
reviews = {}
if len(sys.argv) > 2:
    for path in Path(sys.argv[2]).glob('report-*.json'):
        entries = json.loads(path.read_text())
        if isinstance(entries, dict): entries = entries.get('countries', entries.get('entries', entries.get('results', [])))
        for entry in entries:
            assert entry['id'] not in reviews, entry['id']
            reviews[entry['id']] = entry
    assert set(reviews) == {e['id'] for e in manifest}, 'Complete the artwork audit for every selected entity.'
assets = ROOT / 'dist' / 'historical-arms-images'
assets.mkdir(exist_ok=True)
records = []
for entry in manifest:
    original = Path(entry['sourcePath'])
    changed = reviews.get(entry['id'], {}).get('changed', False)
    source = Path(sys.argv[2]) / (entry['id'] + '.svg') if changed else original
    root = ET.parse(source).getroot()
    assert root.tag.endswith('svg'), entry['name']
    if changed:
        original_root = ET.parse(original).getroot()
        for attribute in ['viewBox', 'width', 'height']:
            assert original_root.get(attribute) == root.get(attribute), (entry['name'], attribute)
        count = lambda tree, tag: sum(e.tag.split('}')[-1] == tag for e in tree.iter())
        for tag in ['rect', 'image']:
            assert count(root, tag) <= count(original_root, tag), (entry['name'], 'No overlay rectangles or images')
    for element in root.iter():
        tag = element.tag.split('}')[-1]
        assert tag != 'script', entry['name']
        assert not any(k.lower().startswith('on') and k[2:].isalpha() for k in element.attrib), entry['name']
        if tag == 'foreignObject':
            assert element.get('requiredExtensions') == 'http://ns.adobe.com/AdobeIllustrator/10.0/', entry['name']
            assert all(child.tag == '{http://ns.adobe.com/AdobeIllustrator/10.0/}pgfRef' for child in element), entry['name']
        if tag in ['image', 'use', 'foreignObject']:
            assert all(not k.endswith('href') or v.startswith(('#', 'data:')) for e in element.iter() for k, v in e.attrib.items()), entry['name']
    target = assets / (entry['id'] + '.svg')
    shutil.copyfile(source, target)
    if changed: target.write_text('\n'.join(line.rstrip(' \t') for line in target.read_text().splitlines()) + '\n')
    record = {key: entry[key] for key in ['id', 'name', 'aliases', 'period', 'type', 'source', 'credit', 'license', 'note', 'originalFile']}
    if record['credit'] == 'Author information on the original Commons file page' and record['license']['name'] == 'Public domain':
        record['credit'] = 'Wikimedia Commons'
    record['originalImage'] = entry['originalUrl'].split('?')[0]
    record['originalSha256'] = hashlib.sha256(original.read_bytes()).hexdigest()
    record['sha256'] = hashlib.sha256(target.read_bytes()).hexdigest()
    record['image'] = './historical-arms-images/' + target.name + '?v=' + record['sha256'][:10]
    if entry.get('references'): record['references'] = entry['references']
    if entry.get('reference'): record['reference'] = entry['reference']
    elif entry.get('references'): record['reference'] = entry['references'][0]['url']
    if changed:
        assert record['originalSha256'] != record['sha256'], entry['name']
        record['adaptation'] = 'Latin-script entity-name lettering removed.'
    records.append(record)
data = {
    'version': 1, 'checked': '2026-11-05', 'historical': True,
    'scope': 'Selected former countries, city-states, kingdoms, empires, territories and notable historical political entities. Each question uses one sourced representative coat of arms, emblem or seal.',
    'redactionReview': {'reviewed': len(reviews), 'edited': sum(bool(e.get('adaptation')) for e in records)},
    'countries': records,
}
(ROOT / 'dist' / 'historical-arms-data.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
escape = html.escape
cards = []
for entry in records:
    name, credit, source = (escape(str(entry[key])) for key in ['name', 'credit', 'source'])
    license_name, license_url = (escape(entry['license'][key]) for key in ['name', 'url'])
    note = '<p>' + escape(entry['note']) + '</p>' if entry['note'] else ''
    if entry.get('adaptation'): note += '<p>' + escape(entry['adaptation']) + '</p>'
    context = f'<p><a href="{escape(entry["reference"])}">Historical context</a></p>' if entry.get('reference') else ''
    cards.append(f'<article id="{escape(entry["id"])}"><h2>{name}</h2><p>{escape(entry["period"])}</p><p><a href="{source}">Original artwork</a></p><p>{credit}</p><p><a href="{license_url}">{license_name}</a></p>{note}{context}</article>')
head = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Historical Coat of Arms — Image credits</title><link rel="icon" href="https://raw.githubusercontent.com/PatrickJYKang/sports-event-rarity/main/assets/favicon.png"><link rel="stylesheet" href="style.css"><style>main{padding-top:28px;padding-bottom:40px}h1{margin:20px 0}p{font-size:13px;line-height:1.7;color:#626a72}a{overflow-wrap:anywhere}section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}article{padding:18px;background:white;border:1px solid #dce0e3;border-radius:4px;overflow-wrap:anywhere}article h2{font-size:18px}article p{margin:8px 0 0}@media(max-width:600px){section{grid-template-columns:1fr}}</style></head><body><main><a href="arms.html?mode=historical">← Historical Coat of Arms</a><h1>Image credits</h1><p>Historical arms, emblems and seals from Wikimedia Commons. The period and notes identify the representative version used. Many SVGs are modern drawings of historical designs. Readable entity-name lettering in Latin script is removed where present; other artwork and mottos remain. Each image retains its individual licence, with changes listed below.</p><section>'''
(ROOT / 'dist' / 'historical-arms-credits.html').write_text(head + ''.join(cards) + '</section></main></body></html>\n')
if reviews:
    safe = [{key: e[key] for key in ['id', 'name', 'changed', 'method', 'note'] if key in e} for e in reviews.values()]
    (ROOT / 'scripts' / 'historical-arms-redaction-review.json').write_text(json.dumps({'reviewed': len(safe), 'countries': safe}, ensure_ascii=False, indent=2) + '\n')
print(f'Bundled {len(records)} historical entities and their source credits.')
