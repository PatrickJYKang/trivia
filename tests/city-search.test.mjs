import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cities} from '../dist/cities.js';
import {createIndex, searchCities} from '../dist/city-search.js';
const rows=JSON.parse(readFileSync(new URL('../dist/city-database.json',import.meta.url)));
const index=createIndex(rows,cities);
test('large database includes every playable city and its aliases',()=>{
 assert.ok(index.length>25000);
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
