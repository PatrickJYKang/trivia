import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HistoryGame,formatPeriod} from '../dist/history-model.js';
import {createIndex,searchCities,normalize} from '../dist/city-search.js';

const database=JSON.parse(fs.readFileSync(new URL('../dist/city-database.json',import.meta.url)));
const data=JSON.parse(fs.readFileSync(new URL('../dist/history-data.json',import.meta.url)));
const entries=data.cities;
const index=createIndex(database,entries),rawById=new Map(database.map(row=>[row[0],row]));

test('researched histories have valid city identities, chronological periods and source links',()=>{
  assert.ok(entries.length>=40,'substantial starting collection');
  assert.equal(new Set(entries.map(c=>c.id)).size,entries.length);
  const signatures=new Set();
  for(const city of entries){
    assert.ok(rawById.has(city.id),city.name);assert.ok(city.name&&city.country&&city.note);
    assert.ok(Array.isArray(city.aliases));assert.ok(city.periods.length>=3,city.name);
    assert.ok(city.sources.length>=1,city.name);
    for(const source of city.sources){assert.ok(source.title);assert.equal(new URL(source.url).protocol,'https:');}
    for(const [i,p] of city.periods.entries()){
      assert.ok(Number.isInteger(p.start)&&p.start!==0,city.name);
      assert.ok(p.end===null||Number.isInteger(p.end)&&p.end>=p.start&&p.end!==0,city.name);
      assert.ok(p.label.trim());assert.ok(p.approximate===undefined||typeof p.approximate==='boolean');
      if(i){assert.notEqual(city.periods[i-1].end,null);assert.equal(p.start,city.periods[i-1].end,`${city.name}: unaccounted gap or overlap`);}
      if(p.end===null)assert.equal(i,city.periods.length-1,city.name);
      const text=` ${normalize(p.label)} `;
      for(const name of [city.name,...city.aliases]){
        if(normalize(name).length>2)assert.ok(!text.includes(` ${normalize(name)} `),`${city.name} disclosed by: ${p.label}`);
      }
    }
    assert.equal(city.periods.at(-1).end,null,city.name);
    const signature=JSON.stringify(city.periods);
    assert.ok(!signatures.has(signature),`${city.name}: indistinguishable timeline`);signatures.add(signature);
    assert.ok(searchCities(index,city.name,50).some(c=>c.id===city.id),`${city.name}: searchable`);
    for(const alias of city.aliases)assert.ok(searchCities(index,alias,50).some(c=>c.id===city.id),`${city.name}: alias ${alias}`);
  }
});

test('dates handle BC, AD, approximate and same-year transfers',()=>{
  assert.equal(formatPeriod({start:-27,end:-15}),'27–15 BC');
  assert.equal(formatPeriod({start:-15,end:488}),'15 BC–AD 488');
  assert.equal(formatPeriod({start:600,end:800,approximate:true}),'c. 600–800');
  assert.equal(formatPeriod({start:1803,end:1803}),'1803');
  assert.equal(formatPeriod({start:1955,end:null}),'1955–present');
});

test('answer and sources stay hidden until completion; wrong and duplicate guesses are handled',()=>{
  const game=new HistoryGame(entries,()=>.5);game.next();
  const snapshot=game.snapshot();assert.equal(snapshot.answer,undefined);assert.equal(snapshot.periods.length,1);
  assert.deepEqual(Object.keys(snapshot).sort(),['canReveal','done','guesses','periods','poolSize','round','won']);
  const wrong=entries.filter(c=>c.id!==game.current.id).slice(0,7);
  for(const city of wrong)assert.equal(game.guess(city),true);
  assert.equal(game.guess(wrong[0]),false);assert.equal(game.guesses.length,7);assert.equal(game.done,false);
  assert.throws(()=>game.next());assert.throws(()=>game.guess({id:'invalid',name:'Wrong'}));
  assert.equal(game.guess(game.current),true);assert.equal(game.won,true);assert.equal(game.done,true);
  assert.equal(game.snapshot().answer.id,game.current.id);assert.ok(game.snapshot().answer.sources.length);
  assert.throws(()=>game.guess(wrong[0]));assert.throws(()=>game.giveUp());
  game.next();assert.equal(game.done,false);assert.equal(game.guesses.length,0);assert.equal(game.snapshot().answer,undefined);
  game.giveUp();assert.equal(game.done,true);assert.equal(game.won,false);assert.ok(game.snapshot().answer.note);
});

test('deck avoids repetitions until exhausted and avoids a boundary repeat',()=>{
  const game=new HistoryGame(entries,()=>.25),seen=new Set();
  let previous;
  for(let i=0;i<entries.length;i++){
    game.next();assert.ok(!seen.has(game.current.id));seen.add(game.current.id);previous=game.current.id;game.giveUp();
  }
  game.next();assert.notEqual(game.current.id,previous);assert.equal(game.round,entries.length+1);
  const single=new HistoryGame([entries[0]]);single.next();single.giveUp();single.next();assert.equal(single.current.id,entries[0].id);
});


test('wrong guesses reveal one owner, with manual reveals, full history on completion and reset next round',()=>{
  const game=new HistoryGame(entries,()=>.5);
  assert.throws(()=>game.revealNext());
  game.next();
  const periods=game.current.periods;
  assert.deepEqual(game.snapshot().periods,[{dates:formatPeriod(periods[0]),control:periods[0].label}]);
  const wrong=entries.find(c=>c.id!==game.current.id);
  game.guess(wrong);
  assert.equal(game.snapshot().periods.length,2);
  assert.equal(game.guess(wrong),false);
  assert.equal(game.snapshot().periods.length,2);
  assert.equal(game.guesses.length,1);
  for(let visible=3;visible<=periods.length;visible++){
    assert.equal(game.snapshot().canReveal,true);
    const state=game.revealNext();
    assert.equal(state.periods.length,visible);
    assert.equal(state.periods.at(-1).control,periods[visible-1].label);
    assert.equal(state.guesses.length,1);
    assert.equal(state.answer,undefined);
    assert.equal(state.done,false);
  }
  assert.equal(game.snapshot().canReveal,false);
  assert.equal(game.revealNext().periods.length,periods.length);
  const anotherWrong=entries.find(c=>c.id!==game.current.id&&c.id!==wrong.id);
  game.guess(anotherWrong);
  assert.equal(game.snapshot().periods.length,periods.length);
  assert.equal(game.done,false);
  game.guess(game.current);
  assert.equal(game.won,true);
  assert.throws(()=>game.revealNext());
  game.next();
  assert.equal(game.snapshot().periods.length,1);
  assert.equal(game.guesses.length,0);
  game.giveUp();
  assert.equal(game.snapshot().periods.length,game.current.periods.length);
  assert.equal(game.snapshot().canReveal,false);
  game.next();game.guess(game.current);
  assert.equal(game.snapshot().periods.length,game.current.periods.length);
});
