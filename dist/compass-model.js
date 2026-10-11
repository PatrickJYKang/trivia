import {createHardCities} from './hard-cities.js';
import {directionTo} from './guess-history.js';
export function createCompassPools(rows){
 const byId=new Map(rows.map(r=>[r[0],r]));
 const targets=createHardCities(rows).map(c=>({...c,code:byId.get(c.id)[2]}));
 return {targets,clues:[...targets]};
}
export function shuffled(values,random=Math.random){const deck=[...values];for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
const separation=(a,b)=>Math.min(Math.abs(a-b),360-Math.abs(a-b));
export function chooseClues(target,pool,random=Math.random){
 const candidates=pool.filter(c=>c.id!==target.id).map(city=>({...city,...directionTo(target.center,city.center)})).filter(c=>c.bearing!==null&&c.distanceKm>=350&&c.distanceKm<18500);
 const nearby=candidates.filter(c=>c.distanceKm<=4000),faraway=candidates.filter(c=>c.distanceKm>=5000),chosen=[];
 // Country-balanced sampling avoids letting populous countries dominate the clues.
 for(const band of [nearby,faraway,nearby,faraway,faraway]){
  const available=(band.some(c=>!chosen.some(s=>s.id===c.id))?band:candidates).filter(c=>!chosen.some(s=>s.id===c.id));
  const groups=new Map();for(const c of available){if(!groups.has(c.code))groups.set(c.code,[]);groups.get(c.code).push(c);}
  const countryPools=[...groups.values()];if(!countryPools.length)throw Error('Not enough reference cities');
  let best,bestScore=-Infinity;
  for(let n=0;n<60;n++){const group=countryPools[Math.floor(random()*countryPools.length)],c=group[Math.floor(random()*group.length)];const gap=chosen.length?Math.min(...chosen.map(s=>separation(c.bearing,s.bearing))):90;const score=Math.min(gap,65)+(chosen.some(s=>s.code===c.code)?0:45)+random()*18;if(score>bestScore){best=c;bestScore=score;}}
  chosen.push(best);
 }
 return chosen.sort((a,b)=>a.bearing-b.bearing);
}
export function clueLayout(clues,compact=false){
 const width=compact?720:960,height=compact?720:620,cx=width/2,cy=height/2,radius=compact?136:160;
 const entries=clues.map((clue,i)=>{const angle=clue.bearing*Math.PI/180,dx=Math.sin(angle),dy=-Math.cos(angle);return {...clue,number:i+1,side:dx<0?'left':'right',start:{x:cx+dx*78,y:cy+dy*78},tip:{x:cx+dx*radius,y:cy+dy*radius},labelY:cy+dy*radius*1.6};});
 for(const side of ['left','right']){const bank=entries.filter(c=>c.side===side).sort((a,b)=>a.labelY-b.labelY);const gap=compact?112:96,min=65,max=height-65;for(let i=0;i<bank.length;i++)bank[i].labelY=Math.max(min,bank[i].labelY,i?bank[i-1].labelY+gap:min);if(bank.length&&bank.at(-1).labelY>max){bank.at(-1).labelY=max;for(let i=bank.length-2;i>=0;i--)bank[i].labelY=Math.min(bank[i].labelY,bank[i+1].labelY-gap);}}
 return {width,height,cx,cy,radius,entries};
}
export class CompassRound{
 constructor(answer,clues){this.answer=answer;this.clues=clues;this.guesses=[];this.done=false;this.won=false;}
 guess(city){if(this.done)throw Error('Start another round.');if(this.guesses.some(c=>c.id===city.id))return false;this.guesses.push(city);if(city.id===this.answer.id){this.done=true;this.won=true;}return true;}
 giveUp(){this.done=true;}
}
