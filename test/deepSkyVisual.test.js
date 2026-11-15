import test from 'node:test';
import assert from 'node:assert/strict';
import {DEEP_SKY} from '../src/deepSky.js';
import {buildDeepSkyCloud} from '../src/deepSkyVisual.js';
test('every deep-sky destination has a reproducible bounded illustrative cloud',()=>{
 for(const object of DEEP_SKY){const a=buildDeepSkyCloud(object),b=buildDeepSkyCloud(object);assert.deepEqual(a,b);assert.equal(a.positions.length,a.colors.length);assert.ok(a.positions.length>=1000);assert.ok(a.positions.every(v=>Number.isFinite(v)&&Math.abs(v)<=.5));assert.ok(a.colors.every(v=>Number.isFinite(v)&&v>=0&&v<=1))}
 assert.notDeepEqual(buildDeepSkyCloud(DEEP_SKY[0]).positions,buildDeepSkyCloud(DEEP_SKY[1]).positions);
});
test('illustrative cluster field is repeatable and bounded',async()=>{
 const {clusterField}=await import('../src/landmarkArtwork.js');const stars=clusterField('pleiades');assert.equal(stars.length,115);assert.deepEqual(stars,clusterField('pleiades'));assert.ok(stars.every(s=>s.x>=0&&s.x<=640&&s.y>=0&&s.y<=380&&s.r>0));
});
