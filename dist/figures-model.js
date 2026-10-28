export function normalizeName(value){
  return value.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('en').replace(/['’]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}
export function formatYear(event){return `${event.approximate?'c. ':''}${event.year<0?`${-event.year} BC`:event.year}`;}
export function lifeBounds(birth,death){
  const a=[...birth.coordinates],b=[...death.coordinates];
  if(b[0]-a[0]>180)b[0]-=360;else if(a[0]-b[0]>180)b[0]+=360;
  return {birth:a,death:b,bounds:[[Math.min(a[0],b[0]),Math.min(a[1],b[1])],[Math.max(a[0],b[0]),Math.max(a[1],b[1])]],shared:Math.abs(a[0]-b[0])<.00001&&Math.abs(a[1]-b[1])<.00001};
}
function shuffle(values,random){const deck=[...values];for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
export class FigureGame{
  constructor(figures,random=Math.random){
    if(!figures.length)throw Error('No figures available.');
    this.figures=figures;this.random=random;this.deck=[];this.current=null;this.round=0;
    this.names=new Map();
    for(const figure of figures)for(const name of [figure.name,...figure.aliases]){
      const key=normalizeName(name),ids=this.names.get(key)||new Set();ids.add(figure.id);this.names.set(key,ids);
    }
  }
  next(){
    if(this.current&&!this.done)throw Error('Finish this round first.');
    const previous=this.current?.id;
    if(!this.deck.length){this.deck=shuffle(this.figures,this.random);if(this.deck.length>1&&this.deck.at(-1).id===previous)[this.deck[0],this.deck[this.deck.length-1]]=[this.deck.at(-1),this.deck[0]];}
    this.current=this.deck.pop();this.round++;this.done=false;this.won=false;this.guesses=[];return this.snapshot();
  }
  guess(value){
    if(!this.current||this.done)throw Error('Wait for an active round.');
    if(typeof value!=='string'||value.length>150||!normalizeName(value))throw Error('Enter a person’s name.');
    const key=normalizeName(value),matches=this.names.get(key);
    if(matches?.size>1)throw Error('Enter a fuller name.');
    const id=matches?.size===1?[...matches][0]:null;
    if(this.guesses.some(g=>id?g.id===id:g.key===key))return false;
    const correct=id===this.current.id;
    this.guesses.push({guess:value.trim(),key,id,correct});
    if(correct){this.done=true;this.won=true;}else if(this.guesses.length===3)this.done=true;
    return true;
  }
  reveal(){if(!this.current||this.done)throw Error('Wait for an active round.');this.done=true;return this.snapshot();}
  snapshot(){
    const event=e=>({year:e.year,place:e.place,coordinates:[...e.coordinates],...(e.approximate?{approximate:true}:{})});
    return {round:this.round,poolSize:this.figures.length,done:this.done??false,won:this.won??false,remaining:3-(this.guesses?.length??0),
      guesses:(this.guesses??[]).map(({guess,correct})=>({guess,correct})),
      ...(this.current?{birth:event(this.current.birth),death:event(this.current.death)}:{}),
      ...(this.done?{answer:{name:this.current.name,note:this.current.note,sources:this.current.sources}}:{})};
  }
}
