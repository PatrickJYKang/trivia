import {cities} from './cities.js';
import {cityRegions} from './city-regions.js';

// Editorial familiarity tiers for this game, not an objective popularity index.
// Start with the curated standard deck and trade a few regional names for
// internationally familiar cultural, historical and political centres.
const mediumInstead=new Set([
 6094817, // Ottawa
 3703443, // Panama City
 3621849, // San José
 4568127, // San Juan
 3652462, // Quito
 3674962, // Medellín
 3441575, // Montevideo
 2735943, // Porto
 3094802, // Kraków
 2253354, // Dakar
 2306104, // Accra
 250441, // Amman
 1269515, // Jaipur
]);
const additionalEasy=[
 524901, // Moscow
 498817, // Saint Petersburg
 1853909, // Osaka
 1857910, // Kyoto
 1862415, // Hiroshima
 104515, // Mecca (GeoNames: Makkah)
 170654, // Damascus
 98182, // Baghdad
 112931, // Tehran
 1138958, // Kabul
 1174872, // Karachi
 4699066, // Houston
 4684888, // Dallas
];
export const easyClueIds=[...cities.filter(c=>!mediumInstead.has(c.id)).map(c=>c.id),...additionalEasy];
const easyOrder=new Map(easyClueIds.map((id,i)=>[id,i]));
const regionalNames=new Set(Object.values(cityRegions).flatMap(region=>region.ids));

export function rankByNotability(pool,rowsById){
 // Familiar curated regional cities come next, then national capitals.
 // Population only breaks ties in the remaining groups; it cannot displace
 // a curated easy clue. Numerical order within a tier is not a fame claim.
 const group=city=>easyOrder.has(city.id)?0:regionalNames.has(city.id)||mediumInstead.has(city.id)?1:rowsById.get(city.id)[8]==='PPLC'?2:3;
 return [...pool].sort((a,b)=>group(a)-group(b)||
  (group(a)===0?easyOrder.get(a.id)-easyOrder.get(b.id):rowsById.get(b.id)[4]-rowsById.get(a.id)[4])||a.id-b.id);
}
