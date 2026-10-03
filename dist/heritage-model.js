import {normalize} from './city-search.js';
export const CRITERIA={i:'Creative achievement',ii:'Exchange of human values',iii:'Cultural tradition or civilization',iv:'Architecture or technology in history',v:'Traditional settlement or land use',vi:'Events, beliefs or artistic works',vii:'Natural beauty or phenomena',viii:'Earth’s history and geology',ix:'Ecological and biological processes',x:'Biodiversity and threatened species'};
export function createHeritageIndex(sites) {
 return sites.map(site=>({...site,region:'',population:0,primary:normalize(site.name),names:[...new Set([site.name,...site.aliases].map(normalize))],context:normalize(site.country)}));
}
export class HeritageRound {
 constructor(site){this.site=site;this.misses=0;this.done=false;this.won=false;this.earned=0;}
 get practice(){return this.misses>=4;}
 get points(){return Math.max(0,4-this.misses);}
 get clues(){return {continent:this.misses>=1?this.site.continent:null,country:this.misses>=2?this.site.country:null,criteria:this.misses>=3?this.site.criteria:null};}
 guess(id){if(this.done)return;if(id===this.site.id){this.earned=this.points;this.won=true;this.done=true;}else this.misses++;}
 giveUp(){if(!this.done)this.done=true;}
}
export function heritageZoom(site,width){return Math.max(2,site.zoom+Math.log2(Math.min(width/900,1)));}
