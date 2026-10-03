"""Generate clue lookup from UNESCO export and Natural Earth 110m countries.
Usage: python3 scripts/build-heritage-clues.py unesco.json countries.geojson
Natural Earth is public domain; UNESCO derived fields are CC BY-SA 4.0.
"""
import json, math, re, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
raw={int(r['id_no']):r for r in json.load(open(sys.argv[1]))}
features=json.load(open(sys.argv[2]))['features']
polygons=[]
for f in features:
    geometry=f['geometry'];parts=geometry['coordinates'] if geometry['type']=='MultiPolygon' else [geometry['coordinates']]
    for rings in parts:
        ring=rings[0]
        polygons.append((f['properties'],rings,(min(p[0] for p in ring),min(p[1] for p in ring),max(p[0] for p in ring),max(p[1] for p in ring))))
def inside(point,ring):
    x,y=point;hit=False
    for a,b in zip(ring,ring[1:]+ring[:1]):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:hit=not hit
    return hit
vertices=[(p,props) for props,rings,bbox in polygons for p in rings[0]]
def continent(center):
    x,y=center;props=None
    for candidate,rings,(xmin,ymin,xmax,ymax) in polygons:
        if xmin<=x<=xmax and ymin<=y<=ymax and inside(center,rings[0]) and not any(inside(center,r) for r in rings[1:]):props=candidate;break
    if props is None:
        # Offshore reference points use the nearest mapped land, with spherical distance.
        def distance(v):
            px,py=v[0];return math.sin(math.radians(py-y)/2)**2+math.cos(math.radians(y))*math.cos(math.radians(py))*math.sin(math.radians(px-x)/2)**2
        props=min(vertices,key=distance)[1]
    c=props['CONTINENT'];admin=props['ADMIN']
    # Natural Earth attaches one continent to transcontinental sovereign countries.
    if admin=='Russia':c='Asia' if x>=60 else 'Europe'
    if admin=='Turkey':c='Europe' if x<29 and y>40 else 'Asia'
    if admin=='Kazakhstan':c='Asia'
    if admin=='Egypt' and x>32.5 and y>27.5:c='Asia'
    if admin=='France' and x<-30:c='South America' if y<10 else 'North America'
    if admin in ['France','United Kingdom'] and (x>100 or x<-100):c='Oceania'
    return c
clues={}
for s in json.load(open(root/'dist/heritage-database.json'))['sites']:
    r=raw[s['id']];criteria=re.findall(r'\(([ivx]+)\)',r['criteria_txt'] or '')
    if not criteria:criteria=list(dict.fromkeys(re.findall(r'[Cc]riteri(?:on|a)\s*\(([ivx]+)\)',(r['description_en'] or '')+' '+(r['justification_en'] or ''))))
    assert criteria, s['id']
    c=continent(s['center'])
    if c=='Seven seas (open ocean)':c='Subantarctic islands'
    # Polynesia and the Hawaiian islands are geographically Oceania.
    if s['id']==715 or (s['country']=='United States of America' and s['center'][0]<-150 and s['center'][1]<30):c='Oceania'
    clues[str(s['id'])]={'continent':c,'criteria':criteria}
(root/'scripts/heritage-clues.json').write_text(json.dumps(clues,ensure_ascii=False,indent=2)+'\n')
print('Generated',len(clues),'continent and criteria clues')
