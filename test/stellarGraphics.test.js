import test from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {DEEP_SKY,DEEP_SKY_IMAGES} from '../src/deepSky.js';
import {clusterPoints} from '../src/landmarkArtwork.js';
import {glyphAngle,stellarFragment} from '../src/stellarGlyph.js';

test('every landmark has either an existing observation thumbnail or a deterministic illustration',async()=>{
 assert.equal(DEEP_SKY.length,9);
 for(const object of DEEP_SKY){const image=DEEP_SKY_IMAGES[object.id];if(image){await access(new URL('../public/deepsky/'+image.file,import.meta.url));assert.ok(image.credit&&image.source)}else{assert.equal(object.id,'pleiades');const points=clusterPoints(object.id);assert.equal(points.length,34);assert.deepEqual(points,clusterPoints(object.id));assert.ok(points.every(p=>[p.x,p.y,p.r].every(Number.isFinite)));}}
});
test('stellar details are stable, finite and symbolic',()=>{
 assert.equal(glyphAngle('70666'),glyphAngle('70666'));assert.notEqual(glyphAngle('70666'),glyphAngle('70667'));
 assert.match(stellarFragment,/surface/);assert.match(stellarFragment,/gl_PointCoord/);assert.match(stellarFragment,/seed/);
});
