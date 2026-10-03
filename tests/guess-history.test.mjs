import test from 'node:test';
import assert from 'node:assert/strict';
import {directionTo,recordGuess,visibleHistory} from '../dist/guess-history.js';
import {createIndex} from '../dist/city-search.js';
test('bearings point from guess to answer and handle the antimeridian',()=>{
 for(const [to,bearing] of [[[0,10],0],[[10,0],90],[[0,-10],180],[[-10,0],270]]){const d=directionTo([0,0],to);assert.ok(Math.abs(d.bearing-bearing)<1e-8);assert.ok(Math.abs(d.distanceKm-1111.9508)<.01);}
 const crossing=directionTo([179,0],[-179,0]);assert.equal(crossing.direction,'E');assert.ok(crossing.distanceKm<223);
 const londonNY=directionTo([-0.1278,51.5074],[-74.006,40.7128]);assert.ok(Math.abs(londonNY.distanceKm-5570)<10);assert.equal(londonNY.direction,'W');
 assert.equal(directionTo([1,1],[1,1]).bearing,null);assert.equal(directionTo([0,0],[180,0]).bearing,null);
});
test('cities retain coordinates, history accumulates and unlocks after three misses',()=>{
 const [guess]=createIndex([[1,'Example','GB','',1,[],51.5,-.1]]);assert.deepEqual(guess.center,[-.1,51.5]);
 const history=[];for(let i=0;i<3;i++){history.push(recordGuess(guess,{center:[2.35,48.85]}));assert.equal(visibleHistory(history,3).length,i<2?0:3);assert.equal(visibleHistory(history).length,i+1);}
 history.push(recordGuess(guess,{center:[2.35,48.85]}));assert.equal(visibleHistory(history,3).length,4);assert.deepEqual(visibleHistory([],3),[]);
});
