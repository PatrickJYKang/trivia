import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCompassPools,chooseClues,clueLayout,CompassRound,shuffled,mapBearing,clueCandidates} from '../dist/compass-model.js';
import {directionTo} from '../dist/guess-history.js';
import {easyClueIds} from '../dist/compass-notability.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/city-database.json',import.meta.url))),pools=createCompassPools(rows);
function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
test('flat-map directions preserve cardinal directions without date-line wrapping',()=>{
 assert.equal(mapBearing([0,0],[0,30]),0);
 assert.equal(mapBearing([0,0],[30,0]),90);
 assert.equal(mapBearing([0,0],[0,-30]),180);
 assert.equal(mapBearing([0,0],[-30,0]),270);
 assert.equal(mapBearing([179,0],[-179,0]),270);
 assert.equal(mapBearing([-179,0],[179,0]),90);
 assert.equal(mapBearing([12,34],[12,34]),null);
 // This latitude has Mercator northing pi/2, matching 90 degrees longitude.
 assert.ok(Math.abs(mapBearing([0,0],[90,66.51326044311186])-45)<1e-8);
});
test('Qingyang screenshot regression: Colombia and Guinea-Bissau point southwest',()=>{
 const target=pools.clues.find(c=>c.name==='Qingyang');
 const candidates=clueCandidates(target,pools.clues);
 for(const name of ['Barranquilla','Bissau','Dhaka']){
  const city=candidates.find(c=>c.name===name);
  assert.ok(city.bearing>180&&city.bearing<270,`${name}: ${city.bearing}`);
 }
 const beijing=candidates.find(c=>c.name==='Beijing');
 assert.ok(beijing.bearing>0&&beijing.bearing<90);
 const laibin=candidates.find(c=>c.name==='Laibin');
 assert.ok(laibin.bearing>90&&laibin.bearing<180);
 // The old initial great-circle route to Colombia went almost due north.
 const colombia=candidates.find(c=>c.name==='Barranquilla');
 assert.ok(directionTo(target.center,colombia.center).bearing<10);
});
test('editorial notability keeps familiar cities easy independent of population',()=>{
 assert.equal(easyClueIds.length,100);assert.equal(new Set(easyClueIds).size,100);
 assert.deepEqual(new Set(pools.clues.filter(c=>c.difficultyRank<=100).map(c=>c.id)),new Set(easyClueIds));
 for(const name of ['Paris','Rome','Venice','Kyoto','Moscow','Reykjavík'])assert.ok(pools.clues.find(c=>c.name===name)?.difficultyRank<=100,name);
 const population=new Map(rows.map(r=>[r[0],r[4]]));
 const venice=pools.clues.find(c=>c.name==='Venice');
 assert.ok(pools.clues.some(c=>c.difficultyRank>=500&&population.get(c.id)>population.get(venice.id)));
 assert.deepEqual(createCompassPools([...rows].reverse()).clues,pools.clues);
});
test('all 16 independent difficulty/distance quotas work for every answer',()=>{
 const pairings=new Set(),closeEasyCounts=new Set();
 for(const target of pools.targets){
  const distances=pools.clues.filter(c=>c.id!==target.id).map(c=>({id:c.id,...directionTo(target.center,c.center)})).filter(c=>c.bearing!==null&&c.distanceKm>=350&&c.distanceKm<18500).sort((a,b)=>a.distanceKm-b.distanceKm||a.id-b.id);
  const fifth=Math.ceil(distances.length/5),closeIds=new Set(distances.slice(0,fifth).map(c=>c.id)),farIds=new Set(distances.slice(-fifth).map(c=>c.id));
  for(let mix=0;mix<16;mix++){
   let draws=0;const seeded=random(target.id+mix);
   const rng=()=>draws<4?((mix>>draws++)&1)?.75:.25:seeded();
   const clues=chooseClues(target,pools.clues,rng);
   const counts=[clues.filter(c=>c.difficultyRank<=100).length,clues.filter(c=>c.difficultyRank>=500).length,clues.filter(c=>closeIds.has(c.id)).length,clues.filter(c=>farIds.has(c.id)).length];
   assert.deepEqual(counts,[0,1,2,3].map(bit=>1+((mix>>bit)&1)),`${target.name}, mix ${mix}`);
   assert.equal(clues.length,5);assert.equal(new Set(clues.map(c=>c.id)).size,5);
   assert.ok(clues.every(c=>c.id!==target.id));
   for(const c of clues)pairings.add(`${c.difficultyTier}/${c.distanceTier}`);
   if(counts[2]===2)closeEasyCounts.add(clues.filter(c=>closeIds.has(c.id)&&c.difficultyRank<=100).length);
  }
 }
 assert.equal(pairings.size,9,'all difficulty/distance combinations appear');
 assert.deepEqual(closeEasyCounts,new Set([0,1,2]),'two close clues can be both easy, mixed, or neither easy');
});
test('broad answer and reference pools with no districts or invalid coordinates',()=>{assert.equal(pools.targets.length,200);assert.deepEqual(pools.targets,pools.clues.slice(0,200));assert.equal(pools.clues.length,1000);assert.ok(pools.targets.every(c=>c.difficultyRank<=200));assert.ok(new Set(pools.clues.map(c=>c.code)).size>150);assert.equal(new Set(pools.clues.map(c=>c.id)).size,pools.clues.length);const raw=new Map(rows.map(r=>[r[0],r]));for(const c of pools.clues){assert.ok(c.center.every(Number.isFinite));assert.notEqual(raw.get(c.id)[8],'PPLX');}});
test('random rounds have exactly five distinct references, correct outward bearings and mixed distances',()=>{
 let varied=0;for(const target of shuffled(pools.targets,random(11)).slice(0,80)){const clues=chooseClues(target,pools.clues,random(target.id));assert.equal(clues.length,5);assert.equal(new Set(clues.map(c=>c.id)).size,5);assert.ok(clues.every(c=>c.id!==target.id));for(const c of clues){const expected=directionTo(target.center,c.center);assert.equal(c.distanceKm,expected.distanceKm);assert.equal(c.bearing,mapBearing(target.center,c.center));const east=Math.sin(c.bearing*Math.PI/180),north=Math.cos(c.bearing*Math.PI/180);if(c.center[0]!==target.center[0])assert.equal(Math.sign(east),Math.sign(c.center[0]-target.center[0]));if(c.center[1]!==target.center[1])assert.equal(Math.sign(north),Math.sign(c.center[1]-target.center[1]));assert.ok(c.distanceKm>=350&&c.distanceKm<18500);}assert.ok(clues.some(c=>c.distanceKm>=5000));if(new Set(clues.map(c=>c.code)).size>=4)varied++;assert.ok(clues.some(c=>c.distanceTier==='close'));assert.ok(clues.some(c=>c.distanceTier==='far'));}
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
