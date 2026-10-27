import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BattleGame,matchCommander,normalizeCommander} from '../dist/battles-model.js';

const battles=JSON.parse(fs.readFileSync(new URL('../dist/battles-data.json',import.meta.url))).battles;
const fixture={id:'fixture',name:'Test battle',date:'1800',year:1800,winner:0,note:'Test note',sources:[{title:'Source',url:'https://example.com'}],
  sides:[{name:'Side A',belligerents:['A'],commanders:[{name:'José Example',aliases:['Example','Jose']} ]},
    {name:'Side B',belligerents:['B'],commanders:[{name:'Other Commander',aliases:['Other']}]}]};

test('battle collection has clear winners, sourced two-sided rosters and usable aliases',()=>{
  assert.equal(battles.length,45);assert.equal(new Set(battles.map(b=>b.id)).size,battles.length);
  assert.ok(battles.some(b=>b.year<0));assert.ok(battles.some(b=>b.year>1900));
  for(const battle of battles){
    assert.ok(battle.id&&battle.name&&battle.date);assert.ok(Number.isInteger(battle.year)&&battle.year!==0);
    assert.ok(battle.winner===0||battle.winner===1);assert.equal(battle.sides.length,2);assert.ok(battle.sources.length);
    for(const source of battle.sources){assert.ok(source.title);assert.equal(new URL(source.url).protocol,'https:');}
    for(const [i,side] of battle.sides.entries()){
      assert.ok(side.name);assert.ok(side.belligerents.length&&side.belligerents.every(v=>typeof v==='string'&&v.trim()));
      assert.ok(side.commanders.length,battle.name);
      for(const person of side.commanders){
        assert.ok(person.name&&Array.isArray(person.aliases));
        for(const query of [person.name,...person.aliases]){
          const matches=matchCommander(battle,query);
          assert.equal(matches.length,1,`${battle.name}: ambiguous or missing ${query}`);
          assert.equal(matches[0].side,i);
        }
      }
    }
  }
});

test('all score combinations work independently, with either display order',()=>{
  for(const random of [()=>.1,()=>.9])for(const correctWinner of [true,false])for(const commanderSide of ['winner','loser','wrong']){
    const game=new BattleGame([fixture],random);game.next();
    const winner=game.current.winner;
    game.pickWinner(correctWinner?winner:1-winner);
    const name=commanderSide==='wrong'?'Unknown':game.current.sides[commanderSide==='winner'?winner:1-winner].commanders[0].name;
    game.guessCommander(name);
    const expected=(correctWinner?1:0)+(commanderSide==='winner'?3:commanderSide==='loser'?1:0);
    assert.equal(game.score,expected);assert.equal(game.roundPoints,expected);assert.equal(game.stage,'complete');
    assert.throws(()=>game.pickWinner(winner));assert.throws(()=>game.guessCommander(name));assert.equal(game.score,expected);
    game.next();assert.equal(game.score,expected);assert.equal(game.roundPoints,0);assert.equal(game.stage,'winner');
  }
});

test('answers stay hidden until their stage; invalid actions cannot consume attempts or add points',()=>{
  const game=new BattleGame([fixture]);
  assert.throws(()=>game.pickWinner(0));assert.throws(()=>game.guessCommander('Example'));assert.throws(()=>game.skipCommander());
  game.next();const first=game.snapshot();
  assert.equal(first.battle.winner,undefined);assert.equal(first.battle.sides[0].commanders,undefined);assert.equal(first.battle.sources,undefined);
  assert.throws(()=>game.next());assert.throws(()=>game.guessCommander('Example'));assert.throws(()=>game.pickWinner('0'));assert.throws(()=>game.pickWinner(2));
  game.pickWinner(game.current.winner);const middle=game.snapshot();
  assert.equal(middle.battle.winner,game.current.winner);assert.equal(middle.battle.sides[0].commanders,undefined);assert.equal(middle.battle.sources,undefined);
  assert.throws(()=>game.guessCommander('  '));assert.equal(game.stage,'commander');assert.equal(game.score,1);
  game.skipCommander();assert.equal(game.score,1);assert.equal(game.snapshot().commanderAnswer.skipped,true);
  assert.ok(game.snapshot().battle.sides.every(s=>s.commanders.length));assert.ok(game.snapshot().battle.sources.length);
  assert.throws(()=>game.skipCommander());
});

test('name matching tolerates accents and punctuation but rejects ambiguous names without ending the turn',()=>{
  assert.equal(normalizeCommander('  JOSÉ   EXAMPLE! '),'jose example');
  assert.equal(matchCommander(fixture,'jose example')[0].name,'José Example');
  assert.equal(matchCommander(fixture,'Example')[0].name,'José Example');
  const ambiguous={...fixture,sides:fixture.sides.map(side=>({...side,commanders:side.commanders.map(p=>({...p,aliases:[...p.aliases,'Shared']}))}))};
  const game=new BattleGame([ambiguous]);game.next();game.pickWinner(game.current.winner);
  assert.throws(()=>game.guessCommander('Shared'),/ambiguous/);assert.equal(game.stage,'commander');assert.equal(game.score,1);
  game.guessCommander('José Example');assert.equal(game.score,4);
});

test('battle deck visits every battle before repeating, without a boundary repeat',()=>{
  const game=new BattleGame(battles,()=>.3),seen=new Set();let previous;
  for(let i=0;i<battles.length;i++){
    game.next();assert.ok(!seen.has(game.current.id));seen.add(game.current.id);previous=game.current.id;
    game.pickWinner(0);game.skipCommander();
  }
  game.next();assert.notEqual(game.current.id,previous);assert.equal(game.round,battles.length+1);
});
