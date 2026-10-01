# Trivia

A static, responsive collection of trivia widgets. The first widget is City Guess.

Serve `dist` with any static HTTP server. No build step or API key is required.

## City Guess

Standard mode has thirty shuffled cities; no repeats until the deck is exhausted. “Too easy?” opens `?mode=hard`, titled City Guess (hard), with 5,850 cities across 171 countries. Hard mode uses GeoNames cities with population at least 100,000 and city feature codes (excluding districts and abandoned places). It uses the same clue, search and scoring rules. Switching modes starts a fresh session, and the hard-mode URL can be bookmarked. Hard-mode map crops adjust to population and latitude. Each round starts with major roads only, then an unlabeled OSM map, then satellite imagery. Choose a city from a searchable GeoNames database of 34,152 places. Results include region and country, support keyboard selection, accents and alternate names, and are matched by stable GeoNames ID. A wrong guess or a reveal advances the clue. Correct answers earn 3, 2, or 1 points. After a miss on satellite, keep guessing for zero points until correct or choosing Give up. Reviewing previous clues never restores points. Score lasts for the current page session.

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
