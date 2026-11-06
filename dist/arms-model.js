export function normalizeCountry(value){
  return value.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('en').replace(/\b(?:[a-z]\.){2,}/g,initials=>initials.replace(/\./g,'')).replace(/['’]/g,'').replace(/&/g,' and ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ').replace(/^the /,'');
}
function shuffle(values,random){const deck=[...values];for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
export class ArmsGame{
  constructor(countries,random=Math.random){
    if(!Array.isArray(countries)||!countries.length)throw Error('No countries available.');
    this.countries=countries;this.random=random;this.deck=[];this.current=null;this.round=0;this.names=new Map();
    for(const country of countries)for(const name of [country.name,...country.aliases]){
      const key=normalizeCountry(name),ids=this.names.get(key)||new Set();ids.add(country.id);this.names.set(key,ids);
    }
  }
  next(){
    if(this.current&&!this.done)throw Error('Finish this round first.');
    const previous=this.current?.id;
    if(!this.deck.length){this.deck=shuffle(this.countries,this.random);if(this.deck.length>1&&this.deck.at(-1).id===previous)[this.deck[0],this.deck[this.deck.length-1]]=[this.deck.at(-1),this.deck[0]];}
    this.current=this.deck.pop();this.round++;this.done=false;this.won=false;this.guesses=[];return this.snapshot();
  }
  guess(value){
    if(!this.current||this.done)throw Error('Wait for an active round.');
    if(typeof value!=='string'||value.length>150||!normalizeCountry(value))throw Error('Enter a country name.');
    const key=normalizeCountry(value),matches=this.names.get(key);
    if(matches?.size>1)throw Error('Enter a more specific country name.');
    const id=matches?.size===1?[...matches][0]:null;
    if(this.guesses.some(g=>id?g.id===id:g.key===key))return false;
    const correct=id===this.current.id;
    this.guesses.push({guess:value.trim(),key,id,correct});
    if(correct){this.done=true;this.won=true;}
    return true;
  }
  reveal(){if(!this.current||this.done)throw Error('Wait for an active round.');this.done=true;return this.snapshot();}
  snapshot(){
    return {round:this.round,poolSize:this.countries.length,done:this.done??false,won:this.won??false,guesses:(this.guesses??[]).map(({guess,correct})=>({guess,correct})),
      ...(this.current?{image:this.current.image}:{}),
      ...(this.done?{answer:{name:this.current.name,note:this.current.note,adaptation:this.current.adaptation,source:this.current.source,credit:this.current.credit,license:this.current.license}}:{})};
  }
}
