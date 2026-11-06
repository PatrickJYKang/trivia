import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {ArmsGame,normalizeCountry} from '../dist/arms-model.js';
import {countryIndex,searchCountries,exactCountry} from '../dist/country-search.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/historical-arms-data.json',import.meta.url)));
const entries=data.countries,index=countryIndex(entries);
test('historical pool has 88 distinct sourced entities, dated versions and reviewed local artwork',()=>{
  assert.equal(data.historical,true);assert.equal(entries.length,88);assert.equal(new Set(entries.map(e=>e.id)).size,88);
  assert.equal(data.redactionReview.reviewed,88);assert.equal(data.redactionReview.edited,5);
  const originals=new Set();
  for(const entry of entries){
    assert.ok(entry.name&&entry.period&&entry.type&&entry.note);assert.ok(Array.isArray(entry.aliases));
    assert.ok(entry.credit&&!entry.credit.includes('Author information'));assert.ok(entry.license.name);
    for(const url of [entry.source,entry.originalImage,entry.license.url,entry.reference])assert.equal(new URL(url).protocol,'https:');
    assert.equal(new URL(entry.source).hostname,'commons.wikimedia.org');
    assert.match(entry.image,/^\.\/historical-arms-images\/historical-arms-\d{3}\.svg\?v=[a-f0-9]{10}$/);
    const svg=fs.readFileSync(new URL('../dist/'+entry.image.split('?')[0],import.meta.url));
    assert.match(svg.toString(),/<svg\b/);assert.equal(crypto.createHash('sha256').update(svg).digest('hex'),entry.sha256);
    assert.match(entry.originalSha256,/^[a-f0-9]{64}$/);assert.ok(!originals.has(entry.originalSha256),entry.name);originals.add(entry.originalSha256);
    assert.ok(entry.image.endsWith(entry.sha256.slice(0,10)));
    if(entry.adaptation)assert.notEqual(entry.sha256,entry.originalSha256);else assert.equal(entry.sha256,entry.originalSha256);
  }
  for(const name of ['Republic of Venice','Republic of Genoa','Republic of Florence','Free City of Danzig','Qing dynasty','Gran Colombia','Republic of Texas','Kingdom of Hawaii','Orange Free State','Kingdom of Fiji'])assert.ok(entries.some(e=>e.name===name),name);
  assert.ok(entries.filter(e=>/republic|city|state/.test(e.type)).length>=10);
});
test('every historical answer resolves through search and by canonical name, with deliberate ambiguous aliases requiring selection',()=>{
  const names=new Map();
  for(const entry of entries)for(const name of [entry.name,...entry.aliases]){
    const key=normalizeCountry(name),ids=names.get(key)||new Set();ids.add(entry.id);names.set(key,ids);
  }
  for(const entry of entries){
    assert.equal(exactCountry(index,entry.name)?.id,entry.id,entry.name);assert.equal(searchCountries(index,entry.name)[0].id,entry.id);
    for(const alias of [entry.name,...entry.aliases]){
      assert.ok(searchCountries(index,alias).some(e=>e.id===entry.id),alias);
      const game=new ArmsGame(entries,()=>.5,{noun:'entity',article:'an'});game.deck=[entry];game.next();
      if(names.get(normalizeCountry(alias)).size>1){assert.throws(()=>game.guess(alias),/specific/);assert.equal(game.guesses.length,0);}
      else{game.guess(alias);assert.equal(game.won,true,alias);}
    }
  }
  for(const query of ['France','Hawaii','Yugoslavia']){assert.equal(exactCountry(index,query),null);assert.ok(searchCountries(index,query).length>=2);}
  assert.equal(searchCountries(index,'HRE')[0].name,'Holy Roman Empire');assert.equal(searchCountries(index,'USSR')[0].name,'Soviet Union');
});
test('historical rounds keep periods hidden until completion, allow unlimited guesses, reveal and reset without repeats',()=>{
  const game=new ArmsGame(entries,()=>.3,{noun:'entity',article:'an'}),seen=new Set();
  for(let i=0;i<entries.length;i++){
    game.next();assert.ok(!seen.has(game.current.id));seen.add(game.current.id);assert.equal(game.snapshot().answer,undefined);assert.equal(game.snapshot().period,undefined);
    if(i===0){for(let n=0;n<7;n++)game.guess('Unknown entity '+n);assert.equal(game.done,false);assert.equal(game.guess('UNKNOWN ENTITY 0!'),false);}
    game.reveal();assert.equal(game.snapshot().answer.period,game.current.period);assert.ok(game.snapshot().answer.source);
  }
  const previous=game.current.id;game.next();assert.notEqual(game.current.id,previous);assert.equal(game.guesses.length,0);assert.equal(game.snapshot().answer,undefined);
});
