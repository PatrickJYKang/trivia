import {ArmsGame} from './arms-model.js?v=0643486714';
import {countryIndex,attachCountrySearch} from './country-search.js?v=47e7b54b36';
import {armsMode} from './arms-mode.js?v=7d120bdc89';
const $=id=>document.getElementById(id);
const mode=armsMode(location.search);
document.title=`Trivia — ${mode.title}`;$('game-title').textContent=mode.title;$('pool-label').textContent=mode.label;$('guess-label').textContent=mode.inputLabel;$('guess').placeholder=mode.placeholder;$('country-options').setAttribute('aria-label',mode.listLabel);$('next').textContent=mode.next;$('arms-credits-link').href=mode.credits;$('arms-mode-switch').textContent=mode.switchLabel;$('arms-mode-switch').href=mode.switchUrl;$('arms-category').textContent=mode.footer;$('arms-redaction-label').textContent=mode.redactionLabel;if(mode.historical)$('arms-image').alt='Historical coat of arms or emblem to identify';$('arms-game-link').href=mode.historical?'arms.html?mode=historical':'arms.html';$('arms-mode-switch').setAttribute('aria-label',mode.historical?'Play current-country Coat of Arms':'Play historical Coat of Arms');
let game,search,loading=false;
const state=()=>game?.snapshot()??{ready:false};
function render(){
  const s=state(),ready=!!game?.current;
  $('round').textContent=String(s.round||1).padStart(2,'0');$('attempts').textContent=s.guesses?.length??0;
  $('guess').disabled=!ready||s.done;$('submit').disabled=!ready||s.done;$('reveal').disabled=!ready||s.done;
  $('play').hidden=!!s.done;$('result').hidden=!s.done;$('arms-source').hidden=!s.done;
  const past=$('past-guesses');past.replaceChildren();past.hidden=!s.guesses?.length;
  for(const guess of s.guesses??[]){const li=document.createElement('li');li.textContent=guess.guess;if(guess.correct)li.className='correct';past.append(li);}
  if(s.done){
    $('answer').textContent=s.answer.name;$('result-detail').textContent=[s.won?'Correct':'Answer revealed',s.answer.period].filter(Boolean).join(' · ');
    const note=[s.answer.note,s.answer.adaptation].filter(Boolean).join(' ');$('emblem-note').textContent=note;$('emblem-note').hidden=!note;
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
  if(!game)throw Error(`Wait for ${mode.plural} to load.`);
  game.next();search.clear();$('answer').textContent='';$('source-link').removeAttribute('href');$('feedback').textContent='';render();loadImage();return state();
}
function guess(name){
  if(!game)throw Error(`Wait for ${mode.plural} to load.`);
  const accepted=game.guess(name);search.clear();render();
  if(game.done)$('next').focus();else{$('feedback').textContent=accepted?'Not quite.':'Already guessed.';$('guess').focus();}
  return state();
}
function reveal(){if(!game)throw Error(`Wait for ${mode.plural} to load.`);game.reveal();search.clear();render();$('next').focus();return state();}
$('guess-form').addEventListener('submit',event=>{event.preventDefault();try{const country=search?.resolve();if(!country)throw Error(`Choose ${mode.article} ${mode.noun} from the list.`);guess(country.name);}catch(error){$('feedback').textContent=error.message;}});
$('reveal').addEventListener('click',reveal);$('next').addEventListener('click',()=>{next();$('game-title').scrollIntoView({block:'start'});$('guess').focus({preventScroll:true});});
$('retry').addEventListener('click',init);
async function init(){
  if(loading||game)return;loading=true;$('retry').hidden=true;$('load-message').textContent=mode.loading;
  try{
    const r=await fetch(mode.historical?'./historical-arms-data.json?v=c2d16e7439':'./arms-data.json?v=2c35b0c62f');if(!r.ok)throw Error('Data unavailable');const data=await r.json();
    game=new ArmsGame(data.countries,Math.random,{noun:mode.noun,article:mode.article});search=attachCountrySearch(countryIndex(data.countries),{input:$('guess'),list:$('country-options'),status:$('country-search-status'),noun:mode.noun,plural:mode.plural,article:mode.article,onChange:()=>{$('feedback').textContent='';}});$('arms-game').hidden=false;next();$('pool-label').textContent=`${data.countries.length} ${mode.label}`;$('load-status').hidden=true;
  }catch{game=null;$('arms-game').hidden=true;$('load-message').textContent='Unable to load the game.';$('retry').hidden=false;}
  finally{loading=false;}
}
init();
