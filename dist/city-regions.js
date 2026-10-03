import {cities as standardCities} from './cities.js';

// Curated regional decks. Stable GeoNames IDs keep similarly named cities distinct.
export const cityRegions = {
  "us-canada": {
    label: "US + Canada",
    note: "",
    countries: ["US", "CA"],
    ids: [
      5128581, // New York City, US
      5368361, // Los Angeles, US
      4887398, // Chicago, US
      4699066, // Houston, US
      5308655, // Phoenix, US
      4560349, // Philadelphia, US
      4726206, // San Antonio, US
      5391811, // San Diego, US
      4684888, // Dallas, US
      5392171, // San Jose, US
      4671654, // Austin, US
      4160021, // Jacksonville, US
      5391959, // San Francisco, US
      5809844, // Seattle, US
      5419384, // Denver, US
      4140963, // Washington, US
      4930956, // Boston, US
      4990729, // Detroit, US
      5506956, // Las Vegas, US
      4164138, // Miami, US
      4180439, // Atlanta, US
      4335045, // New Orleans, US
      5037649, // Minneapolis, US
      5746545, // Portland, US
      5780993, // Salt Lake City, US
      4644585, // Nashville, US
      5856195, // Honolulu, US
      5879400, // Anchorage, US
      6167865, // Toronto, CA
      6077243, // Montreal, CA
      6173331, // Vancouver, CA
      5913490, // Calgary, CA
      5946768, // Edmonton, CA
      6094817, // Ottawa, CA
      6183235, // Winnipeg, CA
      6325494, // Quebec, CA
      6324729, // Halifax, CA
      6174041, // Victoria, CA
      6141256, // Saskatoon, CA
      6324733, // St. John's, CA
      5389489, // Sacramento, US
      4407066, // Saint Louis, US
      4347778, // Baltimore, US
      5206379, // Pittsburgh, US
      5150529, // Cleveland, US
      4508722, // Cincinnati, US
      4393217, // Kansas City, US
      4544349, // Oklahoma City, US
      4259418, // Indianapolis, US
      5263045, // Milwaukee, US
      4174757, // Tampa, US
      4167147, // Orlando, US
      4460243, // Charlotte, US
      6119109, // Regina, CA
      6076211, // Moncton, CA
    ]
  },
  "western-central-europe": {
    label: "Western/Central Europe",
    note: "Includes Iberia, Italy and Central Europe.",
    countries: ["FR", "PT", "ES", "IT", "DE", "NL", "BE", "CH", "AT", "CZ", "PL", "HU", "SK", "LU"],
    ids: [
      2988507, // Paris, FR
      2996944, // Lyon, FR
      2995469, // Marseille, FR
      3031582, // Bordeaux, FR
      2972315, // Toulouse, FR
      2990440, // Nice, FR
      2267057, // Lisbon, PT
      2735943, // Porto, PT
      3117735, // Madrid, ES
      3128760, // Barcelona, ES
      2510911, // Seville, ES
      2509954, // Valencia, ES
      3128026, // Bilbao, ES
      3169070, // Rome, IT
      3173435, // Milan, IT
      3164603, // Venice, IT
      3176959, // Florence, IT
      3172394, // Naples, IT
      2950159, // Berlin, DE
      2911298, // Hamburg, DE
      2867714, // Munich, DE
      2886242, // Cologne, DE
      2925533, // Frankfurt am Main, DE
      2935022, // Dresden, DE
      2759794, // Amsterdam, NL
      2747891, // Rotterdam, NL
      2800866, // Brussels, BE
      2803138, // Antwerp, BE
      2657896, // Zurich, CH
      2660646, // Geneva, CH
      2761369, // Vienna, AT
      2766824, // Salzburg, AT
      3067696, // Prague, CZ
      3078610, // Brno, CZ
      756135, // Warsaw, PL
      3094802, // Krakow, PL
      3099434, // Gdansk, PL
      3054643, // Budapest, HU
      3060972, // Bratislava, SK
      2960316, // Luxembourg, LU
      2990969, // Nantes, FR
      2973783, // Strasbourg, FR
      2998324, // Lille, FR
      3104324, // Zaragoza, ES
      2514256, // Malaga, ES
      3165524, // Turin, IT
      3181928, // Bologna, IT
      3176219, // Genoa, IT
      2879139, // Leipzig, DE
      2934246, // Dusseldorf, DE
      2825297, // Stuttgart, DE
      2745912, // Utrecht, NL
      2797656, // Ghent, BE
      2661604, // Basel, CH
      2775220, // Innsbruck, AT
    ]
  },
  "rest-of-europe": {
    label: "Rest of Europe",
    note: "Nordics, Baltics, Ireland, Eastern Europe and the Balkans.",
    countries: ["SE", "NO", "DK", "FI", "IS", "EE", "LV", "LT", "UA", "BY", "RO", "BG", "GR", "RS", "HR", "BA", "AL", "IE", "MD", "MK", "ME", "SI"],
    ids: [
      2673730, // Stockholm, SE
      2711537, // Gothenburg, SE
      3143244, // Oslo, NO
      3161732, // Bergen, NO
      2618425, // Copenhagen, DK
      658225, // Helsinki, FI
      3413829, // Reykjavik, IS
      588409, // Tallinn, EE
      456172, // Riga, LV
      593116, // Vilnius, LT
      703448, // Kyiv, UA
      625144, // Minsk, BY
      683506, // Bucharest, RO
      727011, // Sofia, BG
      264371, // Athens, GR
      734077, // Thessaloniki, GR
      792680, // Belgrade, RS
      3186886, // Zagreb, HR
      3191281, // Sarajevo, BA
      3183875, // Tirana, AL
      2964574, // Dublin, IE
      2965140, // Cork, IE
      633679, // Turku, FI
      2692969, // Malmo, SE
      3133880, // Trondheim, NO
      2624652, // Aarhus, DK
      588335, // Tartu, EE
      598316, // Kaunas, LT
      702550, // Lviv, UA
      698740, // Odesa, UA
      618426, // Chisinau, MD
      681290, // Cluj-Napoca, RO
      785842, // Skopje, MK
      3193044, // Podgorica, ME
      3196359, // Ljubljana, SI
    ]
  },
  "russia": {
    label: "Russia",
    note: "",
    countries: ["RU"],
    ids: [
      524901, // Moscow, RU
      498817, // Saint Petersburg, RU
      1496747, // Novosibirsk, RU
      1486209, // Yekaterinburg, RU
      551487, // Kazan, RU
      520555, // Nizhny Novgorod, RU
      1508291, // Chelyabinsk, RU
      499099, // Samara, RU
      1496153, // Omsk, RU
      501175, // Rostov-on-Don, RU
      479561, // Ufa, RU
      1502026, // Krasnoyarsk, RU
      511196, // Perm, RU
      472045, // Voronezh, RU
      472757, // Volgograd, RU
      542420, // Krasnodar, RU
      2023469, // Irkutsk, RU
      2013348, // Vladivostok, RU
      2022890, // Khabarovsk, RU
      554234, // Kaliningrad, RU
      491422, // Sochi, RU
      524305, // Murmansk, RU
      581049, // Arkhangelsk, RU
      472459, // Vologda, RU
      468902, // Yaroslavl, RU
      473247, // Vladimir, RU
      480060, // Tver, RU
      491687, // Smolensk, RU
      480562, // Tula, RU
      500096, // Ryazan, RU
      498677, // Saratov, RU
      580497, // Astrakhan, RU
      1489425, // Tomsk, RU
      2013159, // Yakutsk, RU
      2014407, // Ulan-Ude, RU
    ]
  },
  "uk": {
    label: "UK",
    note: "",
    countries: ["GB"],
    ids: [
      2643743, // London, GB
      2655603, // Birmingham, GB
      2643123, // Manchester, GB
      2644210, // Liverpool, GB
      2644688, // Leeds, GB
      2638077, // Sheffield, GB
      2654675, // Bristol, GB
      2641673, // Newcastle upon Tyne, GB
      2641170, // Nottingham, GB
      2644668, // Leicester, GB
      2654710, // Brighton, GB
      2637487, // Southampton, GB
      2640729, // Oxford, GB
      2653941, // Cambridge, GB
      2650225, // Edinburgh, GB
      2648579, // Glasgow, GB
      2657832, // Aberdeen, GB
      2653822, // Cardiff, GB
      2636432, // Swansea, GB
      2655984, // Belfast, GB
      2656173, // Bath, GB
      2633352, // York, GB
      2639996, // Portsmouth, GB
      2652221, // Coventry, GB
      2651347, // Derby, GB
      2641181, // Norwich, GB
      2649808, // Exeter, GB
      2640194, // Plymouth, GB
      2639577, // Reading, GB
      2642465, // Milton Keynes, GB
      2650752, // Dundee, GB
      2646088, // Inverness, GB
      2636910, // Stirling, GB
      2641598, // Newport, GB
      2643736, // Derry, GB
    ]
  },
  "india": {
    label: "India",
    note: "",
    countries: ["IN"],
    ids: [
      1273294, // Delhi, IN
      1275339, // Mumbai, IN
      1275004, // Kolkata, IN
      1264527, // Chennai, IN
      1277333, // Bengaluru, IN
      1269843, // Hyderabad, IN
      1279233, // Ahmedabad, IN
      1259229, // Pune, IN
      1269515, // Jaipur, IN
      1255364, // Surat, IN
      1264733, // Lucknow, IN
      1267995, // Kanpur, IN
      1262180, // Nagpur, IN
      1269743, // Indore, IN
      1275841, // Bhopal, IN
      1260086, // Patna, IN
      1253405, // Varanasi, IN
      1278710, // Amritsar, IN
      1273874, // Kochi, IN
      1271476, // Guwahati, IN
      1279259, // Agra, IN
      1253986, // Udaipur, IN
      1268865, // Jodhpur, IN
      1269507, // Jaisalmer, IN
      1274746, // Chandigarh, IN
      1255634, // Srinagar, IN
      1256237, // Shimla, IN
      1273313, // Dehradun, IN
      1258128, // Rishikesh, IN
      1254163, // Thiruvananthapuram, IN
      1264521, // Madurai, IN
      1273865, // Coimbatore, IN
      1258393, // Visakhapatnam, IN
      1275817, // Bhubaneswar, IN
      1258526, // Ranchi, IN
    ]
  },
  "east-asia": {
    label: "East Asia",
    note: "Includes China, Japan, Korea, Taiwan, Mongolia and Southeast Asia.",
    countries: ["CN", "JP", "KR", "KP", "TW", "MN", "HK", "MO", "TH", "VN", "KH", "LA", "MM", "MY", "SG", "ID", "PH"],
    ids: [
      1816670, // Beijing, CN
      1796236, // Shanghai, CN
      1809858, // Guangzhou, CN
      1795565, // Shenzhen, CN
      1814906, // Chongqing, CN
      1792947, // Tianjin, CN
      1815286, // Chengdu, CN
      1791247, // Wuhan, CN
      1790630, // Xi'an, CN
      1808926, // Hangzhou, CN
      1799962, // Nanjing, CN
      1886760, // Suzhou, CN
      1797929, // Qingdao, CN
      1814087, // Dalian, CN
      2037013, // Harbin, CN
      2034937, // Shenyang, CN
      1784658, // Zhengzhou, CN
      1804651, // Kunming, CN
      1529102, // Urumqi, CN
      1280737, // Lhasa, CN
      1850147, // Tokyo, JP
      1853909, // Osaka, JP
      1857910, // Kyoto, JP
      1848354, // Yokohama, JP
      1856057, // Nagoya, JP
      2128295, // Sapporo, JP
      1863967, // Fukuoka, JP
      1862415, // Hiroshima, JP
      2111149, // Sendai, JP
      1856035, // Naha, JP
      1835848, // Seoul, KR
      1838524, // Busan, KR
      1843564, // Incheon, KR
      1835329, // Daegu, KR
      1835235, // Daejeon, KR
      1871859, // Pyongyang, KP
      1668341, // Taipei, TW
      1673820, // Kaohsiung, TW
      1668399, // Taichung, TW
      2028462, // Ulaanbaatar, MN
      1819729, // Hong Kong, HK
      1821274, // Macau, MO
      1609350, // Bangkok, TH
      1153671, // Chiang Mai, TH
      1151254, // Phuket, TH
      1581130, // Hanoi, VN
      1566083, // Ho Chi Minh City, VN
      1583992, // Da Nang, VN
      1580240, // Hue, VN
      1821306, // Phnom Penh, KH
      1822214, // Siem Reap, KH
      1651944, // Vientiane, LA
      1655559, // Luang Prabang, LA
      1298824, // Yangon, MM
      1311874, // Mandalay, MM
      1735161, // Kuala Lumpur, MY
      1735106, // George Town, MY
      1880252, // Singapore, SG
      1642911, // Jakarta, ID
      1625822, // Surabaya, ID
      1621177, // Yogyakarta, ID
      1645528, // Denpasar, ID
      1701668, // Manila, PH
      1717512, // Cebu City, PH
      1715348, // Davao, PH
    ]
  },
  "africa": {
    label: "Africa",
    note: "",
    countries: ["EG", "MA", "TN", "DZ", "SN", "GH", "NG", "ET", "KE", "TZ", "ZA", "UG", "RW", "CD", "AO", "MZ", "MG", "LY", "SD", "CI", "CM", "CG", "ZM", "ZW", "NA"],
    ids: [
      360630, // Cairo, EG
      361058, // Alexandria, EG
      2553604, // Casablanca, MA
      2542997, // Marrakesh, MA
      2464470, // Tunis, TN
      2507480, // Algiers, DZ
      2253354, // Dakar, SN
      2306104, // Accra, GH
      2332459, // Lagos, NG
      344979, // Addis Ababa, ET
      184745, // Nairobi, KE
      160263, // Dar es Salaam, TZ
      3369157, // Cape Town, ZA
      993800, // Johannesburg, ZA
      232422, // Kampala, UG
      202061, // Kigali, RW
      2314302, // Kinshasa, CD
      2240449, // Luanda, AO
      1040652, // Maputo, MZ
      1070940, // Antananarivo, MG
      2538475, // Rabat, MA
      2530335, // Tangier, MA
      2548885, // Fes, MA
      2485926, // Oran, DZ
      2210247, // Tripoli, LY
      379252, // Khartoum, SD
      2352778, // Abuja, NG
      2298890, // Kumasi, GH
      2293538, // Abidjan, CI
      2232593, // Douala, CM
      2260535, // Brazzaville, CG
      909137, // Lusaka, ZM
      890299, // Harare, ZW
      3352136, // Windhoek, NA
      1007311, // Durban, ZA
    ]
  },
  "south-america": {
    label: "South America",
    note: "",
    countries: ["AR", "BO", "BR", "CL", "CO", "EC", "PY", "PE", "UY", "VE", "GY", "SR"],
    ids: [
      3435910, // Buenos Aires, AR
      3860259, // Cordoba, AR
      3911925, // La Paz, BO
      3904906, // Santa Cruz de la Sierra, BO
      3448439, // Sao Paulo, BR
      3451190, // Rio de Janeiro, BR
      3469058, // Brasilia, BR
      3450554, // Salvador, BR
      3663517, // Manaus, BR
      3390760, // Recife, BR
      3871336, // Santiago, CL
      3868626, // Valparaiso, CL
      3688689, // Bogota, CO
      3674962, // Medellin, CO
      3652462, // Quito, EC
      3657509, // Guayaquil, EC
      3439389, // Asuncion, PY
      3936456, // Lima, PE
      3441575, // Montevideo, UY
      3646738, // Caracas, VE
      3838583, // Rosario, AR
      3844421, // Mendoza, AR
      3833367, // Ushuaia, AR
      3903987, // Sucre, BO
      3919968, // Cochabamba, BO
      3470127, // Belo Horizonte, BR
      3399415, // Fortaleza, BR
      3464975, // Curitiba, BR
      3452925, // Porto Alegre, BR
      3405870, // Belem, BR
      3893894, // Concepcion, CL
      3687238, // Cartagena, CO
      3941584, // Cusco, PE
      3378644, // Georgetown, GY
      3383330, // Paramaribo, SR
    ]
  },
};

export function readCityVariant(search) {
  const params=new URLSearchParams(search);
  const requested=params.get('region');
  const region=Object.hasOwn(cityRegions,requested)?requested:null;
  return {region,hard:!region&&params.get('mode')==='hard'};
}
export function cityVariantUrl(value) {
  if(Object.hasOwn(cityRegions,value))return `?region=${value}`;
  return value==='hard'?'?mode=hard':'./';
}
export function createRegionalCities(rows,region) {
  const config=cityRegions[region];if(!config)throw Error('Unknown city region');
  const byId=new Map(rows.map(row=>[row[0],row]));
  const standardById=new Map(standardCities.map(city=>[city.id,city]));
  const countries=new Intl.DisplayNames(['en'],{type:'region'});
  return config.ids.map(id=>{
    const row=byId.get(id);if(!row)throw Error(`Missing regional city ${id}`);
    const [_,name,code,area,population,aliases,lat,lng]=row;
    return standardById.get(id)||{id,name,country:countries.of(code)||code,region:area,center:[lng,lat],aliases,
      zoom:Math.max(9,Math.min(12.5,11.8-.28*Math.log2(Math.max(population,10000)/100000)+Math.log2(Math.cos(lat*Math.PI/180)/.866)))};
  });
}
