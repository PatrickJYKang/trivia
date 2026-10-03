import {BingoGame,categories,cardIndex} from './bingo-model.js';
const $=id=>document.getElementById(id);
let data,game,active=cardIndex(location.search),buttons=[];
function state(){return {card:active+1,name:game?.card.name,currentCity:game?.current?.name??null,cityNumber:game?Math.min(game.cursor+1,game.card.deck.length):0,filled:game?.count??0,lines:game?.lines.length??0,wildcardAvailable:game?!game.wildcardUsed:false,done:game?.done??false,categories:game?.card.categories.map((key,i)=>({cell:i+1,label:categories[key].label,filledBy:game.filled[i]?.name??null}))??[]};}
function render(){
 $('filled-count').textContent=`${game.count}/16`;$('line-count').textContent=game.lines.length;
 $('city-number').textContent=game.done?'ROUND OVER':`CITY ${game.cursor+1} OF ${game.card.deck.length}`;
 $('current-city').textContent=game.done?(game.count===16?'Card complete':'End of the cities'):game.current.name;
 $('skip').disabled=game.done;$('wildcard').disabled=game.done||game.wildcardUsed;
 $('wildcard').textContent=game.wildcardUsed?'Wildcard used':'Wildcard ×1';
 const lined=new Set(game.lines.flat());
 buttons.forEach((button,i)=>{const city=game.filled[i],label=categories[game.card.categories[i]].label;button.disabled=game.done||!!city;button.classList.toggle('filled',!!city);button.classList.toggle('bingo-line',lined.has(i));button.querySelector('.square-city').textContent=city?.name??'';button.querySelector('.square-check').textContent=city?'✓':'';button.setAttribute('aria-label',`${label}${city?`, filled with ${city.name}`:', empty'}`);});
 $('bingo-result').hidden=!game.done;
 if(game.done){$('result-title').textContent=game.count===16?'Full card!':`${game.count} of 16 squares`;$('result-summary').textContent=`${game.lines.length} bingo ${game.lines.length===1?'line':'lines'} · ${game.mistakes} ${game.mistakes===1?'mistake':'mistakes'}. ${game.count===16?'Try the next demo card.':'Replay this sequence or try the next card.'}`;}
}
function start(n){
 active=n;game=new BingoGame(data.cards[n],data.cities);buttons=[];
 history.replaceState(null,'',`bingo.html?card=${n+1}`);document.title=`Trivia — City Bingo · Card ${n+1}`;
 $('card-label').textContent=`DEMO · CARD ${n+1} OF 5`;$('card-name').textContent=game.card.name;$('demo-position').textContent=`${n+1} / 5`;
 $('bingo-feedback').textContent='Place this city in one matching square.';
 $('bingo-board').replaceChildren();$('category-details').replaceChildren();
 game.card.categories.forEach((key,i)=>{const def=categories[key],button=document.createElement('button');button.className='bingo-square';button.title=def.detail;button.dataset.cell=i;for(const name of ['square-category','square-city','square-check']){const span=document.createElement('span');span.className=name;if(name==='square-category')span.textContent=def.label;button.append(span);}button.addEventListener('click',()=>play('place',i));$('bingo-board').append(button);buttons.push(button);const term=document.createElement('dt'),detail=document.createElement('dd');term.textContent=def.label;detail.textContent=def.detail;$('category-details').append(term,detail);});
 $('restart').disabled=false;$('next-card').disabled=false;render();return state();
}
function play(action,cell){
 if(!game||game.done)return state();const before=game.lines.length;const result=action==='place'?game.place(cell):action==='skip'?game.skip():game.wildcard();
 if(result.type==='ignored')return state();
 const feedback=result.type==='placed'?`${result.city.name} placed in ${categories[game.card.categories[result.cell]].label}.`:result.type==='miss'?`${result.city.name} doesn’t match ${categories[game.card.categories[result.cell]].label}.${result.skipped?` Penalty: ${result.skipped.name} skipped.`:''}`:result.type==='skip'?`${result.city.name} skipped.`:`Wildcard: ${result.city.name} filled ${result.cells.length} ${result.cells.length===1?'square':'squares'}.`;
 render();$('bingo-feedback').textContent=feedback+(game.lines.length>before?' Bingo!':'');
 // Keep keyboard play moving after the pressed square becomes disabled.
 if(game.done)$('next-card').focus();else if(document.activeElement?.disabled)(buttons.find(b=>!b.disabled)||$('skip')).focus();
 return state();
}
$('skip').addEventListener('click',()=>play('skip'));$('wildcard').addEventListener('click',()=>play('wildcard'));$('restart').addEventListener('click',()=>start(active));$('next-card').addEventListener('click',()=>start((active+1)%data.cards.length));$('retry').addEventListener('click',init);
async function init(){try{$('retry').hidden=true;const response=await fetch('./bingo-data.json');if(!response.ok)throw Error('Unavailable');data=await response.json();if(data.cards.length!==5)throw Error('Invalid cards');start(active);}catch{$('current-city').textContent='Unable to load cities';$('bingo-feedback').textContent='Try loading the demo again.';$('retry').hidden=false;}}
init();
if(document.modelContext?.registerTool){const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});const schema={type:'object',properties:{},additionalProperties:false};
 const tools=[{name:'read_city_bingo',description:'Read the current city, bingo categories and filled squares.',inputSchema:schema,annotations:{readOnlyHint:true},execute:state},{name:'place_bingo_city',description:'Place the current city in a category cell numbered 1–16. A wrong choice skips the next city.',inputSchema:{type:'object',properties:{cell:{type:'integer',minimum:1,maximum:16}},required:['cell'],additionalProperties:false},execute:({cell})=>play('place',cell-1)},{name:'skip_bingo_city',description:'Skip the current city without a penalty.',inputSchema:schema,execute:()=>play('skip')},{name:'use_bingo_wildcard',description:'Once per card, fill all matching empty categories with the current city.',inputSchema:schema,execute:()=>play('wildcard')},{name:'next_bingo_card',description:'Start the next of five fixed demo cards, wrapping after card five.',inputSchema:schema,execute:()=>{if(!data)throw Error('Wait for the game to load.');return start((active+1)%5);}}];for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool({...tool,annotations:{readOnlyHint:false,...tool.annotations}},{signal:lifecycle.signal})).catch(()=>{});}catch{}}}
