export function armsMode(search=''){
  const historical=new URLSearchParams(search).get('mode')==='historical';
  return historical?{
    historical:true,title:'Coat of Arms (historical)',label:'HISTORICAL ENTITIES',noun:'entity',plural:'entities',article:'an',
    inputLabel:'Historical state or entity',placeholder:'Search historical states…',listLabel:'States and entities',
    loading:'Loading historical arms…',next:'Next entity →',credits:'historical-arms-credits.html',
    redactionLabel:'Names removed',switchLabel:'Current countries →',switchUrl:'arms.html',footer:'Historical arms & emblems'
  }:{
    historical:false,title:'Coat of Arms',label:'COUNTRIES',noun:'country',plural:'countries',article:'a',
    inputLabel:'Country',placeholder:'Search countries…',listLabel:'Countries',
    loading:'Loading countries…',next:'Next country →',credits:'arms-credits.html',
    redactionLabel:'Country names removed',switchLabel:'Historical →',switchUrl:'arms.html?mode=historical',footer:'National arms & emblems'
  };
}
