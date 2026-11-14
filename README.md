# COSMOS — Solar System Observatory

An interactive, scientifically transparent Phase 1 Solar System explorer. **Phase 1 is not complete.** The implementation below is a foundation, not a claim of a finished precision universe simulator. Phase 2 has not been started.

## Run and configure

Requires Node.js 20 or later.

```sh
npm install
cp .env.example .env
# Add NASA_API_KEY to .env on the server (do not commit it)
npm run dev
```

For production, run `npm run build` and `npm start`; Express serves the app and `/api` on `PORT` (default 3001). Set `NASA_API_KEY` as a **server-side environment variable** in your deployment environment. Never use a `VITE_` prefix or place the key in client code. The supplied key is not in the repository; `.env` is ignored by Git.

APOD, today's NEO feed, and today's DONKI solar flare data use NASA Open APIs and require that key. The JPL Small-Body Database (SBDB) and Horizons endpoints do not require a NASA key. All requests go through the server with one-hour bounded in-memory caching, timeout, input validation and error handling. The server needs outbound access to `api.nasa.gov`, `ssd-api.jpl.nasa.gov` and `ssd.jpl.nasa.gov`; where these are blocked, the interface reports the failure rather than inventing results. NASA media may have separate credits and usage restrictions.

## Available features

- WebGL scene with textured Sun, eight planets, Pluto, the Moon and the four Galilean moons; Earth day/night maps, cloud layer, ocean highlights and illustrative atmosphere; procedural Saturn rings and star field; Sun-directed planetary shading. Exposure is normalized for readability, not radiometrically accurate.
- Date, play/pause, reverse, speed and reset controls, drag/zoom/pan, click selection, overview, follow, orbital paths, overview labels and display settings. Focus view isolates the selected world to prevent exaggerated bodies overlapping. Planet sizes and distances are **not to scale**.
- Symbolic, procedural asteroid and Kuiper belt particles visible in overview: their radii are broadly illustrative, and the particles are **not** catalogue bodies or real individual positions. They can be toggled off.
- Searchable local inventory with filtering, sorting, favourites and recent items; size comparison of planets, Pluto and the modeled moons. The Moon and four Galilean moons use approximate date-dependent satellite vectors; Pluto uses its approximate system-barycenter trajectory. Other catalogue-only moons and dwarf planets do not yet have simulated orbits.
- Live SBDB search by name/designation in NASA Data. A returned bound elliptical orbit with complete elements can be explored as a two-body approximation from its JPL solution epoch; its generic rock shape is procedural and is **not an observed image or shape model**. Hyperbolic, incomplete, or unavailable solutions are not rendered. Solar perturbations and uncertainty are not propagated, so the approximation may degrade substantially away from the solution epoch.
- On-demand Horizons vector comparison for the selected planet, Pluto, or modeled moon, at 12:00 UT on the simulation date, in the object's profile and NASA Data. The uncompressed model and the JPL result are compared in AU and km; no result is faked if the request fails.
- Five manual render-resolution caps, and toggles for atmosphere/clouds, orbit guides, labels and symbolic belts. These presets are not yet an adaptive LOD system.

## Scientific method and limitations

