// City districts (PPLX), abandoned places and other non-city records stay searchable,
// but are excluded from the mystery-city deck.
const cityFeatures = new Set(['PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLA5', 'PPLC', 'PPLG']);
export function createHardCities(rows) {
  const countries = new Intl.DisplayNames(['en'], {type: 'region'});
  return rows.filter(row => row[4] >= 100000 && cityFeatures.has(row[8]) && Number.isFinite(row[6]) && Number.isFinite(row[7]))
    .map(([id, name, code, region, population, aliases, lat, lng]) => ({
      id, name, country: countries.of(code) || code, region, center: [lng, lat], aliases,
      // A closer crop for smaller cities; compensate for Mercator's latitude scaling.
      zoom: Math.max(9, Math.min(12.5, 11.8 - .28 * Math.log2(population / 100000) + Math.log2(Math.cos(lat * Math.PI / 180) / .866)))
    }));
}
