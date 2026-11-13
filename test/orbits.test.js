import test from 'node:test';
import assert from 'node:assert/strict';
import {orbitalPosition, orbitalPath, heliocentricPosition, illustrativeMoonPosition} from '../src/orbits.js';
import {planets} from '../src/data.js';
const epoch=new Date('2000-01-01T12:00:00Z');
test('all eight planet positions are finite',()=>{assert.equal(planets.length,8);for(const p of planets) assert.ok(orbitalPosition(p,epoch).every(Number.isFinite),p.name)});
test('orbit guides are closed and eccentric',()=>{for(const p of planets){const path=orbitalPath(p,epoch);assert.ok(Math.hypot(...path[0].map((x,i)=>x-path.at(-1)[i]))<1e-8,p.name)}const radii=orbitalPath(planets[0],epoch).map(v=>Math.hypot(...v));assert.ok(Math.max(...radii)-Math.min(...radii)>.5)});
test('illustrative Moon orbit keeps a constant radius and repeats',()=>{const first=illustrativeMoonPosition(epoch);const quarter=illustrativeMoonPosition(new Date(epoch.getTime()+27.321661*86400000/4));const repeat=illustrativeMoonPosition(new Date(epoch.getTime()+27.321661*86400000));assert.ok(Math.abs(Math.hypot(...quarter)-2.2)<1e-10);assert.ok(Math.hypot(...first.map((x,i)=>x-repeat[i]))<1e-7)});
// Horizons DE441, geometric heliocentric J2000 ecliptic vectors, AU.
// Retrieved 2026-11-13. Dates are JDTDB; UTC is used as a close approximation.
const cases=[
 ['earth','2000-01-01T12:00:00Z',[-.1771587841839055,.9672193524609504,-.000001139275508446145],.0002],
 ['earth','2025-01-01T12:00:00Z',[-.187263125224993,.9653216684602458,-.00005344551046001328],.0002],
 ['mars','2000-01-01T12:00:00Z',[1.390715921746287,-.01341631815233992,-.03446766277585426],.0005],
 ['mars','2025-01-01T12:00:00Z',[-.5280371644188733,1.523551713172632,.04487609238877873],.0005],
 ['jupiter','2000-01-01T12:00:00Z',[4.001177161126058,2.938576106966103,-.101785276633744],.02],
 ['jupiter','2025-01-01T12:00:00Z',[1.052295270735576,4.972413209317416,-.04419841313423648],.02],
];
test('approximate model agrees with selected Horizons reference vectors within documented broad tolerances',()=>{for(const [id,date,reference,tolerance] of cases){const actual=heliocentricPosition(planets.find(p=>p.id===id),new Date(date));const error=Math.hypot(...actual.map((v,i)=>v-reference[i]));assert.ok(error<tolerance,`${id} ${date}: ${error} AU`);}});

test('small-body elements reject unsupported or incomplete orbits and propagate an ellipse',async()=>{
 const {parseSmallBodyOrbit,smallBodyHeliocentricPosition}=await import('../src/orbits.js');
 const elements=Object.entries({a:2,e:.2,i:0,om:0,w:0,ma:0,n:1}).map(([name,value])=>({name,value:String(value)}));
 const orbit=parseSmallBodyOrbit({orbit:{epoch:'2451545.0',elements}});assert.ok(orbit);
 const p=smallBodyHeliocentricPosition(orbit,epoch);assert.ok(Math.abs(p[0]-1.6)<1e-10);
 assert.equal(parseSmallBodyOrbit({orbit:{epoch:'2451545',elements:elements.filter(e=>e.name!=='ma')}}),null);
 assert.equal(parseSmallBodyOrbit({orbit:{epoch:'2451545',elements:elements.map(e=>e.name==='e'?{...e,value:'1.2'}:e)}}),null);
});
