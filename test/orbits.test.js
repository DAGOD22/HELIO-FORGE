import test from 'node:test';
import assert from 'node:assert/strict';
import {orbitalPosition, illustrativeMoonPosition} from '../src/orbits.js';
import {planets} from '../src/data.js';
const epoch=new Date('2000-01-01T12:00:00Z');
test('all eight planet positions are finite',()=>{assert.equal(planets.length,8);for(const p of planets) assert.ok(orbitalPosition(p,epoch).every(Number.isFinite),p.name)});
test('positions repeat after one modeled orbital period',()=>{for(const p of planets){const a=orbitalPosition(p,epoch), b=orbitalPosition(p,new Date(epoch.getTime()+p.days*86400000));assert.ok(Math.hypot(...a.map((x,i)=>x-b[i]))<1e-5,p.name)}});
test('eccentric orbit is not circular',()=>{const p=planets[0];const radii=Array.from({length:80},(_,i)=>Math.hypot(...orbitalPosition(p,new Date(epoch.getTime()+p.days*86400000*i/80))));assert.ok(Math.max(...radii)-Math.min(...radii)>.5)});

test('illustrative Moon position keeps a constant radius and repeats after its approximate sidereal period',()=>{const first=illustrativeMoonPosition(epoch);const quarter=illustrativeMoonPosition(new Date(epoch.getTime()+27.321661*86400000/4));const repeat=illustrativeMoonPosition(new Date(epoch.getTime()+27.321661*86400000));assert.ok(Math.abs(Math.hypot(...quarter)-2.2)<1e-10);assert.ok(Math.hypot(...first.map((x,i)=>x-repeat[i]))<1e-7)});
