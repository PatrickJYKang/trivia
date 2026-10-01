import {cities} from './cities.js';
import {createHardCities} from './hard-cities.js';
import {createIndex, attachCitySearch, searchCities} from './city-search.js';
const $=id=>document.getElementById(id);
const hardMode = new URLSearchParams(location.search).get('mode') === 'hard';
let cityPool = cities;
if(hardMode){
 const title='City Guess (hard)';
 $('game-title').textContent=title;$('game-nav-title').textContent=title;
 $('current-game').href='?mode=hard';document.title=`Trivia — ${title}`;
 $('mode-switch').textContent='Standard mode';$('mode-switch').href='./';
 $('mode-switch').setAttribute('aria-label','Back to standard City Guess');
}

const osm='© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors · © <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>';
const esri='Imagery © <a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9" target="_blank" rel="noreferrer">Esri</a>, Maxar, Earthstar Geographics & the GIS User Community';
let deck=[],city,round=0,score=0,level=0,view=0,done=false,ready=false,map,styles,loadTimer,loadFailed=false,practice=false,citySearch,cityIndex=[];
function shuffle(){deck=[...cityPool];for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}if(deck.at(-1)===city) [deck[0],deck[deck.length-1]]=[deck.at(-1),deck[0]];}
function availablePoints(){return practice?0:3-level;}
function state(){return {mode:hardMode?'hard':'standard',poolSize:cityPool.length,round,score,availablePoints:availablePoints(),practice,level:level+1,view:view+1,done,ready,...(done?{answer:city.name}:{}),message:$('feedback').textContent};}
function render(){
$('round').textContent=String(round).padStart(2,'0');$('score').textContent=score;
document.querySelectorAll('.stage').forEach((b,i)=>{b.disabled=!ready || (!done&&i>level);b.classList.toggle('active',i===view);b.setAttribute('aria-pressed',String(i===view));});
document.querySelector('[data-stage="2"] small').textContent=practice?'0 pts':'1 pt';
$('points').textContent=practice?'0 points · keep guessing':`${availablePoints()} ${availablePoints()===1?'point':'points'} available`;
$('guess').disabled=done||!ready;$('submit').disabled=done||!ready||!citySearch?.selected;$('reveal').disabled=done||!ready;
$('reveal').textContent=['Reveal map','Reveal satellite','Give up'][level];
$('guess-form').hidden=done;document.querySelector('.prompt-line').hidden=done;document.querySelector('.below-form').hidden=done;$('result').hidden=!done;
}
function loading(){loadFailed=false;ready=false;$('map-status').hidden=false;$('map-status').querySelector('span').textContent='Loading map…';$('retry').hidden=true;clearTimeout(loadTimer);loadTimer=setTimeout(()=>mapError(),15000);render();}
function mapError(){loadFailed=true;clearTimeout(loadTimer);ready=false;$('map-status').hidden=false;$('map-status').querySelector('span').textContent='Unable to load the game. Try again.';$('retry').hidden=false;render();}
function loaded(){if(loadFailed||!map?.isStyleLoaded()||!map.areTilesLoaded())return;clearTimeout(loadTimer);ready=true;$('map-status').hidden=true;render();}
function showMap(n){
view=n;loading();$('map').setAttribute('aria-label',`${['Major roads','Unlabeled map','Satellite imagery'][n]} of ${done?city.name:'a mystery city'}`);
$('map-caption').textContent=['MAJOR ROADS ONLY','MAP · NO LABELS','SATELLITE'][n];$('attribution').innerHTML=n===2?esri:osm;
const zoom=city.zoom+Math.log2(Math.min($('map').clientWidth/900,1));
if(!map){map=new maplibregl.Map({container:'map',style:styles[n],center:city.center,zoom,interactive:false,attributionControl:false,renderWorldCopies:false,fadeDuration:0});map.on('idle',loaded);map.on('error',mapError);}
else{map.jumpTo({center:city.center,zoom});map.setStyle(styles[n],{diff:false});}
render();
}
function nextCity(){if(done===false&&round>0)return state();if(!deck.length)shuffle();city=deck.pop();round++;level=0;view=0;done=false;practice=false;citySearch?.clear();$('feedback').textContent='Find a city. Earlier guesses earn more points.';showMap(0);return state();}
function finish(won){done=true;citySearch.close();const points=availablePoints();if(won)score+=points;$('answer').textContent=city.name;$('result-detail').textContent=`${[city.region,city.country].filter(Boolean).join(', ')} · ${won?`Correct. +${points} ${points===1?'point':'points'}`:'No points this round'}`;render();$('next').focus();}
function reveal(){if(done||!ready)throw Error('Wait for the map to load.');if(level<2){level++;showMap(level);}else finish(false);return state();}
function guess(id){
 if(done||!ready)throw Error('Wait for an active round.');
 const chosen=cityIndex.find(c=>c.id===id);if(!chosen)throw Error('Select a city from the database.');
 if(chosen.id===city.id)finish(true);
 else {citySearch.clear();if(level===2){practice=true;$('feedback').textContent='Not quite. Keep guessing for 0 points, or give up.';render();$('guess').focus();}else{level++;$('feedback').textContent='Not quite. Try the next clue.';showMap(level);}}
 return state();
}
$('guess-form').addEventListener('submit',e=>{e.preventDefault();if(citySearch?.selected)guess(citySearch.selected.id);});
$('reveal').addEventListener('click',reveal);$('next').addEventListener('click',nextCity);
document.querySelectorAll('.stage').forEach((b,i)=>b.addEventListener('click',()=>{if(ready&&(done||i<=level))showMap(i);}));
$('retry').addEventListener('click',()=>{if(styles)showMap(view);else init();});
new ResizeObserver(()=>{if(map&&city){map.resize();map.jumpTo({zoom:city.zoom+Math.log2(Math.min($('map').clientWidth/900,1))});}}).observe($('map'));
async function init(){try{
if(!citySearch){const data=await fetch('./city-database.json');if(!data.ok)throw Error('City search unavailable');const rows=await data.json();cityIndex=createIndex(rows,cities);if(hardMode){cityPool=createHardCities(rows);if(!cityPool.length)throw Error('No hard-mode cities available');}document.querySelector('.eyebrow').textContent=`GEOGRAPHY · ${cityPool.length.toLocaleString('en')} CITIES`;citySearch=attachCitySearch(cityIndex,{input:$('guess'),list:$('city-options'),status:$('search-status'),onSelect:render,onChange:render});}
const response=await fetch('./map-style.json');if(!response.ok)throw Error('Map style unavailable');const full=await response.json();
full.layers=full.layers.filter(l=>l.type!=='symbol');delete full.sprite;delete full.glyphs;
styles=[{version:8,sources:full.sources,layers:[{id:'background',type:'background',paint:{'background-color':'#202529'}},{id:'major-roads',type:'line',source:'carto','source-layer':'transportation',filter:['in','class','motorway','trunk','primary','secondary'],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#d8dee2','line-opacity':.9,'line-width':['interpolate',['linear'],['zoom'],8,.55,11,1.35,14,3]}}]},full,{version:8,sources:{satellite:{type:'raster',tiles:['https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],tileSize:256,maxzoom:19}},layers:[{id:'satellite',type:'raster',source:'satellite'}]}];nextCity();
}catch(error){mapError();}}
init();
const context=document.modelContext;
if(context?.registerTool){const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
const tools=[{name:'read_city_game',description:'Read the current round, clue level and score. The answer is returned only after the round ends.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>state()},{name:'search_cities',description:'Search the cities database to get city IDs for a guess.',inputSchema:{type:'object',properties:{query:{type:'string',minLength:2}},required:['query'],additionalProperties:false},annotations:{readOnlyHint:true},execute:input=>{if(typeof input?.query!=='string'||input.query.trim().length<2)throw Error('Enter at least two letters.');return searchCities(cityIndex,input.query).map(({id,name,country,region})=>({id,name,country,region}));}},{name:'submit_city_guess',description:'Submit a city ID from search_cities. After a miss on satellite, further guesses earn zero points.',inputSchema:{type:'object',properties:{cityId:{type:'integer'}},required:['cityId'],additionalProperties:false},execute:input=>guess(input?.cityId)},{name:'reveal_city_clue',description:'Reveal the next clue and lower the available score, or show the answer on the final level.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:reveal},{name:'start_next_city',description:'Start another city after the current round has ended.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:()=>{if(!done)throw Error('Finish the current round first.');return nextCity();}}];
for(const tool of tools){try{Promise.resolve(context.registerTool({...tool,annotations:{readOnlyHint:false,...tool.annotations}},{signal:lifecycle.signal})).catch(()=>{});}catch{}}
}
