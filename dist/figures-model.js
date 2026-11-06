export function normalizeName(value){
  return value.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('en').replace(/['’]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}
// Count typing edits, including adjacent letters entered in the wrong order.
function spellingDistance(a,b){
  a=[...a];b=[...b];
  const rows=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
  for(let i=0;i<=a.length;i++)rows[i][0]=i;
  for(let j=0;j<=b.length;j++)rows[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
    rows[i][j]=Math.min(rows[i-1][j]+1,rows[i][j-1]+1,rows[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])rows[i][j]=Math.min(rows[i][j],rows[i-2][j-2]+1);
  }
  return rows[a.length][b.length];
}
const nameNumbers=name=>name.split(' ').filter(word=>/^(?:[ivx]+|\d+)$/.test(word)).join(' ');
function resolveName(key,names){
  const exact=names.get(key);
  if(exact?.size>1)throw Error('Enter a fuller name.');
  if(exact?.size===1)return [...exact][0];
  const compact=key.replace(/ /g,''),numbers=nameNumbers(key);
  let best=Infinity,matches=new Set();
  for(const [name,ids] of names){
    const candidate=name.replace(/ /g,''),length=Math.min([...compact].length,[...candidate].length);
    const limit=length<3?0:length<6?1:length<15?2:3;
    if(Math.abs([...compact].length-[...candidate].length)>limit)continue;
    // Never turn a missing or different regnal number into a different ruler.
    if(compact!==candidate&&numbers!==nameNumbers(name))continue;
    const distance=spellingDistance(compact,candidate);
    if(distance>limit||distance>best)continue;
    if(distance<best){best=distance;matches=new Set();}
    for(const id of ids)matches.add(id);
  }
  if(matches.size>1)throw Error('Enter a fuller or more precise name.');
  return matches.size===1?[...matches][0]:null;
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
    const key=normalizeName(value),id=resolveName(key,this.names);
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
