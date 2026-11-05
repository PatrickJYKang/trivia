"""Build label-free SVG clues from the Commons research manifest and originals.

Usage: python3 scripts/build-cricket-grounds.py /path/to/cricket-research/grounds.json
The manifest contains sourcePath, sourceUrl, author and license metadata per file.
"""
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SVG = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
source = Path(sys.argv[1])
grounds = json.loads(source.read_text())
assets = ROOT / 'dist' / 'cricket-outlines'
assets.mkdir(exist_ok=True)
records = []
credits = ['Cricket Grounds — outline artwork', '',
           'Original artwork by XrysD on Wikimedia Commons.',
           'License: Creative Commons Attribution-ShareAlike 4.0 International',
           'https://creativecommons.org/licenses/by-sa/4.0/', '',
           'Adaptation: the Labels group (including lettering converted to paths) was',
           'removed. Geometry and colours of the ground, stands and pitch are retained.',
           'Metadata was replaced with generic attribution to avoid revealing answers.',
           'These adapted SVGs are distributed under CC BY-SA 4.0.',
           'Layouts depict the original diagrams, not necessarily present-day grounds.', '']
for ground in grounds:
    root = ET.parse(ground['sourcePath']).getroot()
    label_groups = [el for el in root.iter() if el.get('id', '').lower().startswith('labels')]
    assert len(label_groups) >= 1, ground['sourceFile']
    for parent in root.iter():
        for child in list(parent):
            tag = child.tag.split('}')[-1]
            if child.get('id', '').lower().startswith('labels') or tag in {'text', 'title', 'desc', 'metadata'}:
                parent.remove(child)
    # The diagrams are standalone vector shapes; reject active/external content.
    for el in root.iter():
        assert el.tag.split('}')[-1] not in {'script', 'foreignObject', 'image', 'a'}
        assert not any(k.lower().startswith('on') for k in el.attrib)
        assert not any(k.split('}')[-1] == 'href' and not v.startswith('#') for k, v in el.attrib.items())
    desc = ET.Element(f'{{{SVG}}}desc')
    desc.text = 'Outline by XrysD; labels removed. CC BY-SA 4.0. Attribution and original source: ../cricket-credits.txt.'
    root.insert(0, desc)
    ET.ElementTree(root).write(assets / ground['asset'], encoding='utf-8', xml_declaration=True)
    record = {
        'id': ground['id'], 'name': ground['name'], 'location': ground['place'],
        'aliases': ground['aliases'], 'image': './cricket-outlines/' + ground['asset'],
        'source': ground['sourceUrl'], 'credit': ', '.join(c['name'] for c in ground.get('contributors', [{'name': ground['author']}])),
        'contributors': ground.get('contributors', [{'name': ground['author'], 'url': ground['authorUrl']}]),
        'license': {'name': ground['license'], 'url': ground['licenseUrl']},
        'originalFile': ground['sourceFile'], 'originalImage': ground['originalUrl'],
        'adaptation': 'Labels removed; geometry and colours retained.'
    }
    records.append(record)
    credits.extend([f"{ground['asset']}: {ground['name']}",
                    f"  Original: {ground['sourceUrl']}",
                    '  Contributors: ' + '; '.join(c['name'] + ' (' + c['url'] + ')' for c in ground.get('contributors', [{'name': ground['author'], 'url': ground['authorUrl']}])),
                    f"  License: {ground['license']} ({ground['licenseUrl']})", ''])
(ROOT / 'dist' / 'cricket-data.json').write_text(json.dumps({
    'version': 1, 'checked': '2026-11-05',
    'scope': f'{len(records)} distinct cricket ground diagrams in XrysD’s Wikimedia Commons uploads. Labels removed for play.',
    'grounds': records
}, ensure_ascii=False, indent=2) + '\n')
(ROOT / 'dist' / 'cricket-credits.txt').write_text('\n'.join(credits))
print(f'Built {len(records)} labelled-source records and unlabelled SVG clues.')
