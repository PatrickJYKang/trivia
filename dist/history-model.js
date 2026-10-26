export function formatPeriod({start,end,approximate=false}) {
  let dates;
  if (end === null) dates = `${start < 0 ? `${-start} BC` : start}–present`;
  else if (start === end) dates = start < 0 ? `${-start} BC` : String(start);
  else if (start < 0 && end < 0) dates = `${-start}–${-end} BC`;
  else if (start < 0) dates = `${-start} BC–AD ${end}`;
  else dates = `${start}–${end}`;
  return `${approximate ? 'c. ' : ''}${dates}`;
}

function shuffle(values,random) {
  const deck=[...values];
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  return deck;
}

export class HistoryGame {
  constructor(entries,random=Math.random) {
    if(!entries.length)throw Error('No city histories available.');
    this.entries=entries;this.random=random;this.deck=[];this.round=0;this.current=null;
  }
  next() {
    if(this.current&&!this.done)throw Error('Finish the current round first.');
    const previous=this.current?.id;
    if(!this.deck.length){
      this.deck=shuffle(this.entries,this.random);
      if(this.deck.length>1&&this.deck.at(-1).id===previous)[this.deck[0],this.deck[this.deck.length-1]]=[this.deck.at(-1),this.deck[0]];
    }
    this.current=this.deck.pop();this.guesses=[];this.done=false;this.won=false;this.round++;
    return this.snapshot();
  }
  guess(city) {
    if(!this.current||this.done)throw Error('Wait for an active round.');
    if(!Number.isInteger(city?.id)||typeof city.name!=='string')throw Error('Choose a city from the database.');
    if(this.guesses.some(c=>c.id===city.id))return false;
    this.guesses.push({id:city.id,name:city.name,country:city.country});
    if(city.id===this.current.id){this.won=true;this.done=true;}
    return true;
  }
  giveUp() {
    if(!this.current||this.done)throw Error('Wait for an active round.');
    this.done=true;
    return this.snapshot();
  }
  snapshot() {
    return {round:this.round,poolSize:this.entries.length,done:this.done??false,won:this.won??false,
      guesses:(this.guesses??[]).map(c=>({...c})),
      periods:this.current?.periods.map(p=>({dates:formatPeriod(p),control:p.label}))??[],
      ...(this.done?{answer:{id:this.current.id,name:this.current.name,country:this.current.country,note:this.current.note,sources:this.current.sources}}:{})};
  }
}
