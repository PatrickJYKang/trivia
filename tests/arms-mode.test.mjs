import test from 'node:test';
import assert from 'node:assert/strict';
import {armsMode} from '../dist/arms-mode.js';
import {ArmsGame} from '../dist/arms-model.js';
test('historical mode has a bookmarkable switch and entity labels; unknown modes keep current countries',()=>{
  for(const value of ['', '?mode=unknown', '?mode=hard', '?other=historical']){
    const mode=armsMode(value);assert.equal(mode.historical,false);assert.equal(mode.noun,'country');assert.equal(mode.credits,'arms-credits.html');assert.equal(mode.switchUrl,'arms.html?mode=historical');
  }
  const mode=armsMode('?mode=historical');assert.equal(mode.historical,true);assert.equal(mode.noun,'entity');assert.equal(mode.credits,'historical-arms-credits.html');assert.equal(mode.switchUrl,'arms.html');assert.match(mode.title,/historical/);
});
test('historical periods and context stay hidden until completion, while selection and guessing rules remain shared',()=>{
  const entry={id:'example',name:'Example republic',aliases:['Republic of Example'],image:'example.svg',period:'1800–1900',note:'Example arms.',source:'https://example.com',credit:'Example',license:{name:'Example',url:'https://example.com'}};
  const game=new ArmsGame([entry],()=>.5,{noun:'entity',article:'an'});game.next();
  assert.equal(game.snapshot().period,undefined);assert.equal(game.snapshot().answer,undefined);assert.throws(()=>game.guess(''),/entity/);
  game.guess('Republic of Example');assert.equal(game.won,true);assert.equal(game.snapshot().answer.period,'1800–1900');
  game.next();game.reveal();assert.equal(game.snapshot().answer.period,'1800–1900');assert.equal(game.won,false);
});
