export function normalizeCommander(value) {
  return value.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('en')
    .replace(/['’]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}

function shuffle(values,random) {
  const deck=[...values];
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  return deck;
}

export function matchCommander(battle,query) {
  const key=normalizeCommander(query);
  if(!key)return [];
  return battle.sides.flatMap((side,sideIndex)=>side.commanders
    .filter(person=>[person.name,...person.aliases].some(name=>normalizeCommander(name)===key))
    .map(person=>({name:person.name,side:sideIndex})));
}

export class BattleGame {
  constructor(battles,random=Math.random) {
    if(!battles.length)throw Error('No battles available.');
    this.battles=battles;this.random=random;this.deck=[];this.current=null;this.round=0;this.score=0;
  }
  next() {
    if(this.current&&this.stage!=='complete')throw Error('Finish this battle first.');
    const previous=this.current?.id;
    if(!this.deck.length){
      this.deck=shuffle(this.battles,this.random);
      if(this.deck.length>1&&this.deck.at(-1).id===previous)[this.deck[0],this.deck[this.deck.length-1]]=[this.deck.at(-1),this.deck[0]];
    }
    const battle=this.deck.pop();
    const order=this.random()<.5?[0,1]:[1,0];
    this.current={...battle,sides:order.map(i=>battle.sides[i]),winner:order.indexOf(battle.winner)};
    this.round++;this.stage='winner';this.picked=null;this.roundPoints=0;this.winnerPoints=0;this.commanderPoints=0;this.commanderAnswer=null;
    return this.snapshot();
  }
  pickWinner(side) {
    if(this.stage!=='winner')throw Error('Choose a winner only once per battle.');
    if(side!==0&&side!==1)throw Error('Choose one of the two sides.');
    this.picked=side;this.winnerPoints=side===this.current.winner?1:0;
    this.roundPoints+=this.winnerPoints;this.score+=this.winnerPoints;this.stage='commander';
    return this.snapshot();
  }
  guessCommander(query) {
    if(this.stage!=='commander')throw Error('Pick a winner before naming a commander.');
    if(typeof query!=='string'||!query.trim()||query.length>150)throw Error('Enter a commander’s name.');
    const matches=matchCommander(this.current,query);
    if(matches.length>1)throw Error('That name is ambiguous. Enter a fuller name.');
    const match=matches[0];
    this.commanderAnswer={guess:query.trim(),...(match?{name:match.name,side:match.side}:{}),skipped:false};
    this.commanderPoints=match?(match.side===this.current.winner?3:1):0;
    this.roundPoints+=this.commanderPoints;this.score+=this.commanderPoints;this.stage='complete';
    return this.snapshot();
  }
  skipCommander() {
    if(this.stage!=='commander')throw Error('Pick a winner before skipping the commander.');
    this.commanderAnswer={skipped:true};this.stage='complete';return this.snapshot();
  }
  snapshot() {
    return {round:this.round,score:this.score,roundPoints:this.roundPoints??0,stage:this.stage??'loading',poolSize:this.battles.length,
      ...(this.current?{battle:{id:this.current.id,name:this.current.name,date:this.current.date,
        sides:this.current.sides.map(side=>({name:side.name,belligerents:[...side.belligerents],
          ...(this.stage==='complete'?{commanders:side.commanders.map(p=>p.name)}:{})})),
        ...(this.stage!=='winner'?{winner:this.current.winner}:{}),
        ...(this.stage==='complete'?{note:this.current.note,sources:this.current.sources}:{})},
        picked:this.picked,winnerPoints:this.winnerPoints,commanderPoints:this.commanderPoints,
        ...(this.stage==='complete'?{commanderAnswer:this.commanderAnswer}:{})}: {})};
  }
}
