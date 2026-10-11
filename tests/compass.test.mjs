import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCompassPools,chooseClues,clueLayout,CompassRound,shuffled} from '../dist/compass-model.js';
import {directionTo} from '../dist/guess-history.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/city-database.json',import.meta.url))),pools=createCompassPools(rows);
function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
test('difficulty ranks follow population and stay stable when source rows are reordered',()=>{
 const population=new Map(rows.map(r=>[r[0],r[4]]));
 const expected=[...pools.targets].sort((a,b)=>population.get(b.id)-population.get(a.id)||a.id-b.id);
 assert.deepEqual(pools.clues.map(c=>[c.id,c.difficultyRank]),expected.map((c,i)=>[c.id,i+1]));
 assert.deepEqual(createCompassPools([...rows].reverse()).clues,pools.clues);
});
test('every answer always gets 1–2 top-100 clues and 1–2 rank-500–1000 clues',()=>{
 const mixes=new Set();
 for(const target of pools.targets)for(const seed of [1,17,99]){
  const clues=chooseClues(target,pools.clues,random(target.id+seed));
  const easy=clues.filter(c=>c.difficultyRank<=100).length,hard=clues.filter(c=>c.difficultyRank>=500).length;
  assert.ok(easy>=1&&easy<=2,`${target.name}: ${easy} easy clues`);
  assert.ok(hard>=1&&hard<=2,`${target.name}: ${hard} hard clues`);
  assert.equal(clues.length,5);assert.equal(new Set(clues.map(c=>c.id)).size,5);
  assert.ok(clues.every(c=>c.id!==target.id));
  mixes.add(`${easy}/${hard}`);
 }
 assert.equal(mixes.size,4,'both tier counts vary between one and two');
});
test('broad answer and reference pools with no districts or invalid coordinates',()=>{assert.equal(pools.targets.length,1000);assert.equal(pools.clues.length,1000);assert.deepEqual(new Set(pools.clues.map(c=>c.id)),new Set(pools.targets.map(c=>c.id)));assert.ok(new Set(pools.targets.map(c=>c.code)).size>150);assert.equal(new Set(pools.clues.map(c=>c.id)).size,pools.clues.length);const raw=new Map(rows.map(r=>[r[0],r]));for(const c of pools.clues){assert.ok(c.center.every(Number.isFinite));assert.notEqual(raw.get(c.id)[8],'PPLX');}});
test('random rounds have exactly five distinct references, correct outward bearings and mixed distances',()=>{
 let varied=0;for(const target of shuffled(pools.targets,random(11)).slice(0,80)){const clues=chooseClues(target,pools.clues,random(target.id));assert.equal(clues.length,5);assert.equal(new Set(clues.map(c=>c.id)).size,5);assert.ok(clues.every(c=>c.id!==target.id));for(const c of clues){const expected=directionTo(target.center,c.center);assert.equal(c.bearing,expected.bearing);assert.ok(c.distanceKm>=350&&c.distanceKm<18500);}assert.ok(clues.some(c=>c.distanceKm>=5000));if(new Set(clues.map(c=>c.code)).size>=4)varied++;if(pools.clues.some(c=>c.id!==target.id&&directionTo(target.center,c.center).distanceKm>=350&&directionTo(target.center,c.center).distanceKm<=4000))assert.ok(clues.some(c=>c.distanceKm<=4000));}
 assert.ok(varied>=70,`${varied}/80 rounds had four or more countries`);
 const target=pools.targets[0];assert.notDeepEqual(chooseClues(target,pools.clues,random(1)).map(c=>c.id),chooseClues(target,pools.clues,random(2)).map(c=>c.id));
});
test('labels never overlap within a bank, even with five close bearings, and arrows preserve their bearings',()=>{
 for(const compact of [true,false])for(const bearings of [[1,2,3,4,5],[170,171,175,176,179],[181,182,183,184,185],[0,90,180,270,359],[80,81,82,83,84]]){
 const layout=clueLayout(bearings.map(bearing=>({bearing})),compact);
 for(const side of ['left','right']){const bank=layout.entries.filter(c=>c.side===side).sort((a,b)=>a.labelY-b.labelY);for(let i=0;i<bank.length;i++){assert.ok(bank[i].labelY>=48&&bank[i].labelY<=layout.height-48);if(i)assert.ok(bank[i].labelY-bank[i-1].labelY>=96);}}
 for(const c of layout.entries){const actual=(Math.atan2(c.tip.x-layout.cx,layout.cy-c.tip.y)*180/Math.PI+360)%360;assert.ok(Math.abs(actual-c.bearing)<1e-8);}
 }
});
test('unlimited guesses, duplicate protection, correct city IDs and give up',()=>{const target=pools.targets[0],g=new CompassRound(target,[]);for(const c of pools.targets.slice(1,7))assert.equal(g.guess(c),true);assert.equal(g.done,false);assert.equal(g.guess(pools.targets[1]),false);assert.equal(g.guesses.length,6);g.guess(target);assert.equal(g.done,true);assert.equal(g.won,true);assert.throws(()=>g.guess(target));const next=new CompassRound(target,[]);next.giveUp();assert.equal(next.done,true);assert.equal(next.won,false);assert.equal(next.guesses.length,0);});
