import {normalize} from './city-search.js';
export function createHeritageIndex(sites) {
 return sites.map(site=>({...site,region:'',population:0,primary:normalize(site.name),names:[...new Set([site.name,...site.aliases].map(normalize))],context:normalize(site.country)}));
}
export class HeritageRound {
 constructor(site){this.site=site;this.level=0;this.practice=false;this.done=false;this.won=false;this.earned=0;}
 get points(){return this.practice?0:3-this.level;}
 guess(id){if(this.done)return;if(id===this.site.id){this.earned=this.points;this.won=true;this.done=true;}else if(this.level<2)this.level++;else this.practice=true;}
 reveal(){if(!this.done){if(this.level<2)this.level++;else this.done=true;}}
}
export function heritageZoom(site, view, width){return Math.max(2,site.zoom-view*1.6+Math.log2(Math.min(width/900,1)));}
