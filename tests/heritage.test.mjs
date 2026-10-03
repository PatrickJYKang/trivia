import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHeritageIndex,HeritageRound,heritageZoom} from '../dist/heritage-model.js';
import {searchCities} from '../dist/city-search.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/heritage-database.json',import.meta.url)));
const sites=data.sites,index=createHeritageIndex(sites);
test('full mapped list and a curated 100-site easy pool, including ruins and all categories',()=>{
 assert.equal(sites.length+data.omitted.length,data.sourceCount);assert.equal(sites.length,1272);
 assert.equal(new Set(sites.map(s=>s.id)).size,sites.length);assert.equal(sites.filter(s=>s.easy).length,100);
 assert.deepEqual(new Set(sites.map(s=>s.category)),new Set(['Cultural','Natural','Mixed']));
 for(const id of [23,278,208])assert.ok(sites.find(s=>s.id===id)?.easy);
 for(const s of sites){assert.ok(s.name&&!s.name.includes('<'));assert.ok(s.country);assert.ok(s.center.every(Number.isFinite));assert.ok(Math.abs(s.center[0])<=180&&Math.abs(s.center[1])<85);assert.ok(s.zoom>=8&&s.zoom<=16);assert.ok(searchCities(index,s.name).some(r=>r.id===s.id),s.name);assert.ok(heritageZoom(s,0,390)>heritageZoom(s,1,390));assert.ok(heritageZoom(s,1,390)>heritageZoom(s,2,390));}
});
test('familiar names, local-language names and component names select the parent UNESCO property',()=>{
 for(const [q,id] of [['Giza Pyramids',86],['Angkor Wat',668],['Sagrada Familia',320],['Nazca Lines',700],['Machu Picchu',274],['Buddhas of Bamiyan',208],['Taj Mahal India',252],['富士山',1418]])assert.ok(searchCities(index,q).some(s=>s.id===id),q);
 assert.deepEqual(searchCities(index,'x'),[]);assert.deepEqual(searchCities(index,'zzqq_nonexistent'),[]);
});
test('three misses keep the round open at zero, correct practice guess never restores points',()=>{
 const r=new HeritageRound({id:252});assert.equal(r.points,3);r.guess(1);assert.equal(r.points,2);r.guess(1);assert.equal(r.points,1);r.guess(1);assert.equal(r.done,false);assert.equal(r.points,0);r.guess(1);assert.equal(r.done,false);r.guess(252);assert.equal(r.won,true);assert.equal(r.earned,0);r.guess(252);assert.equal(r.earned,0);
});
test('correct guesses at each level and voluntary give up',()=>{
 for(let level=0;level<3;level++){const r=new HeritageRound({id:252});for(let i=0;i<level;i++)r.reveal();r.guess(252);assert.equal(r.earned,3-level);assert.equal(r.done,true);}
 const r=new HeritageRound({id:252});r.reveal();r.reveal();r.reveal();assert.equal(r.done,true);assert.equal(r.won,false);assert.equal(r.earned,0);
});
