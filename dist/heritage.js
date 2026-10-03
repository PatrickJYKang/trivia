import {attachCitySearch,searchCities} from './city-search.js';
import {createHeritageIndex,HeritageRound,heritageZoom} from './heritage-model.js';
const $=id=>document.getElementById(id);
const hard=new URLSearchParams(location.search).get('mode')==='hard';
const title=hard?'Heritage Guess (hard)':'Heritage Guess';
$('game-title').textContent=title;document.title=`Trivia — ${title}`;
if(hard){$('current-game').href='heritage.html?mode=hard';$('mode-switch').textContent='Easy mode';$('mode-switch').href='heritage.html';$('mode-switch').setAttribute('aria-label','Back to easy Heritage Guess');}
const satellite={version:8,sources:{satellite:{type:'raster',tiles:['https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],tileSize:256,maxzoom:19}},layers:[{id:'satellite',type:'raster',source:'satellite'}]};
let pool=[],index=[],deck=[],game,round=0,score=0,view=0,ready=false,map,search,timer,failed=false;
const state=()=>({mode:hard?'hard':'easy',poolSize:pool.length,round,score,level:(game?.level??0)+1,view:view+1,availablePoints:game?.points??3,practice:game?.practice??false,done:game?.done??false,ready,...(game?.done?{answer:game.site.name}:{}),message:$('feedback').textContent});
function render(){
 $('round').textContent=String(round).padStart(2,'0');$('score').textContent=score;
 document.querySelectorAll('.stage').forEach((b,i)=>{b.disabled=!ready||(!game?.done&&i>(game?.level??0));b.classList.toggle('active',i===view);b.setAttribute('aria-pressed',String(i===view));});
 document.querySelector('[data-stage="2"] small').textContent=game?.practice?'0 pts':'1 pt';
 const points=game?.points??3;
 $('points').textContent=game?.practice?'0 points · keep guessing':`${points} ${points===1?'point':'points'} available`;
 $('guess').disabled=!!game?.done||!ready;$('submit').disabled=!!game?.done||!ready||!search?.selected;
 $('reveal').disabled=!!game?.done||!ready;$('reveal').textContent=game?.level===2?'Give up':'Zoom out';
 const done=!!game?.done;$('guess-form').hidden=done;document.querySelector('.prompt-line').hidden=done;document.querySelector('.below-form').hidden=done;$('result').hidden=!done;
}
function loading(){ready=false;failed=false;clearTimeout(timer);$('map-status').hidden=false;$('map-status').querySelector('span').textContent='Loading satellite…';$('retry').hidden=true;timer=setTimeout(mapError,15000);render();}
function mapError(){failed=true;ready=false;clearTimeout(timer);$('map-status').hidden=false;$('map-status').querySelector('span').textContent='Unable to load the game. Try again.';$('retry').hidden=false;render();}
function loaded(){if(failed||!map?.isStyleLoaded()||!map.areTilesLoaded())return;clearTimeout(timer);ready=true;$('map-status').hidden=true;render();}
function showMap(n,retry=false){
 view=n;loading();$('map-caption').textContent=`SATELLITE · ${['CLOSE-UP','WIDER','SURROUNDINGS'][n]}`;
 $('map').setAttribute('aria-label',`${['Close-up','Wider satellite view','Satellite surroundings'][n]} of ${game.done?game.site.name:'a mystery World Heritage Site'}`);
 const camera={center:game.site.center,zoom:heritageZoom(game.site,n,$('map').clientWidth)};
 if(!map){map=new maplibregl.Map({container:'map',style:satellite,...camera,interactive:false,attributionControl:false,renderWorldCopies:false,fadeDuration:0});map.on('idle',loaded);map.on('error',mapError);}
 else {if(retry)map.setStyle(satellite,{diff:false});map.jumpTo(camera);map.triggerRepaint();}
}
function nextSite(){
 if(game&&!game.done)throw Error('Finish the current round first.');
 if(!deck.length){deck=[...pool];for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}if(deck.length>1&&deck.at(-1).id===game?.site.id)[deck[0],deck[deck.length-1]]=[deck.at(-1),deck[0]];}
 game=new HeritageRound(deck.pop());round++;search.clear();$('feedback').textContent='Find a site. Zoom out for a wider clue.';showMap(0);return state();
}
function finish(){
 score+=game.earned;search.close();$('answer').textContent=game.site.name;
 $('result-detail').textContent=`${game.site.country} · ${game.site.category} · ${game.won?`Correct. +${game.earned} ${game.earned===1?'point':'points'}`:'No points this round'}`;
 $('site-link').href=`https://whc.unesco.org/en/list/${game.site.id}/`;
 $('map').setAttribute('aria-label',`Satellite imagery of ${game.site.name}`);render();$('next').focus();
}
function guess(id){
 if(!ready||!game||game.done)throw Error('Wait for an active round.');
 if(!index.some(site=>site.id===id))throw Error('Choose a site from the database.');
 const previous=game.level;game.guess(id);
 if(game.done)finish();else{search.clear();$('feedback').textContent=game.practice?'Not quite. Keep guessing for 0 points, or give up.':'Not quite. Try the wider view.';if(previous!==game.level)showMap(game.level);else {render();$('guess').focus();}}
 return state();
}
function reveal(){if(!ready||!game||game.done)throw Error('Wait for an active round.');game.reveal();if(game.done)finish();else showMap(game.level);return state();}
$('guess-form').addEventListener('submit',e=>{e.preventDefault();if(search?.selected)guess(search.selected.id);});
$('reveal').addEventListener('click',reveal);$('next').addEventListener('click',nextSite);
$('retry').addEventListener('click',()=>game?showMap(view,true):init());
document.querySelectorAll('.stage').forEach((b,i)=>b.addEventListener('click',()=>{if(ready&&(game.done||i<=game.level))showMap(i);}));
new ResizeObserver(()=>{if(map&&game){map.resize();map.jumpTo({zoom:heritageZoom(game.site,view,$('map').clientWidth)});}}).observe($('map'));
async function init(){
 loading();try{const response=await fetch('./heritage-database.json');if(!response.ok)throw Error('Heritage data unavailable');const data=await response.json();pool=hard?data.sites:data.sites.filter(s=>s.easy);if(!pool.length)throw Error('No sites available');index=createHeritageIndex(data.sites);
 document.querySelector('.eyebrow').textContent=`UNESCO · ${pool.length.toLocaleString('en')} SITES · ${hard?'HARD':'EASY'}`;
 search=attachCitySearch(index,{input:$('guess'),list:$('city-options'),status:$('search-status'),onSelect:render,onChange:render,noun:'site',plural:'sites'});nextSite();
 }catch{mapError();}
}
init();
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 const tools=[
 {name:'read_heritage_game',description:'Read the heritage game state; answers appear only when the round is over.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:state},
 {name:'search_heritage_sites',description:'Find UNESCO properties by name, component name or country-qualified name.',inputSchema:{type:'object',properties:{query:{type:'string',minLength:2}},required:['query'],additionalProperties:false},annotations:{readOnlyHint:true},execute:({query})=>searchCities(index,query).map(({id,name,country})=>({id,name,country}))},
 {name:'submit_heritage_guess',description:'Guess a UNESCO site by ID. Further guesses after the third miss earn zero points.',inputSchema:{type:'object',properties:{siteId:{type:'integer'}},required:['siteId'],additionalProperties:false},execute:({siteId})=>guess(siteId)},
 {name:'reveal_heritage_clue',description:'Zoom out to the next satellite view, or give up at the final view.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:reveal},
 {name:'start_next_heritage_site',description:'Start a new heritage round after finishing the current round.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:nextSite}];
 for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool({...tool,annotations:{readOnlyHint:false,...tool.annotations}},{signal:lifecycle.signal})).catch(()=>{});}catch{}}
}
