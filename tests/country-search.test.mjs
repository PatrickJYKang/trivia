import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {countryIndex,searchCountries,exactCountry} from '../dist/country-search.js';
const countries=JSON.parse(fs.readFileSync(new URL('../dist/arms-data.json',import.meta.url))).countries;
const index=countryIndex(countries);
test('country search finds every canonical name and aliases, including accents and abbreviations',()=>{
  assert.equal(index.length,192);
  for(const country of countries){
    assert.equal(searchCountries(index,country.name)[0].id,country.id);
    for(const alias of country.aliases){
      assert.ok(searchCountries(index,alias).some(c=>c.id===country.id),alias);
      if(!['Congo','Korea'].includes(alias))assert.equal(exactCountry(index,alias)?.id,country.id);
    }
  }
  assert.equal(searchCountries(index,'u.s.a.')[0].name,'United States');
  assert.equal(searchCountries(index,'ivo')[0].name,'Côte d’Ivoire');
  assert.equal(searchCountries(index,'cze')[0].name,'Czechia');
  assert.equal(searchCountries(index,'swaz')[0].name,'Eswatini');
  assert.equal(searchCountries(index,'st luc')[0].name,'Saint Lucia');
});
test('ambiguous searches offer distinct countries, while incomplete or unknown queries never resolve as guesses',()=>{
  assert.deepEqual(searchCountries(index,'Congo').map(c=>c.name),['Democratic Republic of the Congo','Republic of the Congo']);
  assert.equal(searchCountries(index,'Korea').length,2);
  for(const query of ['Congo','Korea','fr','zzzz',''])assert.equal(exactCountry(index,query),null);
  assert.equal(exactCountry(index,'Niger').name,'Niger');assert.equal(exactCountry(index,'Nigeria').name,'Nigeria');
  assert.deepEqual(searchCountries(index,''),[]);assert.deepEqual(searchCountries(index,'zzzz'),[]);
  assert.ok(searchCountries(index,'a').length<=8);
  assert.ok(searchCountries(index,'united').every(c=>!('image' in c)&&!('source' in c)));
});
