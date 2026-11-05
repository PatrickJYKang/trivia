import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CricketGame,normalizeGround} from '../dist/cricket-model.js';
const grounds=JSON.parse(fs.readFileSync(new URL('../dist/cricket-data.json',import.meta.url))).grounds;

test('all 27 sourced cricket outlines exist without label layers, and every accepted name resolves uniquely',()=>{
  assert.equal(grounds.length,27);assert.equal(new Set(grounds.map(g=>g.id)).size,27);
  const names=new Map(),images=new Set();
  for(const ground of grounds){
    assert.ok(ground.name&&ground.location&&ground.aliases.length);assert.ok(ground.credit.includes('XrysD'));
    assert.equal(new URL(ground.source).hostname,'commons.wikimedia.org');assert.equal(ground.license.name,'CC BY-SA 4.0');
    assert.ok(!images.has(ground.image));images.add(ground.image);
    const svg=fs.readFileSync(new URL('../dist/'+ground.image,import.meta.url),'utf8');
    assert.match(svg,/<svg/);assert.match(svg,/<path/);assert.match(svg,/CC BY-SA 4.0/);
    assert.doesNotMatch(svg,/id="[Ll]abels[^"<>]*"|<text\b|<script\b|<image\b|<foreignObject\b/);
    assert.ok(!svg.toLowerCase().includes(ground.name.toLowerCase()));
    const game=new CricketGame([ground]);game.next();
    for(const name of [ground.name,...ground.aliases]){
      const normalized=normalizeGround(name);assert.ok(!names.has(normalized)||names.get(normalized)===ground.id,name);names.set(normalized,ground.id);
      assert.equal(game.guess(name),true);assert.equal(game.won,true);game.next();
    }
  }
  assert.ok(grounds.some(g=>g.location.includes('India')));assert.ok(grounds.some(g=>g.location.includes('Rwanda')));assert.ok(grounds.some(g=>g.location.includes('New Zealand')));
});

test('wrong guesses remain unlimited, duplicates consume no attempt, and identities stay hidden until completion',()=>{
  const game=new CricketGame(grounds,()=>.5);game.next();
  assert.equal(game.snapshot().answer,undefined);assert.throws(()=>game.next());
  const wrong=grounds.find(g=>g.id!==game.current.id);
  game.guess(wrong.name);assert.equal(game.guess(wrong.aliases[0]),false);
  for(let i=0;i<8;i++)game.guess('Unknown ground '+i);
  assert.equal(game.done,false);assert.equal(game.guesses.length,9);assert.equal(game.snapshot().answer,undefined);
  assert.equal(game.guess('UNKNOWN GROUND 0!'),false);
  game.guess(game.current.aliases[0]);assert.equal(game.won,true);assert.equal(game.snapshot().answer.name,game.current.name);
  assert.ok(game.snapshot().answer.source);assert.throws(()=>game.guess(game.current.name));assert.throws(()=>game.reveal());
  game.next();assert.equal(game.done,false);assert.equal(game.guesses.length,0);assert.equal(game.snapshot().answer,undefined);
});

test('give up reveals the answer and aliases tolerate case, accents and punctuation without accepting partial substrings',()=>{
  assert.equal(normalizeGround(' LORD’S! '),'lords');assert.equal(normalizeGround('Éden  Park'),'eden park');assert.equal(normalizeGround('The M.C.G.'),'mcg');
  assert.throws(()=>new CricketGame([]));const game=new CricketGame(grounds);assert.throws(()=>game.reveal());game.next();
  for(const value of ['', '!!!', null, 'x'.repeat(151)])assert.throws(()=>game.guess(value));
  assert.equal(game.guesses.length,0);game.reveal();assert.equal(game.won,false);assert.equal(game.snapshot().answer.name,game.current.name);
  const lord=grounds.find(g=>g.name==='Lord’s'),single=new CricketGame([lord]);single.next();single.guess('lordship');assert.equal(single.done,false);single.guess('LORDS');assert.equal(single.won,true);
  const ambiguous=new CricketGame([{...grounds[0],aliases:['County Ground']},{...grounds[1],aliases:['County Ground']}]);ambiguous.next();assert.throws(()=>ambiguous.guess('County Ground'),/specific/);assert.equal(ambiguous.guesses.length,0);
});

test('shuffled deck visits every ground before repeating and avoids a boundary repeat',()=>{
  const game=new CricketGame(grounds,()=>.3),seen=new Set();let previous;
  for(let i=0;i<grounds.length;i++){game.next();assert.ok(!seen.has(game.current.id));seen.add(game.current.id);previous=game.current.id;game.reveal();}
  game.next();assert.notEqual(game.current.id,previous);
  const single=new CricketGame([grounds[0]]);single.next();single.reveal();single.next();assert.equal(single.current.id,grounds[0].id);
});
