const category=(label,detail,test)=>({label,detail,test});
const country=(label,code)=>category(label,`A city in ${label}.`,c=>c.code===code);
export const categories={
 europe:category('Europe','A city in Europe.',c=>c.continent==='EU'),asia:category('Asia','A city in Asia.',c=>c.continent==='AS'),africa:category('Africa','A city in Africa.',c=>c.continent==='AF'),northAmerica:category('North America','Includes Central America and the Caribbean.',c=>c.continent==='NA'),southAmerica:category('South America','A city in South America.',c=>c.continent==='SA'),oceania:category('Oceania','A city in Australia, New Zealand or the Pacific.',c=>c.continent==='OC'),
 us:country('United States','US'),canada:country('Canada','CA'),mexico:country('Mexico','MX'),brazil:country('Brazil','BR'),argentina:country('Argentina','AR'),uk:country('UK','GB'),france:country('France','FR'),germany:country('Germany','DE'),italy:country('Italy','IT'),spain:country('Spain','ES'),poland:country('Poland','PL'),india:country('India','IN'),china:country('China','CN'),japan:country('Japan','JP'),korea:country('South Korea','KR'),
 southeast:category('Southeast Asia','Cambodia, Indonesia, Laos, Malaysia, Myanmar, Philippines, Singapore, Thailand or Vietnam.',c=>['KH','ID','LA','MY','MM','PH','SG','TH','VN'].includes(c.code)),
 capital:category('National capital','Classified as a national capital in GeoNames. Delhi and New Delhi are separate records.',c=>c.capital),
 north:category('Northern hemisphere','North of the equator.',c=>c.lat>0),south:category('Southern hemisphere','South of the equator.',c=>c.lat<0),tropical:category('Within the tropics','Latitude between 23.436° south and 23.436° north.',c=>Math.abs(c.lat)<=23.436),
 north50:category('North of 50°N','Latitude greater than 50° north.',c=>c.lat>50),south45:category('South of 45°N','Latitude less than 45° north.',c=>c.lat<45),south30:category('South of 30°S','Latitude less than 30° south.',c=>c.lat< -30),north30:category('North of 30°N','Latitude greater than 30° north.',c=>c.lat>30),below30:category('South of 30°N','Latitude less than 30° north.',c=>c.lat<30),
 east20:category('East of 20°E','Longitude between 20°E and 180°E.',c=>c.lng>20),east100:category('East of 100°E','Longitude between 100°E and 180°E.',c=>c.lng>100),west100:category('West of 100°E','Longitude less than 100°E, including western longitudes.',c=>c.lng<100),west60:category('West of 60°W','Longitude between 60°W and 180°W.',c=>c.lng< -60),east:category('Eastern hemisphere','East of Greenwich, up to 180°E.',c=>c.lng>0),west:category('Western hemisphere','West of Greenwich, up to 180°W.',c=>c.lng<0),
 million:category('Population 1M+','At least one million in the fixed GeoNames city population record; not metro population.',c=>c.population>=1e6),fiveMillion:category('Population 5M+','At least five million in the fixed GeoNames city population record; not metro population.',c=>c.population>=5e6),underMillion:category('Population under 1M','Fewer than one million in the GeoNames city record.',c=>c.population<1e6),under500:category('Population under 500K','Fewer than 500,000 in the GeoNames city record.',c=>c.population<5e5),under250:category('Population under 250K','Fewer than 250,000 in the GeoNames city record.',c=>c.population<25e4),
 startsB:category('Starts with B','The displayed city name starts with B; accents are ignored.',c=>c.name.normalize('NFD').toUpperCase().startsWith('B')),startsC:category('Starts with C','The displayed city name starts with C; accents are ignored.',c=>c.name.normalize('NFD').toUpperCase().startsWith('C')),startsK:category('Starts with K','The displayed city name starts with K; accents are ignored.',c=>c.name.normalize('NFD').toUpperCase().startsWith('K')),startsM:category('Starts with M','The displayed city name starts with M; accents are ignored.',c=>c.name.normalize('NFD').toUpperCase().startsWith('M')),startsS:category('Starts with S','The displayed city name starts with S; accents are ignored.',c=>c.name.normalize('NFD').toUpperCase().startsWith('S')),
 island:category('Island country','UK, Japan, Indonesia, Philippines, New Zealand, Iceland, Singapore, Sri Lanka, Cuba or Madagascar.',c=>['GB','JP','ID','PH','NZ','IS','SG','LK','CU','MG'].includes(c.code))
};
export const cardTemplates=[
 {name:'World tour',categories:['europe','india','south','million','africa','capital','us','underMillion','northAmerica','tropical','china','startsS','oceania','north','asia','southAmerica']},
 {name:'European circuit',categories:['uk','north50','italy','startsB','under500','germany','west','poland','capital','spain','east20','million','france','south45','startsM','europe']},
 {name:'Across Asia',categories:['japan','million','north30','capital','india','startsK','southeast','fiveMillion','east100','korea','underMillion','china','startsS','below30','asia','west100']},
 {name:'Across the Atlantic',categories:['canada','south','africa','million','brazil','capital','west60','startsC','northAmerica','under500','mexico','east','argentina','north','us','southAmerica']},
 {name:'On the compass',categories:['north50','startsB','asia','under250','oceania','east100','capital','startsS','million','africa','south30','island','west60','startsM','europe','tropical']}
];
export const bingoLines=[...[0,1,2,3].map(r=>[0,1,2,3].map(c=>r*4+c)),...[0,1,2,3].map(c=>[0,1,2,3].map(r=>r*4+c)),[0,5,10,15],[3,6,9,12]];
export function cardIndex(search){const n=Number(new URLSearchParams(search).get('card'));return Number.isInteger(n)&&n>=1&&n<=5?n-1:0;}
export class BingoGame{
 constructor(card,cities){this.card=card;this.cities=new Map(cities.map(c=>[c.id,c]));this.filled=Array(16).fill(null);this.cursor=0;this.wildcardUsed=false;this.mistakes=0;this.skips=0;}
 get current(){return this.cities.get(this.card.deck[this.cursor])??null;}
 get count(){return this.filled.filter(Boolean).length;}
 get lines(){return bingoLines.filter(line=>line.every(i=>this.filled[i]));}
 get done(){return this.count===16||this.cursor>=this.card.deck.length;}
 matches(cell,city=this.current){return !!city&&!!categories[this.card.categories[cell]]?.test(city);}
 place(cell){
  if(this.done||!Number.isInteger(cell)||cell<0||cell>=16||this.filled[cell])return {type:'ignored'};
  const city=this.current;
  if(this.matches(cell)){this.filled[cell]=city;this.cursor++;return {type:'placed',city,cell};}
  const skipped=this.cities.get(this.card.deck[this.cursor+1]);this.cursor=Math.min(this.cursor+2,this.card.deck.length);this.mistakes++;return {type:'miss',city,skipped,cell};
 }
 skip(){if(this.done)return {type:'ignored'};const city=this.current;this.cursor++;this.skips++;return {type:'skip',city};}
 wildcard(){if(this.done||this.wildcardUsed)return {type:'ignored'};const city=this.current,cells=[];this.filled.forEach((filled,i)=>{if(!filled&&this.matches(i))cells.push(i);});cells.forEach(i=>this.filled[i]=city);this.wildcardUsed=true;this.cursor++;return {type:'wildcard',city,cells};}
}
