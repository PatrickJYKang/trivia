import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {ArmsGame,normalizeCountry} from '../dist/arms-model.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/arms-data.json',import.meta.url)));
const countries=data.countries;

test('national symbols cover 192 current countries with attribution, original checksums and reviewed quiz artwork',()=>{
  assert.equal(countries.length,192);assert.equal(new Set(countries.map(c=>c.id)).size,192);
  const names=new Map();
  assert.equal(data.redactionReview?.reviewed,192);
  assert.ok(countries.filter(c=>c.adaptation).length>=30,'Readable names are removed across the full pool');
  for(const country of countries){
    assert.ok(country.name&&Array.isArray(country.aliases));assert.ok(country.credit);assert.ok(country.license.name);
    if(country.license.name.startsWith('CC ')||country.license.name==='Attribution')assert.ok(!country.credit.includes('Author information'),country.name);
    for(const url of [country.source,country.license.url,country.originalImage])assert.equal(new URL(url).protocol,'https:');
    assert.equal(new URL(country.source).hostname,'commons.wikimedia.org');
    assert.match(country.image,/^\.\/arms-images\/arms-\d{3}\.svg\?v=[a-f0-9]{10}$/);
    const artwork=fs.readFileSync(new URL('../dist/'+country.image.split('?')[0],import.meta.url));
    assert.match(artwork.toString(),/<svg\b/);assert.equal(crypto.createHash('sha256').update(artwork).digest('hex'),country.sha256);
    assert.match(country.originalSha256,/^[a-f0-9]{64}$/);
    assert.ok(country.image.endsWith(country.sha256.slice(0,10)));
    if(country.adaptation){assert.notEqual(country.sha256,country.originalSha256);assert.match(country.adaptation,/country-name lettering removed/);}else assert.equal(country.sha256,country.originalSha256);
    for(const name of [country.name,...country.aliases]){
      const key=normalizeCountry(name),ids=names.get(key)||new Set();ids.add(country.id);names.set(key,ids);
    }
  }
  for(const [name,ids] of names)if(ids.size>1)assert.ok(['congo','korea'].includes(name),name);
  for(const country of countries){
    const game=new ArmsGame(countries);
    game.deck=[country];game.next();
    for(const name of [country.name,...country.aliases]){
      if(names.get(normalizeCountry(name)).size>1)continue;
      assert.equal(game.guess(name),true);assert.equal(game.won,true,name);game.deck=[country];game.next();
    }
  }
  for(const name of ['Japan','France','Afghanistan','Syria','Trinidad and Tobago','Palestine','Vatican City'])assert.ok(countries.some(c=>c.name===name));
  assert.match(countries.find(c=>c.name==='Syria').originalFile,/2025/);
  assert.match(countries.find(c=>c.name==='Trinidad and Tobago').originalFile,/2025/);
  for(const omitted of data.omitted)assert.ok(!countries.some(c=>c.name===omitted));
});

test('guesses are unlimited, duplicates across country aliases do not consume another attempt, answers and notes stay concealed',()=>{
  const game=new ArmsGame(countries,()=>.5);game.next();assert.equal(game.snapshot().answer,undefined);assert.throws(()=>game.next());
  const wrong=countries.find(c=>c.id!==game.current.id&&c.aliases.length&&!c.aliases.includes('Congo')&&!c.aliases.includes('Korea'));
  game.guess(wrong.name);assert.equal(game.guess(wrong.aliases[0]),false);
  for(let i=0;i<8;i++)game.guess('Unknown nation '+i);
  assert.equal(game.done,false);assert.equal(game.guesses.length,9);assert.equal(game.snapshot().answer,undefined);
  game.guess(game.current.name);assert.equal(game.won,true);assert.equal(game.snapshot().answer.name,game.current.name);
  assert.ok(game.snapshot().answer.source);assert.throws(()=>game.reveal());assert.throws(()=>game.guess('France'));
  game.next();assert.equal(game.guesses.length,0);assert.equal(game.snapshot().answer,undefined);assert.equal(game.done,false);
});

test('empty and ambiguous answers do not consume attempts; ordinary alternate country names work without substring matching',()=>{
  const game=new ArmsGame(countries);game.next();
  for(const value of ['', '!!!', null, 'x'.repeat(151), 'Congo', 'Korea'])assert.throws(()=>game.guess(value));
  assert.equal(game.guesses.length,0);
  assert.equal(normalizeCountry('  The U.S.A.  '),'usa');assert.equal(normalizeCountry('CÔTE D’IVOIRE'),'cote divoire');
  const uk=countries.find(c=>c.name==='United Kingdom'),single=new ArmsGame([uk]);single.next();single.guess('England');assert.equal(single.done,false);single.guess('u.k.');assert.equal(single.won,true);
  const niger=countries.find(c=>c.name==='Niger'),near=new ArmsGame([niger]);near.next();near.guess('Nigeria');assert.equal(near.done,false);near.guess('Niger');assert.equal(near.won,true);
});

test('give up shows country, artwork source and relevant emblem note; deck visits every country before repeating',()=>{
  const game=new ArmsGame(countries,()=>.3),seen=new Set();assert.throws(()=>game.reveal());let previous;
  for(let i=0;i<countries.length;i++){game.next();assert.ok(!seen.has(game.current.id));seen.add(game.current.id);previous=game.current.id;game.reveal();assert.equal(game.won,false);assert.equal(game.snapshot().answer.note,game.current.note);}
  game.next();assert.notEqual(game.current.id,previous);
  const single=new ArmsGame([countries[0]]);single.next();single.reveal();single.next();assert.equal(single.current.id,countries[0].id);
});
