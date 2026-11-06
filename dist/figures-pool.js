// Familiarity is an editorial choice, independent of birth year or nationality.
export const familiarExistingIds = [
  "leonardo-da-vinci",
  "michelangelo",
  "galileo-galilei",
  "isaac-newton",
  "charles-darwin",
  "ada-lovelace",
  "marie-curie",
  "albert-einstein",
  "ludwig-van-beethoven",
  "wolfgang-amadeus-mozart",
  "vincent-van-gogh",
  "pablo-picasso",
  "jane-austen",
  "george-washington",
  "abraham-lincoln",
  "harriet-tubman",
  "frida-kahlo",
  "simon-bolivar",
  "mahatma-gandhi",
  "jawaharlal-nehru",
  "rabindranath-tagore",
  "akira-kurosawa",
  "sun-yat-sen",
  "mao-zedong",
  "deng-xiaoping",
  "ho-chi-minh",
  "nelson-mandela",
  "mustafa-kemal-ataturk",
  "muhammad-ali",
  "martin-luther-king-jr",
  "malcolm-x",
  "socrates",
  "plato",
  "aristotle",
  "archimedes",
  "julius-caesar",
  "augustus",
  "cleopatra-vii",
  "dante-alighieri",
  "joan-of-arc",
  "william-shakespeare",
  "miguel-de-cervantes",
  "rene-descartes",
  "immanuel-kant",
  "catherine-the-great",
  "peter-the-great",
  "napoleon-bonaparte",
  "florence-nightingale",
  "leo-tolstoy",
  "alan-turing",
  "nikola-tesla",
  "nicolaus-copernicus",
  "confucius",
  "gautama-buddha",
  "indira-gandhi",
  "lee-kuan-yew",
  "hirohito",
  "fidel-castro",
  "bob-marley",
  "mark-twain"
];

export function figureMode(search=""){
  const expanded=new URLSearchParams(search).get("mode")==="expanded";
  return {expanded,title:expanded?"Life Map (broader pool)":"Life Map",switchLabel:expanded?"Familiar names →":"Broader pool →",switchUrl:expanded?"figures.html":"figures.html?mode=expanded"};
}

export function selectFigures(data,expanded=false){
  if(expanded)return data.figures;
  const familiar=new Set([...familiarExistingIds,...(data.familiarAdditions??[])]);
  return data.figures.filter(figure=>familiar.has(figure.id));
}
