import test from 'node:test';
import assert from 'node:assert/strict';
import {interpolateTrack} from '../src/liveMoons.js';
// Horizons, Phobos relative to Mars, J2000 ecliptic, 2026-11-13 UT, mar099.
// Hourly states and independent half-hour position retrieved 2026-11-13.
const samples=[
 {jd:2461357.5,positionAU:[-5.107165042343581e-5,-3.040979097149864e-5,2.260900962345730e-5],velocityAUPerDay:[5.047774293419358e-4,-1.065145170508731e-3,-3.013163724789396e-4]},
 {jd:2461357.541666667,positionAU:[-1.657937728519035e-5,-6.081226473273943e-5,4.435885314767470e-6],velocityAUPerDay:[1.061908375762961e-3,-3.118085977322248e-4,-5.239080343227123e-4]}
];
test('Hermite interpolation reproduces Horizons Phobos midpoint within a broad regression tolerance',()=>{
 const at=new Date('2026-11-13T00:30:00Z'),reference=[-3.676796094506715e-5,-4.958460114687415e-5,1.469834042702106e-5];
 const actual=interpolateTrack(samples,at),error=Math.hypot(...actual.map((v,i)=>v-reference[i]))*149597870.7;
 assert.ok(error<15,`midpoint error: ${error} km`);
 assert.deepEqual(interpolateTrack(samples,new Date('2026-11-13T00:00:00Z')),samples[0].positionAU);
 assert.equal(interpolateTrack(samples,new Date('2026-11-12T23:59:59Z')),null);
 assert.equal(interpolateTrack(samples,new Date('2026-11-13T01:01:00Z')),null);
});
