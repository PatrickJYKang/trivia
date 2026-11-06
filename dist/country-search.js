import {normalizeCountry} from './arms-model.js?v=2efba1a6a4';
export function countryIndex(countries){
  return countries.map(({id,name,aliases})=>({id,name,primary:normalizeCountry(name),names:[...new Set([name,...aliases].map(normalizeCountry))]}));
}
export function searchCountries(index,query,limit=8){
  const q=normalizeCountry(query);
  if(!q)return [];
  const tokens=q.split(' '),matches=[];
  for(const country of index){
    const rank=country.primary===q?0:country.names.includes(q)?1:country.primary.startsWith(q)?2:country.names.some(n=>n.startsWith(q))?3:country.names.some(n=>tokens.every(t=>n.split(' ').some(word=>word.startsWith(t))))?4:country.names.some(n=>n.includes(q))?5:-1;
    if(rank>=0)matches.push({country,rank});
  }
  return matches.sort((a,b)=>a.rank-b.rank||a.country.name.localeCompare(b.country.name,'en')).slice(0,limit).map(r=>r.country);
}
export function exactCountry(index,value){
  const key=normalizeCountry(value),matches=index.filter(c=>c.names.includes(key));
  return matches.length===1?matches[0]:null;
}
export function attachCountrySearch(index,{input,list,status,onChange}){
  let results=[],active=-1,selected=null,blurTimer;
  function close(){list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
  function select(country){selected=country;input.value=country.name;close();status.textContent=`${country.name} selected.`;onChange();}
  function highlight(){
    [...list.children].forEach((option,i)=>option.setAttribute('aria-selected',String(i===active)));
    if(active>=0){input.setAttribute('aria-activedescendant',list.children[active].id);list.children[active].scrollIntoView({block:'nearest'});}else input.removeAttribute('aria-activedescendant');
  }
  function update(){
    results=searchCountries(index,input.value);active=-1;list.replaceChildren();input.removeAttribute('aria-activedescendant');
    if(!normalizeCountry(input.value)){close();status.textContent='';return;}
    list.hidden=false;input.setAttribute('aria-expanded','true');
    if(!results.length){const empty=document.createElement('li');empty.className='search-empty';empty.setAttribute('role','presentation');empty.textContent='No countries found.';list.append(empty);}
    for(const country of results){
      const option=document.createElement('li');option.id=`country-option-${country.id}`;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.textContent=country.name;
      option.addEventListener('pointerdown',event=>event.preventDefault());option.addEventListener('click',()=>select(country));list.append(option);
    }
    status.textContent=results.length?`${results.length} ${results.length===1?'suggestion':'suggestions'}. Use arrow keys to choose a country.`:'No countries found.';
  }
  input.addEventListener('input',()=>{selected=null;onChange();update();});
  input.addEventListener('focus',()=>{clearTimeout(blurTimer);if(!selected)update();});
  input.addEventListener('blur',()=>{blurTimer=setTimeout(close,150);});
  input.addEventListener('keydown',event=>{
    if(event.isComposing)return;
    if(event.key==='Escape'){close();return;}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();if(list.hidden)update();
      if(results.length){active=active<0?(event.key==='ArrowDown'?0:results.length-1):(active+(event.key==='ArrowDown'?1:-1)+results.length)%results.length;highlight();}
    }
    if(event.key==='Enter'&&!list.hidden){
      event.preventDefault();const choice=active>=0?results[active]:exactCountry(index,input.value)||(results.length===1?results[0]:null);
      if(choice)select(choice);else status.textContent='Choose a country from the suggestions.';
    }
    if(event.key==='Tab')close();
  });
  return {get selected(){return selected;},resolve(){return selected||exactCountry(index,input.value);},close,clear(){clearTimeout(blurTimer);selected=null;results=[];input.value='';list.replaceChildren();close();status.textContent='';}};
}
