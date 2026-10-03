import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BingoGame,categories,bingoLines,cardIndex} from '../dist/bingo-model.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/bingo-data.json',import.meta.url)));
const byId=new Map(data.cities.map(c=>[c.id,c]));
function solve(card){const assigned=[],owners=new Map();function match(cell,seen){for(const id of card.deck){if(seen.has(id)||!categories[card.categories[cell]].test(byId.get(id)))continue;seen.add(id);if(!owners.has(id)||match(owners.get(id),seen)){owners.set(id,cell);assigned[cell]=id;return true;}}return false;}for(let i=0;i<16;i++)assert.ok(match(i,new Set()),`Card ${card.name}, cell ${i}`);return assigned;}
test('five distinct, fixed 4x4 cards can each be fully completed without a wildcard',()=>{
 assert.equal(data.cards.length,5);assert.equal(new Set(data.cards.map(c=>JSON.stringify(c.categories))).size,5);
 for(const card of data.cards){assert.equal(card.categories.length,16);assert.equal(new Set(card.categories).size,16);assert.equal(card.deck.length,32);assert.equal(new Set(card.deck).size,32);for(const id of card.deck)assert.ok(byId.has(id));
 const answers=solve(card),g=new BingoGame(card,data.cities);
 while(!g.done){const cell=answers.indexOf(g.current.id);if(cell<0)g.skip();else assert.equal(g.place(cell).type,'placed');}
 assert.equal(g.count,16);assert.equal(g.lines.length,10);assert.equal(g.wildcardUsed,false);
 }
});
test('wrong placement skips two cities; safe skip advances one; filled cells cannot be reused',()=>{
 const card=data.cards[0],g=new BingoGame(card,data.cities),wrong=card.categories.findIndex((key,i)=>!g.matches(i));assert.ok(wrong>=0);const outcome=g.place(wrong);assert.equal(outcome.type,'miss');assert.equal(g.cursor,2);assert.equal(g.count,0);assert.equal(g.mistakes,1);g.skip();assert.equal(g.cursor,3);
 const cell=card.categories.findIndex((key,i)=>g.matches(i));assert.ok(cell>=0);g.place(cell);const cursor=g.cursor;assert.equal(g.place(cell).type,'ignored');assert.equal(g.cursor,cursor);assert.equal(g.count,1);assert.equal(g.place(99).type,'ignored');
});
test('one wildcard fills only matching empty cells and consumes only one city',()=>{
 const g=new BingoGame(data.cards[0],data.cities),expected=g.card.categories.map((_,i)=>i).filter(i=>g.matches(i)),city=g.current;
 const result=g.wildcard();assert.deepEqual(result.cells,expected);assert.equal(g.count,expected.length);assert.ok(g.filled.filter(Boolean).every(c=>c.id===city.id));assert.equal(g.cursor,1);assert.equal(g.wildcard().type,'ignored');assert.equal(g.cursor,1);
});
test('exhaustion, final-city penalty and new-card reset are bounded',()=>{
 const g=new BingoGame(data.cards[0],data.cities);while(g.cursor<31)g.skip();const wrong=g.card.categories.findIndex((_,i)=>!g.matches(i));g.place(wrong);assert.equal(g.cursor,32);assert.equal(g.done,true);assert.equal(g.current,null);assert.equal(g.skip().type,'ignored');
 const reset=new BingoGame(data.cards[0],data.cities);assert.equal(reset.count,0);assert.equal(reset.cursor,0);assert.equal(reset.wildcardUsed,false);
 assert.equal(bingoLines.length,10);for(let n=1;n<=5;n++)assert.equal(cardIndex(`?card=${n}`),n-1);for(const query of ['','?card=0','?card=6','?card=1.5','?card=wrong'])assert.equal(cardIndex(query),0);
});
test('every city has usable factual fields and themed decks stay in their regions',()=>{
 for(const c of data.cities){assert.ok(c.name);assert.ok(c.population>0);assert.ok(Number.isFinite(c.lat)&&Number.isFinite(c.lng));assert.ok(['EU','AS','AF','NA','SA','OC'].includes(c.continent));}
 for(const id of data.cards[1].deck)assert.equal(byId.get(id).continent,'EU');for(const id of data.cards[2].deck)assert.equal(byId.get(id).continent,'AS');for(const id of data.cards[3].deck)assert.ok(['NA','SA','AF'].includes(byId.get(id).continent));
});
