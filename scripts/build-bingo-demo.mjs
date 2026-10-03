// Fixed demos, generated offline from the checked-in GeoNames snapshot.
import fs from 'node:fs';
import {cities as standard} from '../dist/cities.js';
import {cityRegions} from '../dist/city-regions.js';
import {categories,cardTemplates} from '../dist/bingo-model.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/city-database.json',import.meta.url)));
const ids=new Set([...standard.map(c=>c.id),...Object.values(cityRegions).flatMap(r=>r.ids)]);
const continents={};
for(const line of fs.readFileSync(process.argv[2],'utf8').split('\n')){if(!line||line.startsWith('#'))continue;const r=line.split('\t');continents[r[0]]=r[8];}
const overrides=new Map(standard.map(c=>[c.id,c.name]));
const cities=rows.filter(r=>ids.has(r[0])).map(([id,name,code,region,population,aliases,lat,lng,feature])=>({id,name:overrides.get(id)||name,code,population,lat,lng,capital:feature==='PPLC',continent:code==='RU'?(lng>=60?'AS':'EU'):continents[code]}));
function shuffled(list,seed){list=[...list];for(let i=list.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[list[i],list[j]]=[list[j],list[i]];}return list;}
const cards=cardTemplates.map((template,n)=>{
 const eligible=cities.filter(c=>n===1?c.continent==='EU':n===2?c.continent==='AS':n===3?['AF','NA','SA'].includes(c.continent):true);
 const pool=shuffled(eligible,1907+n*313);const owner=new Map(),assigned=[];
 function match(cell,seen){for(const city of pool){if(seen.has(city.id)||!categories[template.categories[cell]].test(city))continue;seen.add(city.id);if(!owner.has(city.id)||match(owner.get(city.id),seen)){owner.set(city.id,cell);assigned[cell]=city;return true;}}return false;}
 for(let i=0;i<16;i++)if(!match(i,new Set()))throw Error(`Unsolvable card ${n+1}`);
 const selected=new Set(assigned.map(c=>c.id));
 const extras=pool.filter(c=>!selected.has(c.id)&&template.categories.some(key=>categories[key].test(c))).slice(0,16);
 const deck=shuffled([...assigned,...extras].map(c=>c.id),879+n*47);
 return {...template,deck};
});
const used=new Set(cards.flatMap(c=>c.deck));
fs.writeFileSync(new URL('../dist/bingo-data.json',import.meta.url),JSON.stringify({source:'GeoNames cities15000, snapshot 2026-10-01',license:'CC BY 4.0',cards,cities:cities.filter(c=>used.has(c.id))},null,2)+'\n');
console.log(`5 fixed cards, 32 cities per card, ${used.size} distinct cities`);
