import {cities} from './cities.js';
import {createIndex,attachCitySearch,searchCities} from './city-search.js';
import {HistoryGame} from './history-model.js';

const $=id=>document.getElementById(id);
let game,index=[],byId=new Map(),search,loading=false;

function renderTimeline(){
  const timeline=$('timeline');timeline.replaceChildren();
  for(const period of game.snapshot().periods){
    const row=document.createElement('li'),dates=document.createElement('span'),control=document.createElement('span');
    dates.className='period-dates';dates.textContent=period.dates;
    control.className='period-control';control.textContent=period.control;
    row.append(dates,control);timeline.append(row);
  }
}
function render(){
  const ready=!!game?.current,done=ready&&game.done;
  $('guess').disabled=!ready||done;$('submit').disabled=!ready||done||!search?.selected;
  $('give-up').disabled=!ready||done;$('play').hidden=done;$('result').hidden=!done;$('history-context').hidden=!done;
  $('reveal-next').hidden=!game?.snapshot().canReveal;
  $('round').textContent=String(game?.round||1).padStart(2,'0');$('attempts').textContent=game?.guesses.length??0;
  const past=$('past-guesses');past.replaceChildren();past.hidden=!game?.guesses.length;
  for(const city of game?.guesses??[]){const li=document.createElement('li');li.textContent=city.name;li.title=city.country;if(city.id===game.current.id)li.className='correct';past.append(li);}
}
function state(){return game?.snapshot()??{ready:false};}
function revealNext(){
  if(!game)throw Error('Wait for histories to load.');
  game.revealNext();renderTimeline();render();
  $('reveal-status').textContent=`${game.revealed} periods revealed${game.snapshot().canReveal?'.':'. Full timeline revealed.'}`;
  $('guess').focus({preventScroll:true});
  return state();
}
function next(){
  if(!game)throw Error('Wait for histories to load.');
  game.next();search.clear();$('answer').textContent='';$('history-note').textContent='';$('period-notes').replaceChildren();$('sources').replaceChildren();
  $('feedback').textContent='';$('history-context').open=false;$('reveal-status').textContent='';renderTimeline();render();
  return state();
}
function finish(){
  search.close();const city=game.current;
  $('answer').textContent=city.name;
  $('result-detail').textContent=`${city.country} · ${game.won?`Found in ${game.guesses.length} ${game.guesses.length===1?'guess':'guesses'}`:'Answer revealed'}`;
  $('history-note').textContent=city.note;
  const notes=$('period-notes');notes.replaceChildren();
  for(const period of game.snapshot().answer.periodNotes){
    const row=document.createElement('li');row.textContent=`${period.dates}: ${period.detail}`;notes.append(row);
  }
  notes.hidden=!notes.children.length;
  const sources=$('sources');sources.replaceChildren();
  for(const source of city.sources){const link=document.createElement('a');link.href=source.url;link.textContent=source.title;link.target='_blank';link.rel='noreferrer';sources.append(link);}
  renderTimeline();render();$('next').focus();
}
function guess(id){
  const city=Number.isInteger(id)?byId.get(id):null;
  if(!city)throw Error('Choose a city from the database.');
  if(!game)throw Error('Wait for histories to load.');
  const accepted=game.guess(city);search.clear();
  if(game.done)finish();else{$('feedback').textContent=accepted?'Incorrect.':'Already guessed.';renderTimeline();render();$('guess').focus();}
  return state();
}
function giveUp(){if(!game)throw Error('Wait for histories to load.');game.giveUp();finish();return state();}
$('guess-form').addEventListener('submit',event=>{event.preventDefault();if(search?.selected)guess(search.selected.id);});
$('give-up').addEventListener('click',giveUp);
$('reveal-next').addEventListener('click',revealNext);
$('next').addEventListener('click',()=>{next();$('game-title').scrollIntoView({block:'start'});$('guess').focus({preventScroll:true});});
$('retry').addEventListener('click',init);

async function init(){
  if(loading||game)return;loading=true;$('retry').hidden=true;$('load-message').textContent='Loading histories…';
  try{
    const [rows,data]=await Promise.all(['./city-database.json','./history-data.json'].map(async url=>{const response=await fetch(url);if(!response.ok)throw Error('Data unavailable');return response.json();}));
    const entries=data.cities;
    if(!Array.isArray(entries)||!entries.length)throw Error('No histories');
    index=createIndex(rows,[...cities,...entries]);byId=new Map(index.map(c=>[c.id,c]));
    if(entries.some(c=>!byId.has(c.id)))throw Error('Missing city identity');
    search=attachCitySearch(index,{input:$('guess'),list:$('city-options'),status:$('search-status'),onSelect:render,onChange:render});
    game=new HistoryGame(entries);next();$('pool-label').textContent=`${entries.length} CITIES`;
    $('load-status').hidden=true;$('timeline-panel').hidden=false;
  }catch{$('load-message').textContent='Unable to load histories. ';$('retry').hidden=false;}
  finally{loading=false;}
}
init();

if(typeof document.modelContext?.registerTool==='function'){
  const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const empty={type:'object',properties:{},additionalProperties:false};
  const tools=[
    {name:'read_city_history',description:'Read the revealed political-control periods and current guesses. The full timeline, answer and sources appear after the round ends.',inputSchema:empty,annotations:{readOnlyHint:true},execute:state},
    {name:'reveal_next_history_owner',description:'Reveal the next period of political control. Does not consume a guess or change points.',inputSchema:empty,execute:revealNext},
    {name:'search_history_cities',description:'Search city names and historical aliases for a city ID to guess.',inputSchema:{type:'object',properties:{query:{type:'string',minLength:2}},required:['query'],additionalProperties:false},annotations:{readOnlyHint:true},execute:input=>{if(typeof input?.query!=='string'||input.query.trim().length<2)throw Error('Enter at least two characters.');return searchCities(index,input.query).map(({id,name,country})=>({id,name,country}));}},
    {name:'guess_history_city',description:'Guess the city using a GeoNames city ID. Each new wrong guess reveals the next owner, if available.',inputSchema:{type:'object',properties:{cityId:{type:'integer'}},required:['cityId'],additionalProperties:false},execute:input=>guess(input?.cityId)},
    {name:'give_up_city_history',description:'End the round and reveal the city, explanatory note and sources.',inputSchema:empty,execute:giveUp},
    {name:'next_city_history',description:'Start the next history after the current round ends.',inputSchema:empty,execute:next}
  ];
  for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool({...tool,annotations:{readOnlyHint:false,...tool.annotations}},{signal:lifecycle.signal})).catch(()=>{});}catch{}}
}
