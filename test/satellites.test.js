import test from 'node:test';
import assert from 'node:assert/strict';
import {SATELLITES,satelliteEclipticPosition,satelliteDisplayPosition} from '../src/satellites.js';
// JPL Horizons DE441 / jup365_merged, geometric body-centered J2000 ecliptic AU, UT.
// Retrieved 2026-11-13; sparse spot checks, not general error bounds.
const refs={
 moon:[[-.001949005522028226,-.001838439640328155,.0002424530340027334],[.001278627543880287,-.002187069935813895,-.0001925095352396891]],
 io:[[.002669599658244782,.0008711851178036747,.00007149606629146069],[.002151890126679077,-.001838919376786228,-.00003440684198192297]],
 europa:[[-.003748482607021814,-.002384813060837253,-.0001201088492789452],[.003011817551714646,.003322929994332046,.0001740034146706408]],
 ganymede:[[-.005487353679694720,-.004585117494968546,-.0002311029852166447],[.007143924645508403,.00006066039033514799,.0001042925195970892]],
 callisto:[[.002169560044385851,.01238222837962513,.0004328337891930819],[-.01058537843825153,.006926716451616362,.00007445159006500769]]
};
test('Moon and Galilean satellite vectors roughly agree with Horizons at two epochs',()=>{
 for(const [id,reference] of Object.entries(refs)) for(const [i,date] of ['2000-01-01T12:00:00Z','2025-01-01T12:00:00Z'].entries()){
  const value=satelliteEclipticPosition(id,new Date(date));const error=Math.hypot(...value.map((x,k)=>x-reference[i][k]))*149597870.7;
  assert.ok(error<1000,`${id} ${date}: ${error.toFixed(1)} km`);
 }
});
test('all satellite display vectors are finite and evolve in time',()=>{
 for(const id of Object.keys(SATELLITES)){
  const a=satelliteDisplayPosition(id,new Date('2025-01-01T12:00:00Z'));
  const b=satelliteDisplayPosition(id,new Date('2025-01-02T12:00:00Z'));
  assert.ok(a.every(Number.isFinite));assert.ok(Math.hypot(...a.map((x,i)=>x-b[i]))>.05,id);
 }
});

test('Pluto system vector is consistent with Horizons DE441 at two epochs',async()=>{
 const {plutoEclipticPosition}=await import('../src/satellites.js');
 const references=[[-9.875349979957683,-27.95879776856433,5.850445387413073],[18.23020904573956,-30.00753339401626,-2.060270316333054]];
 for(const [i,date] of ['2000-01-01T12:00:00Z','2025-01-01T12:00:00Z'].entries()){
  const p=plutoEclipticPosition(new Date(date)),error=Math.hypot(...p.map((v,j)=>v-references[i][j]))*149597870.7;
  assert.ok(error<200000,`${date}: ${error} km`);
 }
});
