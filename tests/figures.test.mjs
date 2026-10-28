import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FigureGame,formatYear,lifeBounds,normalizeName} from '../dist/figures-model.js';
const figures=JSON.parse(fs.readFileSync(new URL('../dist/figures-data.json',import.meta.url))).figures;

test('figure pool has distinct sourced life clues, real coordinates and unambiguous accepted names',()=>{
  assert.equal(figures.length,200);assert.equal(new Set(figures.map(f=>f.id)).size,200);
  const names=new Map(),signatures=new Set();
  for(const figure of figures){
    assert.ok(figure.name&&Array.isArray(figure.aliases));assert.ok(figure.sources.length);
    assert.ok(figure.birth.year<=figure.death.year);assert.ok(figure.death.year<=2026);
    for(const event of [figure.birth,figure.death]){
      assert.ok(Number.isInteger(event.year)&&event.year!==0);assert.ok(event.place);
      assert.equal(event.coordinates.length,2);assert.ok(event.coordinates.every(Number.isFinite));
      assert.ok(Math.abs(event.coordinates[0])<=180&&Math.abs(event.coordinates[1])<=85);
      for(const key of ['approximate','locationApproximate'])assert.ok(event[key]===undefined||typeof event[key]==='boolean');
    }
    for(const source of figure.sources){assert.ok(source.title);assert.equal(new URL(source.url).protocol,'https:');}
    for(const name of [figure.name,...figure.aliases]){
      const key=normalizeName(name);assert.ok(key);
      assert.ok(!names.has(key)||names.get(key)===figure.id,`${name} is ambiguous`);names.set(key,figure.id);
    }
    const signature=JSON.stringify([figure.birth.year,figure.birth.coordinates,figure.death.year,figure.death.coordinates]);
    assert.ok(!signatures.has(signature),`${figure.name}: identical clues`);signatures.add(signature);
    const game=new FigureGame([figure]);game.next();
    for(const alias of [figure.name,...figure.aliases]){assert.equal(game.guess(alias),true);assert.equal(game.won,true);game.next();}
  }
  assert.ok(figures.filter(f=>f.birth.coordinates[0]>50).length>=20,'Asian coverage');
  assert.ok(figures.some(f=>f.birth.coordinates[1]<0),'Southern hemisphere coverage');
  assert.ok(figures.filter(f=>f.birth.year<1500).length>=30,'At least 30 ancient or medieval figures');
  assert.ok(figures.filter(f=>f.birth.year<0).length>=5,'Ancient figures with BC dates');
  assert.ok(figures.some(f=>f.birth.coordinates[0]>110&&f.birth.coordinates[1]<-10),'Oceania coverage');
});

test('three distinct wrong guesses reveal the figure and sources; duplicate aliases do not consume attempts',()=>{
  const game=new FigureGame(figures,()=>.5);game.next();
  assert.equal(game.snapshot().answer,undefined);assert.equal(game.snapshot().remaining,3);
  assert.ok(game.snapshot().birth.place&&game.snapshot().death.place);
  assert.throws(()=>game.next());assert.throws(()=>game.guess('  '));assert.throws(()=>game.guess('!!!'));
  const wrong=figures.find(f=>f.id!==game.current.id&&f.aliases.length);
  game.guess(wrong.name);assert.equal(game.guess(wrong.aliases[0]),false);assert.equal(game.guesses.length,1);
  game.guess('An unknown person');assert.equal(game.guess('AN UNKNOWN PERSON!'),false);assert.equal(game.done,false);
  game.guess('Another unknown person');assert.equal(game.done,true);assert.equal(game.won,false);assert.equal(game.snapshot().remaining,0);
  assert.equal(game.snapshot().answer.name,game.current.name);assert.ok(game.snapshot().answer.sources.length);
  assert.throws(()=>game.guess(game.current.name));assert.throws(()=>game.reveal());
  game.next();assert.equal(game.guesses.length,0);assert.equal(game.done,false);assert.equal(game.snapshot().answer,undefined);
});

test('correct guesses on each attempt finish immediately; early reveal and ambiguous input are bounded',()=>{
  for(let count=0;count<3;count++){
    const game=new FigureGame(figures);game.next();
    for(let i=0;i<count;i++)game.guess(`Unknown ${i}`);
    game.guess(game.current.name);assert.equal(game.won,true);assert.equal(game.guesses.length,count+1);assert.ok(game.snapshot().answer);
  }
  const a={...figures[0],aliases:['Shared']},b={...figures[1],aliases:['Shared']};
  const game=new FigureGame([a,b]);assert.throws(()=>game.reveal());game.next();
  assert.throws(()=>game.guess('Shared'),/fuller/);assert.equal(game.guesses.length,0);
  game.reveal();assert.equal(game.done,true);assert.equal(game.guesses.length,0);assert.equal(game.won,false);
});

test('names, approximate years and map bounds handle special cases without mutating locations',()=>{
  assert.equal(normalizeName('  SIMÓN   BOLÍVAR! '),'simon bolivar');
  assert.equal(formatYear({year:-551,approximate:true}),'c. 551 BC');assert.equal(formatYear({year:1881}),'1881');
  const a={coordinates:[179,20]},b={coordinates:[-179,-10]},layout=lifeBounds(a,b);
  assert.deepEqual(layout.bounds,[[179,-10],[181,20]]);assert.deepEqual(b.coordinates,[-179,-10]);
  assert.equal(lifeBounds(a,a).shared,true);assert.equal(lifeBounds(a,b).shared,false);
  for(const figure of figures){const view=lifeBounds(figure.birth,figure.death);assert.ok(view.bounds.flat().every(Number.isFinite));assert.ok(view.bounds[1][0]-view.bounds[0][0]<=180);}
});

test('all figures appear before repeating and the deck boundary avoids a repeat',()=>{
  const game=new FigureGame(figures,()=>.3),seen=new Set();let previous;
  for(let i=0;i<figures.length;i++){game.next();assert.ok(!seen.has(game.current.id));seen.add(game.current.id);previous=game.current.id;game.reveal();}
  game.next();assert.notEqual(game.current.id,previous);
  const single=new FigureGame([figures[0]]);single.next();single.reveal();single.next();assert.equal(single.current.id,figures[0].id);
});
