import test from 'node:test';
import assert from 'node:assert/strict';
import {AU_KM,RADII_KM,radiusAU} from '../src/scaleModel.js';
import {eclipticToScene,heliocentricPosition,orbitalPath,smallBodyHeliocentricPosition,smallBodyPath} from '../src/orbits.js';
import {planets} from '../src/data.js';
import {MINOR_BODIES} from '../src/minorBodies.js';
import {SATELLITES} from '../src/satellites.js';
import {LIVE_MOONS} from '../src/liveMoons.js';

test('physical radii use kilometres per astronomical unit and cover modeled objects',()=>{
 for(const id of ['sun',...planets.map(p=>p.id),'pluto',...Object.keys(MINOR_BODIES),...Object.keys(SATELLITES),...Object.keys(LIVE_MOONS)]){
  assert.ok(radiusAU(id)>0,`missing ${id}`);assert.ok(Math.abs(radiusAU(id)*AU_KM-RADII_KM[id])<1e-9);
 }
 assert.equal(radiusAU('unknown'),null);
 assert.ok(Math.abs(radiusAU('earth')/radiusAU('moon')-6371/1737.4)<1e-12);
});
test('physical frame is a distance preserving, right handed rotation',()=>{
 assert.deepEqual(eclipticToScene([1,2,3]),[1,3,-2]);
 assert.equal(Math.hypot(...eclipticToScene([3,4,12])),13);
 const d=new Date('2025-01-01T12:00:00Z'),earth=planets.find(p=>p.id==='earth');
 assert.ok(Math.hypot(...heliocentricPosition(earth,d))>.9);
 assert.ok(Math.hypot(...orbitalPath(earth,d,32,true)[0])<1.1);
 const ceres=MINOR_BODIES.ceres, path=smallBodyPath(ceres,32,true);
 assert.ok(Math.hypot(...path[0])>2 && Math.hypot(...path[0])<3.2);
 assert.ok(Math.hypot(...smallBodyHeliocentricPosition(ceres,d))>2);
});
