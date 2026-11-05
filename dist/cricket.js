import {CricketGame} from './cricket-model.js?v=cc72f94045';
const $=id=>document.getElementById(id);
let game,loading=false;
const state=()=>game?.snapshot()??{ready:false};
function render(){
  const s=state(),ready=!!game?.current;
  $('round').textContent=String(s.round||1).padStart(2,'0');$('attempts').textContent=s.guesses?.length??0;
  $('guess').disabled=!ready||s.done;$('submit').disabled=!ready||s.done;$('reveal').disabled=!ready||s.done;
  $('play').hidden=!!s.done;$('result').hidden=!s.done;$('ground-source').hidden=!s.done;
  const past=$('past-guesses');past.replaceChildren();past.hidden=!s.guesses?.length;
  for(const guess of s.guesses??[]){const li=document.createElement('li');li.textContent=guess.guess;if(guess.correct)li.className='correct';past.append(li);}
  if(s.done){
    $('answer').textContent=s.answer.name;$('result-detail').textContent=`${s.won?'Correct · ':''}${s.answer.location}`;
    $('source-link').href=s.answer.source;$('source-credit').textContent=s.answer.credit;
    $('source-license').textContent=s.answer.license.name;$('source-license').href=s.answer.license.url;
  }
}
function loadImage(){
  $('image-status').hidden=false;$('image-message').textContent='Loading outline…';$('retry-image').hidden=true;$('ground-outline').hidden=true;
  $('ground-outline').src=state().image;
}
$('ground-outline').addEventListener('load',()=>{$('image-status').hidden=true;$('ground-outline').hidden=false;});
$('ground-outline').addEventListener('error',()=>{$('image-status').hidden=false;$('image-message').textContent='Outline unavailable.';$('retry-image').hidden=false;});
$('retry-image').addEventListener('click',loadImage);
function next(){
  if(!game)throw Error('Wait for grounds to load.');
  game.next();$('guess').value='';$('answer').textContent='';$('source-link').removeAttribute('href');$('feedback').textContent='';render();loadImage();return state();
}
function guess(name){
  if(!game)throw Error('Wait for grounds to load.');
  const accepted=game.guess(name);$('guess').value='';render();
  if(game.done)$('next').focus();else{$('feedback').textContent=accepted?'Not quite.':'Already guessed.';$('guess').focus();}
  return state();
}
function reveal(){if(!game)throw Error('Wait for grounds to load.');game.reveal();render();$('next').focus();return state();}
$('guess-form').addEventListener('submit',event=>{event.preventDefault();try{guess($('guess').value);}catch(error){$('feedback').textContent=error.message;}});
$('reveal').addEventListener('click',reveal);$('next').addEventListener('click',()=>{next();$('game-title').scrollIntoView({block:'start'});$('guess').focus({preventScroll:true});});
$('retry').addEventListener('click',init);
async function init(){
  if(loading||game)return;loading=true;$('retry').hidden=true;$('load-message').textContent='Loading grounds…';
  try{
    const r=await fetch('./cricket-data.json?v=5764a83ba1');if(!r.ok)throw Error('Data unavailable');const data=await r.json();
    game=new CricketGame(data.grounds);$('cricket-game').hidden=false;next();$('pool-label').textContent=`${data.grounds.length} GROUNDS`;$('load-status').hidden=true;
  }catch{game=null;$('cricket-game').hidden=true;$('load-message').textContent='Unable to load the game.';$('retry').hidden=false;}
  finally{loading=false;}
}
init();
