import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cities} from '../dist/cities.js';
import {createIndex, searchCities} from '../dist/city-search.js';
const rows=JSON.parse(readFileSync(new URL('../dist/city-database.json',import.meta.url)));
const index=createIndex(rows,cities);
test('large database includes every playable city and its aliases',()=>{
 assert.ok(index.length>25000);
 assert.equal(cities.length,100);
 assert.equal(new Set(cities.map(c=>c.id)).size,100);
 for(const city of cities){
   const record=rows.find(r=>r[0]===city.id);assert.ok(record,city.name);
   assert.ok(Math.abs(record[6]-city.center[1])<.5,city.name);
   assert.ok(Math.abs(record[7]-city.center[0])<.5,city.name);
   for(const name of [city.name,...city.aliases]) assert.ok(searchCities(index,name).some(r=>r.id===city.id),name);
 }
});
test('accent, local names, country qualification and ambiguous names',()=>{
 assert.equal(searchCities(index,'sao paulo')[0].id,3448439);
 assert.equal(searchCities(index,'Venezia')[0].id,3164603);
 assert.equal(searchCities(index,'Paris France')[0].id,2988507);
 assert.ok(searchCities(index,'London').length>1);
 assert.equal(searchCities(index,'東京')[0].id,1850147);
 assert.deepEqual(searchCities(index,'x'),[]);
 assert.deepEqual(searchCities(index,'zzzzzzzzzzzzz'),[]);
});

test('hard mode has a broad searchable deck with valid framing and no districts',async()=>{
 const {createHardCities}=await import('../dist/hard-cities.js');
 const hard=createHardCities(rows);
 assert.equal(hard.length,1000);
 assert.deepEqual(createHardCities([...rows].reverse()).map(c=>c.id),hard.map(c=>c.id));
 assert.ok(new Set(hard.map(c=>c.country)).size>150);
 assert.equal(new Set(hard.map(c=>c.id)).size,hard.length);
 const raw=new Map(rows.map(r=>[r[0],r]));
 const searchable=new Set(index.map(c=>c.id));
 const standard=new Set(cities.map(c=>c.id));
 assert.equal(hard.filter(c=>!standard.has(c.id)).length,900);
 for(const c of cities)assert.ok(hard.some(h=>h.id===c.id));
 for(const c of hard){
   assert.ok(searchable.has(c.id));
   assert.ok(standard.has(c.id)||raw.get(c.id)[4]>=100000);
   assert.notEqual(raw.get(c.id)[8],'PPLX');
   assert.ok(c.zoom>=9&&c.zoom<=12.5&&Number.isFinite(c.zoom));
   assert.ok(Math.abs(c.center[0])<=180&&Math.abs(c.center[1])<=85);
 }
 const samples=createHardCities([[1,'A','US','',100000,[],0,10,'PPL'],[2,'B','US','',100000,[],60,10,'PPL'],[3,'District','US','',100000,[],0,10,'PPLX'],[4,'Town','US','',99999,[],0,10,'PPL']]);
 assert.equal(samples.length,2);
 assert.ok(samples[1].zoom<samples[0].zoom);
});
