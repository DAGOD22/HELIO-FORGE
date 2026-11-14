import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LIGHT_YEARS_PER_PARSEC,SUN_GALACTIC_RADIUS_LY,equatorialToGalactic,starPositionLy,schematicGalaxy} from '../src/galaxyModel.js';

test('J2000 equatorial-to-Galactic rotation preserves distance and points to galactic center',()=>{
 const v=equatorialToGalactic(266.4051/15,-28.936175,42);
 assert.ok(Math.abs(v[0]-42)<.0001);assert.ok(Math.abs(v[1])<.0001);assert.ok(Math.abs(v[2])<.0001);
 for(const [ra,dec] of [[0,0],[6,0],[18.5,38.7],[14.49,-62.68]])assert.ok(Math.abs(Math.hypot(...equatorialToGalactic(ra,dec,12.34))-12.34)<1e-8);
});
test('local catalogue stars use physical distances relative to the Sun',async()=>{
 const stars=JSON.parse(await readFile(new URL('../public/data/hyg-nearby-20pc.json',import.meta.url),'utf8'));
 assert.equal(stars.length,1900);assert.equal(new Set(stars.map(s=>s.id)).size,stars.length);
 assert.ok(stars.every(s=>s.dist>0&&s.dist<=20&&s.ra>=0&&s.ra<24&&s.dec>=-90&&s.dec<=90));
 const proxima=stars.find(s=>s.id===70666),sirius=stars.find(s=>s.id===32263);
 assert.equal(proxima.name,'Proxima Centauri');assert.equal(sirius.name,'Sirius');
 assert.ok(Math.abs(proxima.dist*LIGHT_YEARS_PER_PARSEC-4.226)<.01);
 const [x,y,z]=starPositionLy(sirius);
 assert.ok(Math.abs(Math.hypot(x-SUN_GALACTIC_RADIUS_LY,y,z)-sirius.dist*LIGHT_YEARS_PER_PARSEC)<1e-8);
});
test('schematic galaxy is deterministic and finite',()=>{
 const a=schematicGalaxy(500,123),b=schematicGalaxy(500,123);
 assert.equal(a.positions.length,1500);assert.deepEqual(a.positions,b.positions);assert.deepEqual(a.colors,b.colors);
 assert.ok(a.positions.every(Number.isFinite));assert.ok(a.colors.every(n=>n>=0&&n<=1));
});

test('curated deep-sky pointings retain source distances and map to the correct solar separation',async()=>{
 const {DEEP_SKY,DEEP_SKY_BY_ID,DEEP_SKY_IMAGES}=await import('../src/deepSky.js');
 const {positionFromEquatorialLy}=await import('../src/galaxyModel.js');
 assert.equal(DEEP_SKY.length,9);
 assert.equal(new Set(DEEP_SKY.map(o=>o.id)).size,DEEP_SKY.length);
 for(const object of DEEP_SKY){
  assert.equal(DEEP_SKY_BY_ID['dso:'+object.id],object);
  assert.ok(object.ra>=0&&object.ra<24&&object.dec>=-90&&object.dec<=90&&object.distanceLy>0);
  assert.ok(object.source.startsWith('https://science.nasa.gov/'));
  const [x,y,z]=positionFromEquatorialLy(object.ra,object.dec,object.distanceLy);
  assert.ok(Math.abs(Math.hypot(x-SUN_GALACTIC_RADIUS_LY,y,z)-object.distanceLy)<1e-5);
  const image=DEEP_SKY_IMAGES[object.id];
  if(image){assert.ok(image.credit&&image.source.startsWith('https://science.nasa.gov/'));const file=await readFile(new URL(`../public/deepsky/${image.file}`,import.meta.url));assert.equal(file[0],0xff);assert.equal(file[1],0xd8);}
 }
 assert.equal(DEEP_SKY_BY_ID['dso:orion'].distanceLy,1500);
 assert.equal(DEEP_SKY_BY_ID['dso:hercules'].distanceLy,25000);
 assert.equal(DEEP_SKY_IMAGES.pleiades,undefined);
});
