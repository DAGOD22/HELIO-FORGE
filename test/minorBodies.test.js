import test from 'node:test';
import assert from 'node:assert/strict';
import {MINOR_BODIES} from '../src/minorBodies.js';
import {smallBodyHeliocentricPosition,smallBodyPath} from '../src/orbits.js';

// Horizons geometric Sun-centered J2000 ecliptic, 2026-06-09 00:00 TDB,
// retrieved 2026-11-13. JS UTC is treated as TDB at the same numeric instant.
const cases={
 ceres:[1.414905393343522,2.369595284642237,-.1856420349175861],
 haumea:[-36.80199788326568,-23.88585937196099,23.52819476267178],
 makemake:[-45.95410369733339,-9.391063638587463,24.0900875398142],
 eris:[85.13770985007086,39.59954763452047,-17.35057531924091],
 eros:[-1.158993982497945,-.6900559091641556,-.2575259080463166],
 halley:[-19.41736895825676,27.45348462368649,-9.868549797026574]
};
const errorKm=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]))*149597870.7;
test('offline minor-body elements reproduce Horizons at their osculating epoch',()=>{
 for(const [id,ref] of Object.entries(cases)){
  const actual=smallBodyHeliocentricPosition(MINOR_BODIES[id],new Date('2026-06-09T00:00:00Z'));
  assert.ok(errorKm(actual,ref)<10,`${id}: ${errorKm(actual,ref)} km`);
 }
});
test('Halley remains broadly consistent at a second epoch, not a general error bound',()=>{
 const ref=[-19.67718675513029,27.35196326385414,-9.924090039765922];
 const actual=smallBodyHeliocentricPosition(MINOR_BODIES.halley,new Date('2025-01-01T12:00:00Z'));
 assert.ok(errorKm(actual,ref)<300000);
});
test('high-eccentricity propagation remains finite near perihelion and a closed guide',()=>{
 const orbit={a:20,e:.99999,i:0,om:0,w:0,ma:.01,n:.01,epoch:2451545};
 const p=smallBodyHeliocentricPosition(orbit,new Date('2000-01-01T12:00:00Z'));
 assert.ok(p.every(Number.isFinite));
 // Verify the eccentric anomaly against Kepler's equation.
 const E=Math.atan2(p[1]/(orbit.a*Math.sqrt(1-orbit.e**2)),p[0]/orbit.a+orbit.e);
 assert.ok(Math.abs(E-orbit.e*Math.sin(E)-orbit.ma*Math.PI/180)<1e-12);
 const path=smallBodyPath(orbit);assert.ok(Math.hypot(...path[0].map((v,i)=>v-path.at(-1)[i]))<1e-8);
});
