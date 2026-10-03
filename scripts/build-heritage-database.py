"""Build the local game data from UNESCO DataHub's whc001 JSON export.
Usage: python3 scripts/build-heritage-database.py /path/to/export.json
Derived data: UNESCO, CC BY-SA 4.0. See README for source and transformations.
"""
import html, json, math, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
EASY = [252,274,86,438,668,483,373,80,307,166,75,28,154,447,326,404,592,642,314,83,286,91,174,394,600,320,488,426,95,616,356,202,114,88,87,23,278,18,364,509,156,39,403,1,308,409,303,145,64,414,411,129,366,241,242,243,441,439,440,547,637,640,1418,775,776,688,870,1324,1483,609,421,551,148,121,120,1100,715,208,1588,916,700,31,672,661,1264,813,811,517,455,393,395,728,784,996,98,369,37,183,78,30]
# Familiar names plus focused crops for properties whose listed point/area is broad.
OVERRIDES = {
252: {'center':[78.0421,27.1751],'zoom':16},
274: {'center':[-72.5451,-13.1631],'zoom':16,'aliases':['Machu Picchu']},
86: {'center':[31.1339,29.9792],'zoom':15,'aliases':['Pyramids of Giza','Giza Pyramids','Great Pyramid','Sphinx']},
438: {'zoom':15,'aliases':['Great Wall of China','Badaling']},
668: {'center':[103.867,13.4125],'zoom':15,'aliases':['Angkor Wat']},
373: {'zoom':16,'aliases':['Stonehenge','Avebury']},
80: {'zoom':16,'aliases':['Mont Saint Michel']},
447: {'center':[131.0369,-25.3444],'zoom':13,'aliases':['Uluru','Ayers Rock','Kata Tjuta']},
326: {'zoom':15},
320: {'center':[2.1744,41.4036],'zoom':16,'aliases':['Sagrada Familia','Park Guell','Gaudi']},
439: {'center':[116.3972,39.9163],'zoom':15,'aliases':['Forbidden City','Mukden Palace']},
441: {'aliases':['Terracotta Army','Terracotta Warriors']},
440: {'zoom':15},
394: {'zoom':13,'aliases':['Venice']},
87: {'center':[32.6573,25.7188],'zoom':15,'aliases':['Luxor','Karnak','Valley of the Kings','Thebes']},
303: {'center':[-54.4367,-25.6953],'zoom':13,'aliases':['Iguazu Falls','Iguassu Falls']},
64: {'center':[-89.6237,17.222],'zoom':15},
242: {'zoom':16},
243: {'zoom':16},
18: {'zoom':16,'aliases':['Lalibela']},
1418: {'zoom':12,'aliases':['Mount Fuji','Fuji','富士山']},
688: {'center':[135.785,34.9949],'zoom':15,'aliases':['Kyoto','Kiyomizu dera']},
1100: {'center':[-43.2105,-22.9519],'zoom':14,'aliases':['Rio de Janeiro','Christ the Redeemer','Corcovado']},
715: {'aliases':['Easter Island','Rapa Nui','Moai']},
208: {'aliases':['Bamiyan','Buddhas of Bamiyan']},
700: {'aliases':['Nazca Lines','Nasca Lines']},
120: {'aliases':['Mount Everest','Everest']},
775: {'aliases':['Hiroshima','Atomic Bomb Dome','Genbaku Dome']},
776: {'aliases':['Miyajima','Itsukushima']},
661: {'aliases':['Himeji Castle']},
509: {'zoom':14,'aliases':['Victoria Falls']},
308: {'zoom':12},
154: {'zoom':9},
}
def clean(value):
    return ' '.join(html.unescape(re.sub(r'<[^>]+>', ' ', value or '')).split())
rows=json.loads(Path(sys.argv[1]).read_text())
result=[]
missing=[]
for row in rows:
    id=int(row['id_no'])
    # A serial property is one answer; a single representative location is pictured.
    components=re.findall(r'\{name: (.*?), ref: .*?, latitude: ([-\d.]+), longitude: ([-\d.]+)\}',row.get('components_list') or '')
    coord=row.get('coordinates')
    if not coord and components:
        coord={'lon':float(components[0][2]),'lat':float(components[0][1])}
    if not coord:
        missing.append({'id':id,'name':clean(row['name_en'])});continue
    count=max(1,row.get('components_count') or 1)
    area=max(1,(row.get('area_hectares') or 100)/count)
    width=max(900,math.sqrt(area*10000)*1.8)
    zoom=max(8,min(16,math.log2(40075016.686*math.cos(math.radians(coord['lat']))*900/(512*width))))
    aliases=[clean(row.get('name_'+lang)) for lang in ['fr','es','ru','ar','zh']]
    aliases += [clean(c[0]) for c in components]
    override=OVERRIDES.get(id,{})
    site={'id':id,'name':clean(row['name_en']),'country':', '.join(row['states_names']), 'category':row['category'],'year':row['date_inscribed'],'center':[coord['lon'],coord['lat']],'zoom':round(zoom,2),'components':count,'easy':id in EASY,'aliases':list(dict.fromkeys(x for x in aliases+override.get('aliases',[]) if x))}
    site.update({k:v for k,v in override.items() if k!='aliases'})
    result.append(site)
assert len(EASY)==100 and len(set(EASY))==100
assert sum(x['easy'] for x in result)==100
result.sort(key=lambda x:x['id'])
output={'source':'https://data.unesco.org/explore/dataset/whc001/','retrieved':'2026-10-02','license':'CC BY-SA 4.0','sourceCount':len(rows),'omitted':missing,'sites':result}
(ROOT/'dist/heritage-database.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n')
print(f'{len(result)} playable sites, {sum(x["easy"] for x in result)} easy; {len(missing)} missing coordinates')
