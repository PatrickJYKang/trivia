import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cityRegions,createRegionalCities,readCityVariant,cityVariantUrl} from '../dist/city-regions.js';
import {cities} from '../dist/cities.js';
import {createIndex,searchCities} from '../dist/city-search.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/city-database.json',import.meta.url)));
const raw=new Map(rows.map(r=>[r[0],r])),index=createIndex(rows,cities);
test('nine curated regional decks have the requested sizes, eligible cities, valid maps and searchable identities',()=>{
 assert.equal(Object.keys(cityRegions).length,9);
 const all=new Set();
 for(const [key,region] of Object.entries(cityRegions)){
  const pool=createRegionalCities(rows,key),expected=key==='east-asia'?65:['us-canada','western-central-europe'].includes(key)?55:35;
  assert.equal(pool.length,expected,key);assert.equal(new Set(pool.map(c=>c.id)).size,expected);
  assert.deepEqual(createRegionalCities([...rows].reverse(),key),pool);
  for(const city of pool){
   assert.ok(!all.has(city.id),`Overlapping region city ${city.name}`);all.add(city.id);
   assert.ok(region.countries.includes(raw.get(city.id)[2]),city.name);assert.notEqual(raw.get(city.id)[8],'PPLX');
   assert.ok(city.center.every(Number.isFinite));assert.ok(Math.abs(city.center[0])<=180&&Math.abs(city.center[1])<85);assert.ok(city.zoom>=9&&city.zoom<=12.5);
   assert.ok(searchCities(index,city.name).some(c=>c.id===city.id),city.name);
  }
 }
 assert.equal(all.size,385);
});
test('East Asia includes China, Japan, both Koreas, Taiwan, Mongolia and Southeast Asia; UK covers four nations',()=>{
 const east=new Set(cityRegions['east-asia'].ids.map(id=>raw.get(id)[2]));
 for(const code of ['CN','JP','KR','KP','TW','MN','HK','MO','TH','VN','KH','LA','MM','MY','SG','ID','PH'])assert.ok(east.has(code),code);
 assert.deepEqual(new Set(cityRegions.uk.ids.map(id=>raw.get(id)[3])),new Set(['England','Scotland','Wales','Northern Ireland']));
});
test('bookmarked regions, worldwide modes, and invalid links resolve predictably',()=>{
 for(const key of Object.keys(cityRegions)){assert.deepEqual(readCityVariant(cityVariantUrl(key)),{region:key,hard:false});assert.deepEqual(readCityVariant(`?mode=hard&region=${key}`),{region:key,hard:false});}
 assert.deepEqual(readCityVariant('?mode=hard'),{region:null,hard:true});assert.deepEqual(readCityVariant('?region=missing'),{region:null,hard:false});assert.deepEqual(readCityVariant('?region=__proto__'),{region:null,hard:false});assert.equal(cityVariantUrl('world'),'./');
});
