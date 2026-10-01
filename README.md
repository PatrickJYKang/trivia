# Trivia

A static, responsive collection of trivia widgets. The first widget is City Guess.

Serve `dist` with any static HTTP server. No build step or API key is required.

## City Guess

Thirty shuffled cities; no repeats until the deck is exhausted. Each round starts with major roads only, then an unlabeled OSM map, then satellite imagery. One guess per level; a wrong guess or a reveal advances the clue. Correct answers earn 3, 2, or 1 points. Reviewing previous clues never restores points. Score lasts for the current page session.

Add cities and accepted aliases in `dist/cities.js`. Coordinates are longitude, latitude. Maps use a fixed, north-up view with no panning to other cities. Answers are client-side: this is a casual game, not a secure competition.

## Map sources

- Roads and unlabeled map: OpenStreetMap data via CARTO, with local CARTO Voyager style. https://carto.com/basemaps/
- Satellite/aerial imagery: Esri World Imagery public tiles. https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9
- MapLibre GL JS 5.6.2 is bundled locally, with its license in `dist/vendor/`.

Attribution stays visible below the map. Tile services require an internet connection and retain their provider terms and usage limits; no imagery is bulk downloaded or cached offline. Check provider terms before commercializing or scaling traffic.

Optional browser WebMCP tools use the same game actions and are feature-detected. Native WebMCP validation was unavailable in the local test browser.
