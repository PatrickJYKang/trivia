export const normalize = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export function createIndex(rows, gameCities = []) {
  const countries = new Intl.DisplayNames(['en'], {type: 'region'});
  const extras = new Map(gameCities.map(c => [c.id, [c.name, ...c.aliases]]));
  return rows.map(([id, name, code, region, population, aliases]) => {
    const country = countries.of(code) || code;
    const names = [...new Set([name, ...aliases, ...(extras.get(id) || [])].map(normalize))];
    return {id, name, country, region, population, names, primary: normalize(name), context: normalize(`${region} ${country} ${code}`)};
  });
}
export function searchCities(index, query, limit = 8) {
  const q = normalize(query);
  if (q.length < 2) return [];
  const tokens = q.split(' ');
  const results = [];
  for (const city of index) {
    let rank = city.primary === q ? 0 : city.names.includes(q) ? 1 : city.primary.startsWith(q) ? 2 : city.names.some(n => n.startsWith(q)) ? 3 : city.primary.includes(q) ? 4 : -1;
    if (rank < 0 && tokens.length > 1 && city.names.some(n => tokens.every(t => `${n} ${city.context}`.includes(t)))) rank = 5;
    if (rank >= 0) results.push({city, rank});
  }
  return results.sort((a,b) => a.rank-b.rank || b.city.population-a.city.population).slice(0,limit).map(r=>r.city);
}
export function attachCitySearch(index, {input, list, status, onSelect, onChange}) {
  let results = [], active = -1, selected = null;
  const label = c => `${c.name}, ${c.region ? c.region + ', ' : ''}${c.country}`;
  function close() {list.hidden = true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active = -1;}
  function select(city) {selected=city;input.value=label(city);close();status.textContent=`Selected ${label(city)}.`;onSelect(city);}
  function highlight() { [...list.children].forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));if(active>=0){input.setAttribute('aria-activedescendant',list.children[active].id);list.children[active].scrollIntoView({block:'nearest'});}else input.removeAttribute('aria-activedescendant'); }
  function update() {
    results=searchCities(index,input.value);active=-1;list.replaceChildren();input.removeAttribute('aria-activedescendant');
    if(input.value.trim().length<2){close();status.textContent='Type at least two letters to search cities.';return;}
    list.hidden=false;input.setAttribute('aria-expanded','true');
    if(!results.length){const empty=document.createElement('li');empty.className='search-empty';empty.textContent='No cities found. Try another spelling.';empty.setAttribute('role','presentation');list.append(empty);}
    results.forEach((city,i)=>{const option=document.createElement('li');option.id=`city-option-${city.id}`;option.setAttribute('role','option');option.setAttribute('aria-selected','false');const name=document.createElement('strong');name.textContent=city.name;const context=document.createElement('span');context.textContent=[city.region,city.country].filter(Boolean).join(', ');option.append(name,context);option.addEventListener('pointerdown',e=>e.preventDefault());option.addEventListener('click',()=>select(city));list.append(option);});
    status.textContent=results.length?`${results.length} suggestions. Use arrow keys to choose a city.`:'No cities found.';
  }
  input.addEventListener('input',()=>{selected=null;onChange();update();});
  input.addEventListener('focus',()=>{if(!selected)update();});
  input.addEventListener('keydown',e=>{
    if(e.isComposing)return;
    if(e.key==='Escape'){close();return;}
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)update();if(results.length){active=(active+(e.key==='ArrowDown'?1:-1)+results.length)%results.length;highlight();}}
    if(e.key==='Enter'&&!list.hidden){e.preventDefault();if(active>=0)select(results[active]);else if(results.length===1)select(results[0]);else status.textContent='Choose a city from the suggestions first.';}
    if(e.key==='Tab')close();
  });
  input.addEventListener('blur',()=>setTimeout(close,150));
  return {get selected(){return selected;},clear(){selected=null;input.value='';close();status.textContent='';},close};
}
