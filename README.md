# COSMOS — Solar System Observatory

An early, interactive Phase 1 foundation for a scientifically transparent Solar System explorer. **This is not a completed Phase 1 simulator.** It is a starting point for further scientific, rendering, catalogue, and accessibility work; it does not implement Phase 2.

## Getting started

Requires Node.js 20 or later.

```sh
npm install
cp .env.example .env
# Add NASA_API_KEY to .env on the server (do not commit it)
npm run dev
```

Open the Vite address printed in the terminal. For production, run `npm run build` then `npm start`; the Express server serves the built app and `/api` on `PORT` (default 3001). Set `NASA_API_KEY` as a **server-side environment variable** in your deployment environment. Never use a `VITE_` prefix or put the key in client code. The provided key is intentionally not included in this repository. The `.env` file is ignored by Git.

The NASA data panel fetches APOD, today's NEO feed, and today's DONKI solar flare notifications on demand. Requests are made by the server, cached in memory for one hour and return explicit errors for missing configuration, rate limits, upstream failures and timeouts. An upstream connection requires network access to `api.nasa.gov`. Live data cannot be verified in environments where that host is blocked. API results include retrieval time; NASA's own source links and credits should be consulted for media reuse.

## What's here

- Three.js WebGL scene with textured Sun and eight planets, a procedural star field and Saturn rings, compressed orbital paths, camera orbit/pan/zoom, click selection, focus and overview. Focus mode isolates the selected world to avoid visual collisions caused by compressed scales. Earth has a cloud layer, day/night imagery, ocean highlights and an illustrative atmospheric rim. The renderer normalizes exposure across distances for visibility; it is not a radiometric model.
- J2000-element Keplerian positions with eccentricity and inclination, approximate spin periods, play/pause, reverse, speed selection, date picker and reset.
- A small searchable catalogue of planets, named major moons and recognized dwarf planets, favourites and recently viewed list. Earth’s Moon has an illustrative inclined circular orbit with an approximate sidereal period and arbitrary phase; it is not a lunar ephemeris. Other moons and dwarf planets do not yet have simulated positions. Selecting a catalogue-only object keeps Earth in view and labels it accordingly.
- A two-object size and facts comparison for the planets and Moon. Disc diameters are proportional to mean radius; distances are not shown.
- NASA Open APIs server proxy and error states. Fact-sheet links and model disclosures are shown in the interface.
- Orbital-path and Earth-atmosphere/cloud toggles. Five manual quality settings change the render pixel-ratio cap; they do not yet adjust mesh detail, asset resolution, or other effects automatically.

## Scientific methods and limitations

Planetary orbital elements are approximate J2000 elements based on [JPL's approximate planetary positions](https://ssd.jpl.nasa.gov/planets/approx_pos.html). Kepler's equation is solved for a two-body orbit with a fixed period. This implementation does **not** apply secular element rates, gravitational perturbations, light-time corrections, precession or a high-precision ephemeris; it has **not been validated against JPL Horizons** and should not be used for navigation or precision astronomy. Use [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) for authoritative comparisons. Axial rotations are approximate and have not been registered to prime-meridian epochs. The Sun's rotation is illustrative.

Positions are computed in JavaScript double precision, then distances are nonlinearly compressed for display. Sizes are independently exaggerated; neither positions in the rendered view nor apparent sizes are to scale. This is not a high-precision multiscale floating-origin architecture. The procedural star field is not an astronomical catalogue; the atmosphere, clouds, Moon phase and ring profile are illustrative rather than a physically accurate or live observation. The Moon’s display distance is compressed and its orbital phase is arbitrary. Planetary surface maps are visualization textures, not a live image of the current date. No claim is made that procedural graphics are NASA photographs.

Planetary measurements are rounded from [NASA's Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/). Temperatures for gas/ice giants are representative upper-atmosphere values, not surface temperatures. Values missing from the catalogue are shown as unavailable rather than invented. Data are static, not automatically refreshed; consulted for this implementation on 2026-11-13. Known moon counts are deliberately omitted because they change frequently.

**Not yet implemented:** accurate lunar ephemerides or other moon, dwarf planet, asteroid or comet orbits; Kuiper Belt or Oort Cloud; normal/displacement maps, physically based atmospheric scattering and ring shadows; gravitational interactions or precision ephemerides; automatic adaptive resolution and geometry LOD; catalogue sorting and live catalogue expansion; comprehensive object profiles; long-duration memory and performance testing; broad browser/device accessibility testing; Horizons validation; and complete Phase 1 QA. NASA API data availability depends on the deployment's configuration and network. The UI is not a substitute for validating these features.

## Asset attribution

The original planet, Sun and Moon texture maps were retrieved from the [SolarSystem-Planet-Textures collection](https://github.com/LDCastroverde/SolarSystem-Planet-Textures), which attributes them to [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0). The Earth day, night, cloud and specular maps were retrieved from the [Three.js example textures](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets); their original individual provenance and licensing should be independently verified before redistribution. These are visualization maps, not unaltered live NASA photographs. The star field, atmospheric halo and Saturn rings are procedural/illustrative.

## Architecture

`src/orbits.js` contains orbital calculation; `src/data.js` the small local catalogue; `src/Scene.jsx` the Three.js renderer and camera; `src/main.jsx` the UI; `server/index.js` the NASA proxy. This separation is intended to make future replacements with ephemeris and catalogue services possible. `npm test` checks basic orbit properties; `npm run build` checks the production bundle. A headless Chromium smoke test exercised selection, controls, comparison, search, the unconfigured API state and a mobile layout using software WebGL. These tests are not a replacement for ephemeris validation, GPU performance testing or broader browser/device testing.

Codebase developed with Arena.ai. Scientific concept, project direction, ideas and development prompts created by a human developer.
