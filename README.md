# Trivia

A static, responsive collection of trivia widgets. The first widget is City Guess.

Serve `dist` with any static HTTP server. No build step or API key is required.

## City Guess

Standard mode has 100 curated, shuffled cities; no repeats until the deck is exhausted. “Too easy?” opens `?mode=hard`, titled City Guess (hard), with 1,000 cities across 171 countries. Hard mode includes all 100 standard cities, reserves up to three major cities per country, then fills the remaining places by population. Additional cities have at least 100,000 residents and city feature codes (excluding districts and abandoned places). The selection is deterministic and does not depend on source-file order. It uses the same clue, search and scoring rules. Switching modes starts a fresh session, and the hard-mode URL can be bookmarked. Hard-mode map crops adjust to population and latitude. Wrong guesses accumulate with great-circle distance and an initial bearing arrow from the guessed city to the answer. This history stays hidden until three actual wrong guesses, when all prior misses become visible; skipping clues does not unlock it early. Each round starts with major roads only, then an unlabeled OSM map, then satellite imagery. Choose a city from a searchable GeoNames database of 34,152 places. Results include region and country, support keyboard selection, accents and alternate names, and are matched by stable GeoNames ID. A wrong guess or a reveal advances the clue. Correct answers earn 3, 2, or 1 points. After a miss on satellite, keep guessing for zero points until correct or choosing Give up. Reviewing previous clues never restores points. Score lasts for the current page session.

Add cities and accepted aliases in `dist/cities.js`. Coordinates are longitude, latitude. Maps use a fixed, north-up view with no panning to other cities. Answers are client-side: this is a casual game, not a secure competition.

## Map sources

- Roads and unlabeled map: OpenStreetMap data via CARTO, with local CARTO Voyager style. https://carto.com/basemaps/
- Satellite/aerial imagery: Esri World Imagery public tiles. https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9
- MapLibre GL JS 5.6.2 is bundled locally, with its license in `dist/vendor/`.

Attribution stays visible below the map. Tile services require an internet connection and retain their provider terms and usage limits; no imagery is bulk downloaded or cached offline. Check provider terms before commercializing or scaling traffic.

Optional browser WebMCP tools use the same game actions and are feature-detected. Native WebMCP validation was unavailable in the local test browser.

## City search data

`dist/city-database.json` is a compact, population-sorted extract of GeoNames cities15000 and admin1CodesASCII, retrieved 2026-10-01. Includes cities, capitals and other populated places from that dataset; the standard mystery-city deck remains curated; hard mode builds a much larger deck from the database. Data © GeoNames contributors, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Source: https://download.geonames.org/export/dump/. Rows contain GeoNames ID, name, country code, administrative region, population, alternate names, latitude, longitude and GeoNames feature code. Transformation: selected fields, joined regions, deduplicated aliases, sorted population.

To refresh, download `cities15000.zip` and `admin1CodesASCII.txt` from GeoNames, then run `python3 scripts/build-city-database.py /path/to/cities15000.zip /path/to/admin1CodesASCII.txt`. Run `node --test tests/city-search.test.mjs` to check aliases and playable-city identity mappings.

## Heritage Guess

Open `heritage.html` (or choose **Heritage Guess** in the game navigation). Easy mode includes 100 curated UNESCO World Heritage properties; `heritage.html?mode=hard` includes all 1,272 properties with usable coordinates in the October 2, 2026 UNESCO DataHub snapshot. The source contains 1,273 entries, including 2026 inscriptions. One property, *Funerary and memory sites of the First World War (Western Front)*, has neither a reference coordinate nor component coordinates in that export and is explicitly recorded in `omitted` rather than assigned a guessed location.

The satellite view stays fixed. Four guesses earn 4, 3, 2, or 1 points. The first miss reveals the continent, the second reveals the country (all listed countries for a transboundary property), and the third reveals the UNESCO inscription criteria with short explanations. After the fourth miss, unlimited guesses earn zero points. Give up ends the round. Rounds are shuffled without repetition until the pool is exhausted. Easy/hard links start a fresh score session. The search covers the full mapped database in either mode, with official names in up to six languages, component names, and curated familiar aliases. Answers match the stable UNESCO property ID. Every wrong guess immediately adds its direction and distance to a persistent list below the form. History resets on the next round. The completed round links to that property's UNESCO page.

Ruins, destroyed or altered sites, cultural landscapes, natural sites and mixed properties are intentionally retained. A serial or transboundary property is one answer, represented by its listed reference point or its first georeferenced component when the main point is missing. Individual component names in search resolve to that parent property. Maps show present-day provider imagery, not historical reconstructions; capture dates vary. UNESCO reference points can be approximate. Zoom is estimated from property area per component, with focused crops for selected easy sites; it is not a property boundary. Remote imagery quality varies with Esri coverage.

### Heritage data and license

Source: [UNESCO DataHub — World Heritage List](https://data.unesco.org/explore/dataset/whc001/), retrieved 2026-10-02. The dataset metadata specifies **CC BY-SA 4.0**, attribution UNESCO. `dist/heritage-database.json` and its derived data are distributed under that license: https://creativecommons.org/licenses/by-sa/4.0/. Transformations: selected factual fields, stripped HTML markup from names, combined country names, multilingual/component aliases, curated easy selection, coordinate fallbacks, crop overrides, calculated zoom, and one omitted unlocated entry. UNESCO logos and site photography are not redistributed. This is an independent game, not affiliated with UNESCO.

Refresh the source with the JSON export at `https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/exports/json`, then run `python3 scripts/build-heritage-database.py /path/to/export.json`. Review the new count, omissions and crop overrides before publishing. `node --test tests/*.test.mjs` validates both games' pools, searches, coordinate ranges and heritage scoring transitions. The heritage page also offers feature-detected WebMCP tools for search, guessing, revealing, and advancing, using the same UI actions.

### Geographic hints

`dist/guess-history.js` calculates haversine great-circle distances in km and initial bearings measured clockwise from north, from the guess to the answer. Distances use the same representative coordinates as each answer's map crop; these are point-to-point distances, not boundary or travel distances. City search retains GeoNames coordinates for every selectable answer. Very close but distinct locations display `<1 km`; identical coordinates have no directional arrow. Exact antipodes also have no unique bearing.

UNESCO criteria are read from the official export's `criteria_txt`. When empty (17 entries in this snapshot), the generator extracts explicit criterion labels from UNESCO's description/justification. Short criterion summaries are based on https://whc.unesco.org/en/criteria/. Continent hints refer to the pictured location, using Natural Earth country geometries (public domain) with geographic overrides for transcontinental countries, overseas territories and Polynesia/Hawaii. Offshore coordinates use nearest mapped land. Two offshore properties (Heard and McDonald Islands; French Austral Lands and Seas) use 'Subantarctic islands' instead of assigning them an artificial continent. These are conventional geographic groupings, not UNESCO's administrative regions.

To regenerate clue metadata, download `ne_110m_admin_0_countries.geojson` from https://github.com/nvkelso/natural-earth-vector/tree/master/geojson and run `python3 scripts/build-heritage-clues.py /path/to/unesco-export.json /path/to/countries.geojson`, then rebuild the heritage database. Review continent assignments when adding entries; the lookup is saved in `scripts/heritage-clues.json`. This derived lookup retains the UNESCO data license, CC BY-SA 4.0.
