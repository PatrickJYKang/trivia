import {FigureGame,formatYear,lifeBounds} from './figures-model.js?v=20261027-1';
const $=id=>document.getElementById(id);
let game,map,markers=[],loading=false,world,mapDetailFailed=false;
const state=()=>game?.snapshot()??{ready:false};
function render(){
  const s=state(),ready=!!game?.current;
  $('round').textContent=String(s.round||1).padStart(2,'0');$('attempts').textContent=`${s.guesses?.length??0} / 3`;
  $('guess').disabled=!ready||s.done;$('submit').disabled=!ready||s.done;$('reveal').disabled=!ready||s.done;
  $('play').hidden=!!s.done;$('result').hidden=!s.done;$('figure-context').hidden=!s.done;
  const past=$('past-guesses');past.replaceChildren();past.hidden=!s.guesses?.length;
  for(const guess of s.guesses??[]){const li=document.createElement('li');li.textContent=guess.guess;if(guess.correct)li.className='correct';past.append(li);}
  if(s.done){
    $('answer').textContent=s.answer.name;$('result-detail').textContent=s.won?`Correct · ${s.guesses.length} ${s.guesses.length===1?'guess':'guesses'}`:'Answer revealed';
    $('figure-note').textContent=s.answer.note||'';$('figure-note').hidden=!s.answer.note;
    const sources=$('sources');sources.replaceChildren();for(const source of s.answer.sources){const link=document.createElement('a');link.href=source.url;link.textContent=source.title;link.target='_blank';link.rel='noreferrer';sources.append(link);}
  }
}
function fitMap(){
  if(!map||!game?.current)return;
  const s=state(),layout=lifeBounds(s.birth,s.death),side=$('life-map').clientWidth<600?130:190;
  map.resize();map.fitBounds(layout.bounds,{padding:{top:70,bottom:70,left:side,right:side},maxZoom:8,duration:0});
}
function addDetail(){
  if(map.getLayer('map-detail'))map.removeLayer('map-detail');if(map.getSource('basemap'))map.removeSource('basemap');
  mapDetailFailed=false;$('retry-map').hidden=true;
  map.addSource('basemap',{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,maxzoom:19});
  map.addLayer({id:'map-detail',type:'raster',source:'basemap'});
}
function showMap(){
  const s=state(),layout=lifeBounds(s.birth,s.death);
  if(!map){
    map=new maplibregl.Map({container:'life-map',style:{version:8,sources:{countries:{type:'geojson',data:world}},layers:[{id:'water',type:'background',paint:{'background-color':'#e8eef1'}},{id:'land',type:'fill',source:'countries',paint:{'fill-color':'#f7f7f3'}},{id:'borders',type:'line',source:'countries',paint:{'line-color':'#c5cdd2','line-width':.65}}]},center:[0,25],zoom:1,attributionControl:false,renderWorldCopies:false,fadeDuration:0});
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
    map.on('load',()=>{addDetail();fitMap();});
    map.on('error',event=>{if(event.sourceId==='basemap'&&!mapDetailFailed){mapDetailFailed=true;$('retry-map').hidden=false;if(map.getLayer('map-detail'))map.setLayoutProperty('map-detail','visibility','none');}});
  }
  for(const marker of markers)marker.remove();markers=[];
  const makePin=kind=>{const pin=document.createElement('div');pin.className=`life-pin ${kind}`;return pin;};
  const label=(kind,event,side)=>{const box=document.createElement('div');box.className=`pin-label ${kind} ${side}`;const year=document.createElement('strong'),place=document.createElement('span');year.textContent=`${kind==='birth'?'Born':'Died'} · ${formatYear(event)}`;place.textContent=event.place;box.append(year,place);return box;};
  if(layout.shared){
    const pin=makePin('shared');pin.append(label('birth',s.birth,'left'),label('death',s.death,'right'));
    markers.push(new maplibregl.Marker({element:pin}).setLngLat(layout.birth).addTo(map));
  }else{
    for(const kind of ['birth','death']){const pin=makePin(kind),left=(kind==='birth')===(layout.birth[0]<=layout.death[0]);pin.append(label(kind,s[kind],left?'left':'right'));markers.push(new maplibregl.Marker({element:pin}).setLngLat(layout[kind]).addTo(map));}
  }
  $('life-description').textContent=`Born ${formatYear(s.birth)} in ${s.birth.place}. Died ${formatYear(s.death)} in ${s.death.place}.`;
  fitMap();
}
function next(){
  if(!game)throw Error('Wait for figures to load.');
  game.next();$('guess').value='';$('answer').textContent='';$('figure-note').textContent='';$('sources').replaceChildren();$('figure-context').open=false;$('feedback').textContent='3 guesses.';render();showMap();return state();
}
function guess(name){
  if(!game)throw Error('Wait for figures to load.');
  const accepted=game.guess(name);$('guess').value='';render();
  if(game.done)$('next').focus();else{$('feedback').textContent=accepted?`${game.snapshot().remaining} ${game.snapshot().remaining===1?'guess':'guesses'} left.`:'Already guessed.';$('guess').focus();}
  return state();
}
function reveal(){if(!game)throw Error('Wait for figures to load.');game.reveal();render();$('next').focus();return state();}
$('guess-form').addEventListener('submit',event=>{event.preventDefault();try{guess($('guess').value);}catch(error){$('feedback').textContent=error.message;}});
$('reveal').addEventListener('click',reveal);$('next').addEventListener('click',()=>{next();$('game-title').scrollIntoView({block:'start'});$('guess').focus({preventScroll:true});});
$('fit-map').addEventListener('click',fitMap);$('retry-map').addEventListener('click',addDetail);$('retry').addEventListener('click',init);
new ResizeObserver(()=>{if(map)fitMap();}).observe($('life-map'));
async function init(){
  if(loading||game)return;loading=true;$('retry').hidden=true;$('load-message').textContent='Loading figures…';
  try{
    const [data,geography]=await Promise.all(['./figures-data.json','./world-countries.geojson'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error('Data unavailable');return r.json();}));
    if(!Array.isArray(data.figures)||!data.figures.length)throw Error('No figures');
    world=geography;game=new FigureGame(data.figures);$('figure-game').hidden=false;next();$('pool-label').textContent=`${data.figures.length} FIGURES`;$('load-status').hidden=true;
  }catch{
    game=null;if(map){map.remove();map=null;}markers=[];$('figure-game').hidden=true;
    $('load-message').textContent='Unable to load the game.';$('retry').hidden=false;
  }finally{loading=false;}
}
init();
if(typeof document.modelContext?.registerTool==='function'){
  const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});const empty={type:'object',properties:{},additionalProperties:false};
  const tools=[
    {name:'read_life_map',description:'Read birth and death years and places, guesses and remaining attempts. The identity is hidden until the round ends.',inputSchema:empty,annotations:{readOnlyHint:true},execute:state},
    {name:'guess_life_map_figure',description:'Guess a historical figure by name. Three different wrong guesses reveal the answer; repeated guesses do not consume attempts.',inputSchema:{type:'object',properties:{name:{type:'string',minLength:1,maxLength:150}},required:['name'],additionalProperties:false},execute:input=>guess(input?.name)},
    {name:'reveal_life_map_figure',description:'End the round and reveal the figure and sources.',inputSchema:empty,execute:reveal},
    {name:'next_life_map_figure',description:'Start the next figure after the current round ends.',inputSchema:empty,execute:next}
  ];for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool({...tool,annotations:{readOnlyHint:false,...tool.annotations}},{signal:lifecycle.signal})).catch(()=>{});}catch{}}
}
