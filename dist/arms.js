import {ArmsGame} from './arms-model.js?v=25ff819337';
const $=id=>document.getElementById(id);
let game,loading=false;
const state=()=>game?.snapshot()??{ready:false};
function render(){
  const s=state(),ready=!!game?.current;
  $('round').textContent=String(s.round||1).padStart(2,'0');$('attempts').textContent=s.guesses?.length??0;
  $('guess').disabled=!ready||s.done;$('submit').disabled=!ready||s.done;$('reveal').disabled=!ready||s.done;
  $('play').hidden=!!s.done;$('result').hidden=!s.done;$('arms-source').hidden=!s.done;
  const past=$('past-guesses');past.replaceChildren();past.hidden=!s.guesses?.length;
  for(const guess of s.guesses??[]){const li=document.createElement('li');li.textContent=guess.guess;if(guess.correct)li.className='correct';past.append(li);}
  if(s.done){
    $('answer').textContent=s.answer.name;$('result-detail').textContent=s.won?'Correct':'Answer revealed';
    $('emblem-note').textContent=s.answer.note||'';$('emblem-note').hidden=!s.answer.note;
    $('source-link').href=s.answer.source;$('source-credit').textContent=s.answer.credit;
    $('source-license').textContent=s.answer.license.name;$('source-license').href=s.answer.license.url;
  }
}
function loadImage(){
  $('image-status').hidden=false;$('image-message').textContent='Loading emblem…';$('retry-image').hidden=true;$('arms-image').hidden=true;
  $('arms-image').src=state().image;
}
$('arms-image').addEventListener('load',()=>{$('image-status').hidden=true;$('arms-image').hidden=false;});
$('arms-image').addEventListener('error',()=>{$('image-status').hidden=false;$('image-message').textContent='Emblem unavailable.';$('retry-image').hidden=false;});
$('retry-image').addEventListener('click',loadImage);
function next(){
  if(!game)throw Error('Wait for countries to load.');
  game.next();$('guess').value='';$('answer').textContent='';$('source-link').removeAttribute('href');$('feedback').textContent='';render();loadImage();return state();
}
function guess(name){
  if(!game)throw Error('Wait for countries to load.');
  const accepted=game.guess(name);$('guess').value='';render();
  if(game.done)$('next').focus();else{$('feedback').textContent=accepted?'Not quite.':'Already guessed.';$('guess').focus();}
  return state();
}
function reveal(){if(!game)throw Error('Wait for countries to load.');game.reveal();render();$('next').focus();return state();}
$('guess-form').addEventListener('submit',event=>{event.preventDefault();try{guess($('guess').value);}catch(error){$('feedback').textContent=error.message;}});
$('reveal').addEventListener('click',reveal);$('next').addEventListener('click',()=>{next();$('game-title').scrollIntoView({block:'start'});$('guess').focus({preventScroll:true});});
$('retry').addEventListener('click',init);
async function init(){
  if(loading||game)return;loading=true;$('retry').hidden=true;$('load-message').textContent='Loading countries…';
  try{
    const r=await fetch('./arms-data.json?v=1df7edd873');if(!r.ok)throw Error('Data unavailable');const data=await r.json();
    game=new ArmsGame(data.countries);$('arms-game').hidden=false;next();$('pool-label').textContent=`${data.countries.length} COUNTRIES`;$('load-status').hidden=true;
  }catch{game=null;$('arms-game').hidden=true;$('load-message').textContent='Unable to load the game.';$('retry').hidden=false;}
  finally{loading=false;}
}
init();
