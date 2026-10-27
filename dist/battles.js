import {BattleGame} from './battles-model.js';

const $=id=>document.getElementById(id);
let game,loading=false;
function state(){return game?.snapshot()??{stage:'loading'};}

function render(){
  const s=state();if(!s.battle)return;
  const finished=s.stage==='complete',chosen=s.stage!=='winner';
  $('round').textContent=String(s.round).padStart(2,'0');$('score').textContent=s.score;
  $('battle-name').textContent=s.battle.name;$('battle-date').textContent=s.battle.date;
  $('side-question').textContent=chosen?'Winning side':'Who won?';
  $('winner-status').textContent=chosen?(s.winnerPoints?'+1 point':'0 points'):'+1 point';
  const sides=$('sides');sides.replaceChildren();
  s.battle.sides.forEach((side,i)=>{
    const button=document.createElement(finished?'div':'button');button.className='battle-side';
    if(!finished){button.type='button';button.disabled=chosen;}
    if(chosen&&i===s.battle.winner)button.classList.add('winner');
    if(chosen&&i===s.picked)button.classList.add('picked');
    const name=document.createElement('span');name.className='side-name';name.textContent=side.name;
    const belligerents=document.createElement('span');belligerents.className='side-belligerents';belligerents.textContent=side.belligerents.join(' · ');
    button.append(name);
    if(side.belligerents.length!==1||side.belligerents[0].toLocaleLowerCase('en')!==side.name.toLocaleLowerCase('en'))button.append(belligerents);
    if(chosen){const status=document.createElement('span');status.className='side-status';status.textContent=[i===s.battle.winner?'Winner':null,i===s.picked?'Your pick':null].filter(Boolean).join(' · ');if(status.textContent)button.append(status);}
    if(finished){
      const roster=document.createElement('details');roster.className='side-commanders';
      roster.open=!!s.commanderAnswer?.skipped;
      const summary=document.createElement('summary');summary.textContent=`Commanders (${side.commanders.length})`;roster.append(summary);
      for(const person of side.commanders){const row=document.createElement('span');row.textContent=person;if(s.commanderAnswer?.name===person&&s.commanderAnswer.side===i)row.className='matched';roster.append(row);}
      button.append(roster);
    }
    if(!finished)button.addEventListener('click',()=>pickWinner(i));sides.append(button);
  });
  $('commander-area').hidden=!chosen;$('commander-play').hidden=s.stage!=='commander';$('battle-result').hidden=!finished;$('battle-context').hidden=!finished;
  if(finished){
    $('result-title').textContent=`+${s.roundPoints} / 4 points`;
    const answer=s.commanderAnswer;
    $('result-detail').textContent=answer.skipped?'Commander skipped.':s.commanderPoints?`${answer.name} · ${answer.side===s.battle.winner?'Winning':'Losing'} side · +${s.commanderPoints}`:`“${answer.guess}” — not a listed commander.`;
    $('battle-note').textContent=s.battle.note||'';$('battle-note').hidden=!s.battle.note;
    const sources=$('sources');sources.replaceChildren();for(const source of s.battle.sources){const a=document.createElement('a');a.href=source.url;a.textContent=source.title;a.target='_blank';a.rel='noreferrer';sources.append(a);}
  }
}
function next(){
  if(!game)throw Error('Wait for battles to load.');
  game.next();$('commander').value='';$('commander-feedback').textContent='';$('battle-context').open=false;$('battle-note').textContent='';$('sources').replaceChildren();render();return state();
}
function pickWinner(side){if(!game)throw Error('Wait for battles to load.');game.pickWinner(side);render();$('commander').focus({preventScroll:true});return state();}
function guessCommander(name){if(!game)throw Error('Wait for battles to load.');game.guessCommander(name);render();$('next').focus();return state();}
function skipCommander(){
  if(!game)throw Error('Wait for battles to load.');
  game.skipCommander();render();
  document.querySelector('.side-commanders summary').focus({preventScroll:true});
  $('sides').scrollIntoView({block:'start'});
  return state();
}
$('commander-form').addEventListener('submit',event=>{event.preventDefault();try{guessCommander($('commander').value);}catch(error){$('commander-feedback').textContent=error.message;}});
$('skip').addEventListener('click',skipCommander);
$('next').addEventListener('click',()=>{next();$('battle-name').scrollIntoView({block:'start'});document.querySelector('#sides button').focus({preventScroll:true});});
$('retry').addEventListener('click',init);
async function init(){
  if(loading||game)return;loading=true;$('retry').hidden=true;$('load-message').textContent='Loading battles…';
  try{
    const response=await fetch('./battles-data.json');if(!response.ok)throw Error('Data unavailable');
    const data=await response.json();if(!Array.isArray(data.battles)||!data.battles.length)throw Error('No battles');
    game=new BattleGame(data.battles);next();$('pool-label').textContent=`${data.battles.length} BATTLES`;$('load-status').hidden=true;$('battle-play').hidden=false;
  }catch{$('load-message').textContent='Unable to load battles.';$('retry').hidden=false;}finally{loading=false;}
}
init();

if(typeof document.modelContext?.registerTool==='function'){
  const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const empty={type:'object',properties:{},additionalProperties:false};
  const tools=[
    {name:'read_battle_leaders',description:'Read the current battle, belligerents, stage and score. Commanders and sources appear after the round.',inputSchema:empty,annotations:{readOnlyHint:true},execute:state},
    {name:'pick_battle_winner',description:'Choose displayed side 0 or 1 as the winner, for one point if correct.',inputSchema:{type:'object',properties:{side:{type:'integer',enum:[0,1]}},required:['side'],additionalProperties:false},execute:input=>pickWinner(input?.side)},
    {name:'name_battle_commander',description:'Submit the one commander attempt: three points for a winning commander or one for a losing commander.',inputSchema:{type:'object',properties:{name:{type:'string',minLength:1,maxLength:150}},required:['name'],additionalProperties:false},execute:input=>guessCommander(input?.name)},
    {name:'skip_battle_commander',description:'Skip the commander attempt and reveal both commander lists and sources.',inputSchema:empty,execute:skipCommander},
    {name:'next_battle_leaders',description:'Start the next battle after the current round is complete.',inputSchema:empty,execute:next}
  ];
  for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool({...tool,annotations:{readOnlyHint:false,...tool.annotations}},{signal:lifecycle.signal})).catch(()=>{});}catch{}}
}
