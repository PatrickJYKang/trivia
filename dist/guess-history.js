// Great-circle distance and initial bearing from the guess to the answer.
export function directionTo(from,to){
 const rad=Math.PI/180,[lon1,lat1]=from.map(v=>v*rad),[lon2,lat2]=to.map(v=>v*rad);
 const delta=lon2-lon1;
 const a=Math.sin((lat2-lat1)/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(delta/2)**2;
 const distanceKm=6371.0088*2*Math.asin(Math.sqrt(Math.min(1,Math.max(0,a))));
 const y=Math.sin(delta)*Math.cos(lat2),x=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(delta);
 const bearing=distanceKm<0.001||Math.hypot(x,y)<1e-12?null:(Math.atan2(y,x)/rad+360)%360;
 const direction=bearing===null?(distanceKm<0.001?'Same location':'Opposite side of Earth'):['N','NE','E','SE','S','SW','W','NW'][Math.round(bearing/45)%8];
 return {distanceKm,bearing,direction};
}
export function recordGuess(guess,answer){return {id:guess.id,name:guess.name,country:guess.country,...directionTo(guess.center,answer.center)};}
export function visibleHistory(history,minimumMisses=1){return history.length>=minimumMisses?history:[];}
export function renderGuessHistory(container,history,minimumMisses=1){
 const rows=visibleHistory(history,minimumMisses);container.hidden=!rows.length;
 const list=container.querySelector('ol');list.replaceChildren();
 rows.forEach((entry,i)=>{
  const row=document.createElement('li'),name=document.createElement('span'),arrow=document.createElement('span'),distance=document.createElement('span');
  name.className='guess-name';name.textContent=`${i+1}. ${entry.name}`;name.title=entry.country;
  arrow.className='guess-direction';
  if(entry.bearing!==null){const glyph=document.createElement('span');glyph.className='direction-arrow';glyph.textContent='↑';glyph.style.transform=`rotate(${entry.bearing}deg)`;glyph.setAttribute('aria-hidden','true');arrow.append(glyph);}
  const compass=document.createElement('span');compass.textContent=entry.direction;arrow.append(compass);
  arrow.setAttribute('aria-label',`${entry.direction} from your guess toward the answer`);
  distance.className='guess-distance';distance.textContent=entry.distanceKm>0&&entry.distanceKm<1?'<1 km':`${Math.round(entry.distanceKm).toLocaleString('en')} km`;
  row.append(name,arrow,distance);list.append(row);
 });
}
