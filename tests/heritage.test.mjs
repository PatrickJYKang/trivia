import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHeritageIndex,HeritageRound,heritageZoom,CRITERIA} from '../dist/heritage-model.js';
import {searchCities} from '../dist/city-search.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/heritage-database.json',import.meta.url)));
const sites=data.sites,index=createHeritageIndex(sites);
test('full mapped list and a curated 100-site easy pool, including ruins and all categories',()=>{
 assert.equal(sites.length+data.omitted.length,data.sourceCount);assert.equal(sites.length,1272);
 assert.equal(new Set(sites.map(s=>s.id)).size,sites.length);assert.equal(sites.filter(s=>s.easy).length,100);
 assert.deepEqual(new Set(sites.map(s=>s.category)),new Set(['Cultural','Natural','Mixed']));
 for(const id of [23,278,208])assert.ok(sites.find(s=>s.id===id)?.easy);
 for(const s of sites){assert.ok(s.name&&!s.name.includes('<'));assert.ok(s.country);assert.ok(s.center.every(Number.isFinite));assert.ok(Math.abs(s.center[0])<=180&&Math.abs(s.center[1])<85);assert.ok(s.zoom>=8&&s.zoom<=16);assert.ok(searchCities(index,s.name).some(r=>r.id===s.id),s.name);assert.ok(Number.isFinite(heritageZoom(s,390)));assert.ok(['Africa','Asia','Europe','North America','South America','Oceania','Antarctica','Subantarctic islands'].includes(s.continent));assert.ok(s.criteria.length);assert.ok(s.criteria.every(c=>CRITERIA[c]));}
});
test('familiar names, local-language names and component names select the parent UNESCO property',()=>{
 for(const [q,id] of [['Giza Pyramids',86],['Angkor Wat',668],['Sagrada Familia',320],['Nazca Lines',700],['Machu Picchu',274],['Buddhas of Bamiyan',208],['Taj Mahal India',252],['富士山',1418]])assert.ok(searchCities(index,q).some(s=>s.id===id),q);
 assert.deepEqual(searchCities(index,'x'),[]);assert.deepEqual(searchCities(index,'zzqq_nonexistent'),[]);
});
test('four misses reveal hints in order then allow unlimited zero-point guesses',()=>{
 const site={id:252,continent:'Asia',country:'India',criteria:['i']},r=new HeritageRound(site);
 assert.equal(r.points,4);assert.deepEqual(r.clues,{continent:null,country:null,criteria:null});
 r.guess(1);assert.equal(r.points,3);assert.deepEqual(r.clues,{continent:'Asia',country:null,criteria:null});
 r.guess(1);assert.equal(r.points,2);assert.deepEqual(r.clues,{continent:'Asia',country:'India',criteria:null});
 r.guess(1);assert.equal(r.points,1);assert.deepEqual(r.clues,{continent:'Asia',country:'India',criteria:['i']});
 r.guess(1);assert.equal(r.done,false);assert.equal(r.practice,true);assert.equal(r.points,0);
 r.guess(1);assert.equal(r.done,false);r.guess(252);assert.equal(r.won,true);assert.equal(r.earned,0);
});
test('four scored guesses and voluntary give up',()=>{
 for(let misses=0;misses<4;misses++){const r=new HeritageRound({id:252});for(let i=0;i<misses;i++)r.guess(1);r.guess(252);assert.equal(r.earned,4-misses);assert.equal(r.done,true);r.guess(1);assert.equal(r.earned,4-misses);}
 const r=new HeritageRound({id:252});r.giveUp();assert.equal(r.done,true);assert.equal(r.won,false);assert.equal(r.earned,0);
});
test('criteria fallback and geographic continents for representative sites',()=>{
 for(const [id,continent] of [[252,'Asia'],[307,'North America'],[274,'South America'],[86,'Africa'],[166,'Oceania'],[80,'Europe'],[715,'Oceania'],[409,'Oceania']])assert.equal(sites.find(s=>s.id===id).continent,continent);
 assert.deepEqual(sites.find(s=>s.id===775).criteria,['vi']);
});
