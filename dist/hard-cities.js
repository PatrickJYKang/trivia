import {cities as standardCities} from './cities.js';
const cityFeatures = new Set(['PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLA5', 'PPLC', 'PPLG']);
export const HARD_POOL_SIZE = 1000;
export function createHardCities(rows) {
  const countries = new Intl.DisplayNames(['en'], {type: 'region'});
  const valid = rows.filter(row => cityFeatures.has(row[8]) && Number.isFinite(row[6]) && Number.isFinite(row[7]));
  const byId = new Map(valid.map(row => [row[0], row]));
  const ranked = valid.filter(row => row[4] >= 100000).sort((a,b) => b[4]-a[4] || a[0]-b[0]);
  const selected = new Map();
  // Keep familiar cities, then reserve up to three major cities per country.
  // Fill the remaining places by population for a stable, geographically broad deck.
  for (const city of standardCities) if (byId.has(city.id)) selected.set(city.id, byId.get(city.id));
  const countryCounts = new Map();
  for (const row of ranked) {
    const count = countryCounts.get(row[2]) || 0;
    if (count < 3 && selected.size < HARD_POOL_SIZE) selected.set(row[0], row);
    countryCounts.set(row[2], count + 1);
  }
  for (const row of ranked) {
    if (selected.size >= HARD_POOL_SIZE) break;
    selected.set(row[0], row);
  }
  const standardById = new Map(standardCities.map(city => [city.id, city]));
  return [...selected.values()].map(([id, name, code, region, population, aliases, lat, lng]) =>
    standardById.get(id) || ({
      id, name, country: countries.of(code) || code, region, center: [lng, lat], aliases,
      zoom: Math.max(9, Math.min(12.5, 11.8 - .28 * Math.log2(population / 100000) + Math.log2(Math.cos(lat * Math.PI / 180) / .866)))
    }));
}