Planet positions use [NASA/JPL Table 1](https://ssd.jpl.nasa.gov/planets/approx_pos.html): J2000 elements and their secular rates, solving Kepler's equation in the heliocentric J2000 ecliptic frame. The table is only valid from **1800 through 2050**; the timeline is limited to that range. Earth uses the Earth–Moon barycenter, not Earth's center. The JavaScript UTC date is treated approximately as TDB in the model, introducing an additional timing offset. Orbit guides freeze fitted elements at a given year and are not exact future trajectories. The fitted model is not a numerical N-body integration and does not include full perturbations, light-time corrections, precession or a high-precision ephemeris. Rotations and tidal locking are approximate and are not registered to actual prime-meridian epochs. Earth and Jupiter system models anchor their satellites to the rendered planet, whose center uses the approximate planetary barycenter. Do not use this simulator for navigation or precision astronomy.

### Limited Horizons validation

On 2026-11-13, six geometric heliocentric J2000 ecliptic vectors were obtained from JPL Horizons DE441 for the Earth–Moon, Mars and Jupiter **system barycenters**, at JDTDB 2451545.0 and 2460677.0. Comparing against this model using the same numerical date as UTC yielded the following Euclidean vector differences (including the uncorrected UTC/TDB difference):

| System barycenter | 2000-01-01 12:00 | 2025-01-01 12:00 |
| --- | ---: | ---: |
| Earth–Moon | 2,006 km | 3,080 km |
| Mars | 8,193 km | 18,601 km |
| Jupiter | 1,149,745 km | 609,716 km |

The source query format is [Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html), with `CENTER=500@10`, `REF_PLANE=ECLIPTIC`, `OUT_UNITS=AU-D`, `VEC_TABLE=1`, `VEC_CORR=NONE` and commands `3`, `4`, `5`. These are sparse regression checks, **not comprehensive validation** and not guaranteed error bounds. The automated tests retain the reference vectors and broad tolerances. The live comparison endpoint uses UT and displays its retrieval date.

Positions are calculated in JavaScript double precision but rendering uses nonlinear distance compression and separately exaggerated radii. This is not a floating-origin multiscale architecture. The atmosphere, cloud motion, belt particles, procedural star field and ring profile are illustrative rather than measured current observations. Texture maps are not live images. Planetary measurements are rounded from [NASA's Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/); gas/ice giant temperatures are representative upper-atmosphere values. Missing values are shown as unavailable. Static facts were consulted on 2026-11-13; moon counts are deliberately omitted because they change.

**Major remaining work:** precision ephemerides for other satellites; independently simulated dwarf planets other than Pluto, asteroids and comets without an on-demand catalogue query; Oort Cloud; observed detailed minor-body shapes; normal/displacement maps, physically based atmospheric scattering, ring shadows and higher-fidelity lighting; perturbations and precision ephemerides; adaptive rendering/geometry LOD; comprehensive object profiles; robust long-duration performance and leak testing; broad browser/device/accessibility QA; and validation across all bodies and dates. Phase 1 should not be marked complete until these gaps and the original project's broader requirements are addressed.

### Satellite and Pluto spot checks

Satellite vectors are calculated with [Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT), using its lunar and Galilean moon models; Pluto uses its Pluto-system trajectory. J2000 equatorial vectors are rotated to the J2000 ecliptic. Parent-relative satellite vectors were compared with Horizons at 2000-01-01 and 2025-01-01, 12:00 UT (Moon relative to Earth, Galilean moons relative to Jupiter; DE441 / jup365_merged). Approximate Euclidean differences in km:

| Body | 2000 | 2025 |
| --- | ---: | ---: |
| Moon | 10.7 | 10.8 |
| Io | 59.8 | 49.8 |
| Europa | 64.3 | 49.3 |
| Ganymede | 150.5 | 296.0 |
| Callisto | 155.8 | 538.2 |
| Pluto system barycenter, heliocentric | 9,722 | 129,727 |

These are only two spot checks, not guaranteed errors for other dates. Satellite paths are sampled predictions over one approximate orbital period, not exact closed orbits. The local visualization applies independent scale changes and approximate surface orientation, so its appearance cannot be used to judge physical distances, libration or eclipses.

## Asset attribution

- Io: [NASA/JPL/USGS PIA00319](https://photojournal.jpl.nasa.gov/catalog/PIA00319).
- Europa: [USGS/PDS/Tammy Becker Voyager–Galileo SSI mosaic](https://astrogeology.usgs.gov/search/map/Europa/Voyager-Galileo/Europa_Voyager_GalileoSSI_global_mosaic_500m).
- Ganymede: Caltech/JPL/USGS Voyager global map, distributed at [JPL maps](https://maps.jpl.nasa.gov/pix/jup3vss2.jpg).
- Callisto: [USGS equatorial map mosaic](https://geopubs.wr.usgs.gov/i-map/i2770/).
- The above four maps were retrieved through [to-boldly-glow and its asset credits](https://github.com/bjblazko/to-boldly-glow/blob/main/CREDITS.md), which identifies them as NASA/JPL/USGS public-domain imagery. Their mosaics have incomplete coverage and are stretched onto spheres; no current appearance is implied.
- Pluto: NASA/Johns Hopkins University Applied Physics Laboratory/Southwest Research Institute, [PIA11707 Pluto Color Map](https://photojournal.jpl.nasa.gov/catalog/PIA11707), distributed in [amarcher/solar-system](https://github.com/amarcher/solar-system/blob/main/docs/assets/public-domain-maps.md). Roughly 30% of the processed map is neutral-gray fill where coverage is unavailable, not observed terrain. Observe NASA's image-use guidelines.


The original planet, Sun and Moon texture maps were retrieved from the [SolarSystem-Planet-Textures collection](https://github.com/LDCastroverde/SolarSystem-Planet-Textures), which attributes them to [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0). The Earth day, night, cloud and specular maps came from [Three.js example textures](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets); their original individual provenance and licensing should be independently verified before redistribution. These are visualization maps, not unaltered live NASA photographs. Stars, atmosphere, rings, belts and small-body shapes are procedural/illustrative.

## Architecture and verification

`src/orbits.js` contains planetary and small-body coordinate calculation; `src/satellites.js` contains Astronomy Engine satellite and Pluto adapters; `src/data.js` the local inventory; `src/Scene.jsx` the Three.js renderer and camera; `src/ScienceTools.jsx` the JPL tools; `src/main.jsx` the UI; `server/app.js` the proxy and `server/index.js` its entry point. `npm test` checks orbit math, selected Horizons planet, Pluto and satellite snapshots, validation, cache and API failure handling with mocked upstreams; `npm run build` builds the app. Headless Chromium smoke tests exercised desktop and mobile interactions, with mocked SBDB/Horizons responses. The sandbox server could not reach those external hosts, so live end-to-end proxy calls were not verified there. These tests do not replace hardware, long-duration or comprehensive ephemeris validation.

Codebase developed with Arena.ai. Scientific concept, project direction, ideas and development prompts created by a human developer.
