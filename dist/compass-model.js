import {createHardCities} from './hard-cities.js';
import {directionTo} from './guess-history.js';
import {rankByNotability} from './compass-notability.js';
export function createCompassPools(rows){
 const byId=new Map(rows.map(r=>[r[0],r]));
 const pool=createHardCities(rows).map(c=>({...c,code:byId.get(c.id)[2]}));
 const ranked=rankByNotability(pool,byId);
 const clues=ranked.map((city,i)=>({...city,difficultyRank:i+1}));
 return {targets:clues.slice(0,200),clues};
}
export function shuffled(values,random=Math.random){const deck=[...values];for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
const separation=(a,b)=>Math.min(Math.abs(a-b),360-Math.abs(a-b));
// Straight-line direction on a single north-up Mercator world map. Keep the
// full longitude difference: never wrap at the date line or route over a pole.
// Physical distances still use great circles, independently of diagram arrows.
export function mapBearing(from,to){
 const radians=Math.PI/180;
 const northing=latitude=>Math.log(Math.tan(Math.PI/4+latitude*radians/2));
 const dx=(to[0]-from[0])*radians,dy=northing(to[1])-northing(from[1]);
 if(dx===0&&dy===0)return null;
 return (Math.atan2(dx,dy)/radians+360)%360;
}
export function clueCandidates(target,pool){
 const candidates=pool.filter(c=>c.id!==target.id).map(city=>({...city,distanceKm:directionTo(target.center,city.center).distanceKm,bearing:mapBearing(target.center,city.center)})).filter(c=>c.bearing!==null&&c.distanceKm>=350&&c.distanceKm<18500).sort((a,b)=>a.distanceKm-b.distanceKm||a.id-b.id);
 const fifth=Math.ceil(candidates.length/5);
 return candidates.map((city,i)=>({...city,difficultyTier:city.difficultyRank<=100?'easy':city.difficultyRank>=500?'hard':'middle',distanceTier:i<fifth?'close':i>=candidates.length-fifth?'far':'middle'}));
}
const tierSlots=(first,last,a,b)=>[...Array(a).fill(first),...Array(b).fill(last),...Array(5-a-b).fill('middle')];

// Match independently drawn difficulty and distance quotas. Backtracking only
// changes their pairing, never relaxes either quota or pins easy clues nearby.
function pairSlots(difficulty,distances,cells,random){
 const used=new Map(),pairs=[];
 function visit(i,remaining){
  if(i===difficulty.length)return true;
  for(const distance of shuffled([...new Set(remaining)],random)){
   const key=`${difficulty[i]}/${distance}`,count=used.get(key)||0;
   if(count>=(cells.get(key)?.length||0))continue;
   used.set(key,count+1);pairs.push(key);
   const next=[...remaining];next.splice(next.indexOf(distance),1);
   if(visit(i+1,next))return true;
   used.set(key,count);pairs.pop();
  }
  return false;
 }
 if(!visit(0,distances))throw Error('Unable to match clue quotas.');
 return pairs;
}
export function chooseClues(target,pool,random=Math.random){
 const candidates=clueCandidates(target,pool),cells=new Map(),chosen=[];
 for(const city of candidates){const key=`${city.difficultyTier}/${city.distanceTier}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(city);}
 const easyCount=1+Math.floor(random()*2),hardCount=1+Math.floor(random()*2),closeCount=1+Math.floor(random()*2),farCount=1+Math.floor(random()*2);
 const difficulty=shuffled(tierSlots('easy','hard',easyCount,hardCount),random);
 const distances=tierSlots('close','far',closeCount,farCount);
 const slots=pairSlots(difficulty,distances,cells,random);
 // Country and bearing variety are optimized inside each matched cell.
 for(const key of slots){
  const available=cells.get(key).filter(c=>!chosen.some(s=>s.id===c.id));
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
