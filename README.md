# COSMOS — Solar System Observatory

An interactive, scientifically transparent Solar System and Milky Way explorer. **Phase 1 remains incomplete**, and Phase 2 has begun with a schematic galaxy and a nearby-star catalogue. Neither mode is a precision universe simulator.

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

- WebGL scene with textured Sun, eight planets, Pluto, Ceres, the Moon and the four Galilean moons; generic procedural models of Haumea, Makemake, Eris, Eros and Halley; Earth day/night maps, cloud layer, ocean highlights and illustrative atmosphere; procedural Saturn rings and star field; Sun-directed planetary shading. Exposure is normalized for readability, not radiometrically accurate.
- Date, play/pause, reverse, speed and reset controls, drag/zoom/pan, click selection, overview, follow, orbital paths, labels and display settings. The default readable view exaggerates body sizes and compresses distances; focus normally isolates the selected world. “Show surrounding bodies” retains the surrounding system with the same compressed scales.
- **Physical-scale navigation** in Display Settings renders modeled centers in AU and spheres using approximate physical radii. Focus-relative coordinates are computed in double precision before rendering, with logarithmic depth buffering; smoothly refocus using the catalogue and zoom or pan across the system. At real scale most bodies are too small to click or see from a system overview, so labels and the catalogue aid navigation. Orbital positions remain approximations and some planet centers are system barycenters; stars, labels, belt particles and ring appearance are illustrative. Oort Cloud automatically switches to the separately scaled conceptual view. The physical view does not render atmospheres or cloud layers. Unknown SBDB diameters produce no visible surface rather than an invented size. Saturn’s broad ring inner/outer radii are approximately scaled to Saturn; opacity and shape are illustrative. Surface orientations, solar illumination and spherical shapes are approximate, especially for irregular bodies. Haumea uses an approximate equatorial radius; Makemake and Eris use half of NASA’s approximate diameters. Phobos, Deimos, Enceladus, Rhea and Iapetus use volume-equivalent spheres based on published axes. See [NASA Haumea](https://science.nasa.gov/dwarf-planets/haumea/), [Makemake](https://science.nasa.gov/dwarf-planets/makemake/), [Eris](https://science.nasa.gov/dwarf-planets/eris/) and the moon fact sheets below.
- Symbolic, procedural asteroid and Kuiper belt particles visible in overview: their radii are broadly illustrative, and the particles are **not** catalogue bodies or real individual positions. They can be toggled off. A separate conceptual Oort Cloud view depicts a hypothesized spherical shell with artificial particles, not observed objects or measured densities; the shell and inner system have independent scales. [NASA](https://science.nasa.gov/solar-system/oort-cloud/facts/) describes the cloud as extending roughly 5,000–100,000 AU, with an uncertain structure.
- Searchable local inventory with filtering, sorting, favourites and recent items; size comparison of planets, Pluto, Ceres, Eros, Halley and selected moons (a 4-pixel minimum means very small bodies are not exactly proportional). The Moon and four Galilean moons use approximate date-dependent satellite vectors; Pluto uses its approximate system-barycenter trajectory. The remaining named dwarf planets, Eros and Halley use offline osculating-element approximations; the remaining listed moons interpolate live Horizons tracks when available.
- **Additional moon tracks:** selecting Phobos, Deimos, Titan, Enceladus, Rhea, Iapetus, Triton or Charon requests 25 hourly Horizons parent-centered geometric position and velocity vectors spanning the selected UT day. Cubic Hermite interpolation animates between samples without extrapolation. Pause or use real-time speed to load a track; rapid playback suspends requests. When JPL is unavailable the parent is shown with an error, and retry is offered. The parent itself uses an approximate system-barycenter position (including Charon anchored to the Pluto-system barycenter rather than the Pluto center); visual sizes and distances are independently exaggerated in the readable view; the optional physical view retains physical scale.
- Live SBDB search by name/designation in NASA Data. A returned bound elliptical orbit with complete elements can be explored as a two-body approximation from its JPL solution epoch; its generic rock shape is procedural and is **not an observed image or shape model**. Hyperbolic, incomplete, or unavailable solutions are not rendered. Solar perturbations and uncertainty are not propagated, so the approximation may degrade substantially away from the solution epoch.
- On-demand Horizons vector comparison for the selected planet, Pluto, modeled moon, or offline minor body, at 12:00 UT on the simulation date, in the object's profile and NASA Data. The uncompressed model and the JPL result are compared in AU and km; no result is faked if the request fails.
- Five manual quality settings adjust resolution and the number of illustrative particles (sphere mesh detail also changes in the readable view); toggles control atmosphere/clouds, orbit guides, labels, surrounding context and symbolic belts. These presets are not yet an adaptive LOD system.

## Phase 2: Milky Way and the solar neighborhood

Select **MILKY WAY** in the top navigation; return using **SOLAR SYSTEM**. The overview is an interactive, procedurally generated barred-spiral *illustration*, not a photograph, real star catalogue, fitted spiral-arm map, or a simulation of galactic dynamics. Its 38,000 artificial particles have no individual astronomical counterparts. The illustrative disk is about 100,000 light-years across; the Sun is placed 26,000 light-years from the center, in the plane, at an arbitrarily chosen azimuth. Neither the relative orientation nor exact shape, number and location of the arms should be treated as an observation. The detailed structure of the Galaxy remains uncertain. The particles disappear as the camera approaches the local stars, avoiding a false impression of individually mapped galactic stars. The Galactic Center marker is not a physical-scale rendering of Sagittarius A*.

Select **Solar neighborhood** or a star in the searchable catalogue to navigate among **1,900 entries within 20 parsecs** of the Sun. This is a filtered, incomplete subset of the **HYG Stellar Database v4.0**, assembled by David Nash / Astronexus from the Hipparcos, Yale Bright Star and Gliese catalogues. It is not Gaia data and not a complete census. Search covers all entries even though at most 80 results are shown at once. Each star's J2000 equatorial right ascension and declination are transformed using the standard IAU Galactic rotation and its catalogue distance converted from parsecs to light-years (1 pc = 3.261563777 ly). Relative positions use those static estimates; parallax uncertainties, proper motion, binary orbital motion, stellar sizes and light travel time are not modeled. Point colors are simplified from catalogue color index where available and not calibrated photometry; rendered sizes and brightnesses are symbolic. Close companions can overlap on screen. The solar-system and galaxy modes use separate scenes, not a continuous physical transition down to planetary scale. The Solar System timeline pauses while exploring the galaxy and resumes with its previous play/pause state on return.

### Deep-sky landmarks and observations

The Milky Way catalogue now includes nine individually sourced nebulae and clusters. Search by common name, catalogue designation, type or constellation; use the checkbox to show or hide their labelled map markers. Their 3-D locations are derived from approximate NASA/Hubble image pointings and rounded published distances from the Sun. Pointings may not be the center of an extended object, the input frame is treated as J2000 for the rotation, and distance estimates and uncertainties vary by source. They are positioned relative to the schematic Sun location, so their positions relative to the *illustrative* galaxy arms have no scientific significance. Markers and colors are symbols, not measured sizes or 3-D reconstructions. The nearby HYG star cloud is suppressed when the camera is far from the Sun; the procedural galaxy is suppressed when zoomed very close. These visibility choices are not changes in the actual sky.

| Destination | Approx. distance | NASA pointing / distance source |
| --- | ---: | --- |
| Pleiades M45 | 440 ly | [Hubble distance study](https://science.nasa.gov/asset/hubble/hubble-refines-distance-to-the-pleiades-star-cluster/) |
| Orion Nebula M42 | 1,500 ly | [pointing](https://science.nasa.gov/asset/hubble/evolution-of-the-orion-nebula-m42/) / [distance](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-42/) |
| Southern Ring NGC 3132 | 2,000 ly | [Hubble](https://science.nasa.gov/asset/hubble/a-glowing-pool-of-light-planetary-nebula-ngc-3132/) |
| Ring Nebula M57 | 2,300 ly | [Hubble](https://science.nasa.gov/asset/hubble/the-ring-nebula-m57/) (text also says ~2,000 ly) |
| Lagoon Nebula M8 | 4,000 ly | [Hubble](https://science.nasa.gov/asset/hubble/lagoon-nebula-visible-light-view/) |
| Crab Nebula M1 | 6,500 ly | [NASA/Hubble](https://science.nasa.gov/asset/hubble/crab-nebula-2/) |
| Eagle Nebula M16 | 6,500 ly | [Hubble Pillars of Creation pointing](https://science.nasa.gov/asset/hubble/gas-pillars-in-the-eagle-nebula-m16-pillars-of-creation-in-a-star-forming-region/) |
| Omega Centauri NGC 5139 | 17,000 ly | [Hubble](https://science.nasa.gov/asset/hubble/peering-into-the-core-of-globular-cluster-omega-centauri/) |
| Hercules Cluster M13 | 25,000 ly | [Hubble](https://science.nasa.gov/asset/hubble/hubble-acswfpc2-image-of-globular-cluster-m13/) |

Eight landmarks have separate 2-D NASA observation images, displayed as cropped previews and full-image dialogs, **not** as textures or physical nebula models. Pleiades has no bundled image. The images are processed observation products rather than live views; observe NASA's image usage guidelines and any third-party rights. Source pages consulted and image-search copies retrieved 2026-11-13. Credits, details and original links are also displayed in each image dialog:

- Orion: [NASA, ESA, M. Robberto (STScI/ESA) and the Hubble Space Telescope Orion Treasury Project Team](https://science.nasa.gov/image-detail/orion-nebula-xlarge_web/). Hubble mosaic with ground-based gap filling and multiple wavelengths.
- Southern Ring: [The Hubble Heritage Team (STScI/AURA/NASA)](https://science.nasa.gov/asset/hubble/a-glowing-pool-of-light-planetary-nebula-ngc-3132/).
- Ring: [The Hubble Heritage Team (AURA/STScI/NASA)](https://science.nasa.gov/asset/hubble/the-ring-nebula-m57/).
- Lagoon: [NASA, ESA and STScI](https://science.nasa.gov/asset/hubble/lagoon-nebula-visible-light-view/).
- Crab: [NASA, ESA, J. Hester and A. Loll (Arizona State University)](https://science.nasa.gov/missions/hubble/a-giant-hubble-mosaic-of-the-crab-nebula/).
- Eagle: [NASA, ESA, STScI, J. Hester and P. Scowen (Arizona State University)](https://science.nasa.gov/asset/hubble/gas-pillars-in-the-eagle-nebula-m16-pillars-of-creation-in-a-star-forming-region/).
- Omega Centauri: [NASA and The Hubble Heritage Team (STScI/AURA); acknowledgment: A. Cool (SFSU)](https://science.nasa.gov/asset/hubble/peering-into-the-core-of-globular-cluster-omega-centauri/).
- Hercules: [NASA, ESA and the Hubble Heritage Team (STScI/AURA); acknowledgment: C. Bailyn, W. Lewin, A. Sarajedini and W. van Altena](https://science.nasa.gov/image-detail/m13-xlarge_web/).

**Data attribution and license:** `public/data/hyg-nearby-20pc.json` is an adapted subset of [HYG v4.0](https://github.com/astronexus/HYG-Database/tree/main/hyg/CURRENT), © David Nash / Astronexus, licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Retrieved 2026-11-13 from the archived GitHub repository; source `hygdata_v40.csv.gz` SHA-256 `8e3ff9e67445e558a759b117910850cff1b1d4d492f45f715c2ee2db3d869bac`. We selected positive catalogue distances ≤20 pc, kept a small set of fields, chose display-name fallbacks, sorted by distance and converted CSV to JSON. The adapted subset is also licensed CC BY-SA 4.0 and its SHA-256 is `aed16c8dee18478a649fe7f9c97132075ca6d84e2469f045e1e46814d1dd39a8`. Rebuild it with `python3 scripts/extract-hyg.py path/to/hygdata_v40.csv.gz`. HYG's data and epoch descriptions are in its [README](https://github.com/astronexus/HYG-Database/blob/main/hyg/README.md).

Galaxy context: [NASA Imagine the Universe](https://imagine.gsfc.nasa.gov/science/objects/milkyway1.html) and [ESA's guide to our galaxy](https://www.esa.int/Our_Activities/Space_Science/Gaia/Guide_to_our_Galaxy/) describe the broad disk, bar and bulge; NASA's [Milky Way classroom material](https://science.nasa.gov/wp-content/uploads/2023/10/Exploring_the_Milky_Way.pdf) discusses the Orion Spur and an approximately 26,000-light-year Sun–center distance. These are rounded contextual figures, not measurements produced by the visualization. Sources consulted 2026-11-13.

Phase 2 is an initial implementation, not complete: it lacks a comprehensive up-to-date Gaia catalogue and uncertainties, a larger, vetted deep-sky catalogue and measured 3-D nebula/cluster structures, exoplanet systems, orbital/proper-motion propagation, physical stellar rendering and seamless galaxy-to-planet transitions. Its initial coordinate tests and browser smoke checks do not constitute scientific validation of the complete catalogue.

## Scientific method and limitations

Planet positions use [NASA/JPL Table 1](https://ssd.jpl.nasa.gov/planets/approx_pos.html): J2000 elements and their secular rates, solving Kepler's equation in the heliocentric J2000 ecliptic frame. The table is only valid from **1800 through 2050**; the timeline is limited to that range. Earth uses the Earth–Moon barycenter, not Earth's center. The JavaScript UTC date is treated approximately as TDB in the model, introducing an additional timing offset. Orbit guides freeze fitted elements at a given year and are not exact future trajectories. The fitted model is not a numerical N-body integration and does not include full perturbations, light-time corrections, precession or a high-precision ephemeris. Rotations and tidal locking are approximate and are not registered to actual prime-meridian epochs. Earth and Jupiter system models anchor their satellites to the rendered planet, whose center uses the approximate planetary barycenter. Do not use this simulator for navigation or precision astronomy.

### Limited Horizons validation

On 2026-11-13, six geometric heliocentric J2000 ecliptic vectors were obtained from JPL Horizons DE441 for the Earth–Moon, Mars and Jupiter **system barycenters**, at JDTDB 2451545.0 and 2460677.0. Comparing against this model using the same numerical date as UTC yielded the following Euclidean vector differences (including the uncorrected UTC/TDB difference):

| System barycenter | 2000-01-01 12:00 | 2025-01-01 12:00 |
| --- | ---: | ---: |
| Earth–Moon | 2,006 km | 3,080 km |
| Mars | 8,193 km | 18,601 km |
| Jupiter | 1,149,745 km | 609,716 km |

The source query format is [Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html), with `CENTER=500@10`, `REF_PLANE=ECLIPTIC`, `OUT_UNITS=AU-D`, `VEC_TABLE=1`, `VEC_CORR=NONE` and commands `3`, `4`, `5`. These are sparse regression checks, **not comprehensive validation** and not guaranteed error bounds. The automated tests retain the reference vectors and broad tolerances. The live comparison endpoint uses Horizons UT and displays its retrieval date. Horizons uses UT1 before 1962, UTC afterward, and estimates future leap seconds.

Positions are calculated in JavaScript double precision. The default readable view uses nonlinear distance compression and separately exaggerated radii; the optional physical view uses a focus-relative origin, physical radii and uncompressed distances. This is not a precision ephemeris or a fully general hierarchical, adaptive-LOD universe engine. The atmosphere, cloud motion, belt particles, procedural star field and ring profile are illustrative rather than measured current observations. Texture maps are not live images. Planetary measurements are rounded from [NASA's Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/); gas/ice giant temperatures are representative upper-atmosphere values. Missing values are shown as unavailable. Static facts were consulted on 2026-11-13; moon counts are deliberately omitted because they change.

**Major remaining work:** further hardening of multiscale navigation and precision across extended distances; offline ephemerides for the live-track satellites; more accurately propagated asteroids and comets; observed detailed minor-body shapes; normal/displacement maps, physically based atmospheric scattering, ring shadows and higher-fidelity lighting; perturbations and precision ephemerides; adaptive rendering/geometry LOD; comprehensive object profiles; robust long-duration performance and leak testing; broad browser/device/accessibility QA; and validation across all bodies and dates. Phase 1 should not be marked complete until these gaps and the original project's broader requirements are addressed.

### Live-track satellite check

For the rapidly orbiting Phobos, a single comparison of cubic Hermite interpolation between Horizons 2026-11-13 00:00 and 01:00 UT state vectors against an independent 00:30 UT Horizons vector differed by approximately **9.95 km**. This is one spot check, not a general error bound or a precision claim. Sample timing follows Horizons UT (UT1 before 1962, UTC afterward, with future leap seconds estimated). Planetary centers and display geometry remain approximate.

### Offline dwarf planets, Eros and Halley

The [JPL Small-Body Database API](https://ssd-api.jpl.nasa.gov/doc/sbdb.html) supplied full-precision osculating heliocentric J2000 ecliptic elements for Ceres (solution 48), Haumea (132), Makemake (130), Eris (103) and Eros (659), retrieved 2026-11-13. For Halley, [Horizons](https://ssd.jpl.nasa.gov/horizons/) solution JPL#75 was queried for osculating elements at the same epoch. All are fixed at **JD 2461200.5 TDB (2026-06-09 00:00)** and propagated as unperturbed ellipses. Gravitational perturbations and cometary outgassing are not modeled; results may become very inaccurate away from that epoch. Displayed years from epoch are not an error estimate. UTC is approximated as TDB. Do not use these approximations for predictions or navigation.

At the element epoch, the vectors reproduced separately retrieved Horizons snapshots to within 4.1 km (Ceres), 0.2 km (Haumea, Makemake and Eris), 0.7 km (Eros), and under 1 meter (Halley). This is principally a check of element conversion, **not independent validation over time**. For Halley at 2025-01-01 12:00 TDB, the two-body result differed from Horizons by about 216,930 km; other dates and objects have not been systematically validated. The orbit guides are fixed ellipses. The shapes of Haumea, Makemake, Eris, Eros and Halley are illustrative, not measured shape models; Halley's activity and tail are not rendered. Ceres uses a Dawn mosaic. Physical entries are rounded from SBDB; missing data are not fabricated.

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

These are only two spot checks, not guaranteed errors for other dates. Satellite paths are sampled predictions over one approximate orbital period, not exact closed orbits. The readable visualization applies independent scale changes; both views use approximate surface orientations and barycenter-based parent positions, so neither should be used to judge libration or precision eclipses.

## Asset attribution

- Io: [NASA/JPL/USGS PIA00319](https://photojournal.jpl.nasa.gov/catalog/PIA00319).
- Europa: [USGS/PDS/Tammy Becker Voyager–Galileo SSI mosaic](https://astrogeology.usgs.gov/search/map/Europa/Voyager-Galileo/Europa_Voyager_GalileoSSI_global_mosaic_500m).
- Ganymede: Caltech/JPL/USGS Voyager global map, distributed at [JPL maps](https://maps.jpl.nasa.gov/pix/jup3vss2.jpg).
- Callisto: [USGS equatorial map mosaic](https://geopubs.wr.usgs.gov/i-map/i2770/).
- The above four maps were retrieved through [to-boldly-glow and its asset credits](https://github.com/bjblazko/to-boldly-glow/blob/main/CREDITS.md), which identifies them as NASA/JPL/USGS public-domain imagery. Their mosaics have incomplete coverage and are stretched onto spheres; no current appearance is implied.
- Phobos and Deimos: Philip Stooke, *Stooke Small Bodies Maps V2.0*, MULTI-SA-MULTI-6-STOOKEMAPS-V2.0, NASA Planetary Data System (2012), via [amarcher/solar-system](https://github.com/amarcher/solar-system/blob/main/docs/assets/public-domain-maps.md). Maps are projected onto spheres rather than their irregular shapes.
- Titan: [PIA22770](https://photojournal.jpl.nasa.gov/catalog/PIA22770), NASA/JPL-Caltech/University of Arizona, via the same collection. This is a tinted infrared surface mosaic beneath the haze, not a visible-light atmospheric image.
- Enceladus, Rhea and Iapetus: NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute (Paul Schenk), [PIA18435](https://photojournal.jpl.nasa.gov/catalog/PIA18435), [PIA18438](https://photojournal.jpl.nasa.gov/catalog/PIA18438), [PIA18436](https://photojournal.jpl.nasa.gov/catalog/PIA18436), via the same collection; processing reduces saturation for some maps.
- Triton: [PIA18668](https://science.nasa.gov/photojournal/map-of-triton), NASA/JPL-Caltech/Lunar and Planetary Institute (Paul Schenk), via the same collection. About 38.6% is gray no-data fill and the color saturation is reduced.
- Charon: USGS New Horizons LORRI/MVIC global mosaic, NASA/JHUAPL/SwRI/Lunar and Planetary Institute (New Horizons Team), via the same collection. About 34.1% is gray no-data fill. Moon mosaics have uneven or incomplete coverage and approximate orientation; they are not current observations.
- Ceres: USGS Ceres Dawn Framing Camera Global Mosaic 400m, NASA/JPL-Caltech/UCLA/MPS/DLR/IDA, distributed via [amarcher/solar-system](https://github.com/amarcher/solar-system/blob/main/docs/assets/public-domain-maps.md); the grayscale mosaic is stretched over a sphere and orientation is approximate. Consult the [USGS source](https://astrogeology.usgs.gov/search/map/ceres_dawn_fc_global_mosaic_400m) and NASA image-use guidelines.
- Pluto: NASA/Johns Hopkins University Applied Physics Laboratory/Southwest Research Institute, [PIA11707 Pluto Color Map](https://photojournal.jpl.nasa.gov/catalog/PIA11707), distributed in [amarcher/solar-system](https://github.com/amarcher/solar-system/blob/main/docs/assets/public-domain-maps.md). Roughly 30% of the processed map is neutral-gray fill where coverage is unavailable, not observed terrain. Observe NASA's image-use guidelines.


The original planet, Sun and Moon texture maps were retrieved from the [SolarSystem-Planet-Textures collection](https://github.com/LDCastroverde/SolarSystem-Planet-Textures), which attributes them to [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0). The Earth day, night, cloud and specular maps came from [Three.js example textures](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets); their original individual provenance and licensing should be independently verified before redistribution. These are visualization maps, not unaltered live NASA photographs. Stars, atmosphere, rings, belts, Oort shell and most minor-body shapes are procedural/illustrative.

## Architecture and verification

`src/orbits.js` contains planetary and small-body coordinate calculation; `src/satellites.js` contains Astronomy Engine satellite and Pluto adapters; `src/minorBodies.js` records the offline JPL osculating elements; `src/liveMoons.js` defines live-track moon display metadata and interpolation; `src/data.js` the local Solar System inventory; `src/galaxyModel.js`, `src/deepSky.js`, `src/GalaxyScene.jsx` and `src/GalaxyExplorer.jsx` the Milky Way, curated landmark and nearby-star view; `src/Scene.jsx` the readable Three.js renderer, `src/ScaleScene.jsx` the focus-relative physical renderer and `src/scaleModel.js` its physical radii; `src/ScienceTools.jsx` the JPL tools; `src/main.jsx` the UI; `server/app.js` the proxy and `server/index.js` its entry point. `npm test` checks galactic coordinate conversion, landmark data and catalogue invariants, orbit math, physical-scale conversions and coverage, selected Horizons planet, Pluto, satellite and minor-body snapshots, validation, cache and API failure handling with mocked upstreams; `npm run build` builds the app. Headless Chromium smoke tests exercised desktop and mobile interactions, with mocked SBDB/Horizons responses, including the live-track moon success and failure flows, physical mode focus transitions across inner planets, outer worlds and moons, Oort Cloud fallback, and a production-build smoke check. The sandbox server could not reach those external hosts, so live end-to-end proxy calls were not verified there. These tests do not replace hardware, long-duration or comprehensive ephemeris validation.

Codebase developed with Arena.ai. Scientific concept, project direction, ideas and development prompts created by a human developer.
