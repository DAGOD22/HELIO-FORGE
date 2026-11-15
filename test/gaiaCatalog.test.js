import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {validateGaia,gaiaRecord,gaiaPosition,gaiaRenderIndex,GAIA_COUNT} from '../src/gaiaCatalog.js';
test('one million Gaia records have a verified schema, distinct identities and consistent positions',async()=>{
 const data=await readFile(new URL('../public/data/gaia-dr3-1m.bin',import.meta.url)),meta=JSON.parse(await readFile(new URL('../public/data/gaia-dr3-1m.json',import.meta.url)));
 assert.equal(data.length,24000016);assert.equal(createHash('sha256').update(data).digest('hex'),meta.sha256);assert.equal(meta.count,1000000);
 const v=validateGaia(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)),seen=new Set();for(let i=0;i<GAIA_COUNT;i++){const id=v.getBigUint64(16+i*24+12,true);assert.ok(id>0n);assert.ok(!seen.has(id));seen.add(id);if(i%997===0){const star=gaiaRecord(v,i);assert.ok(star.distancePc>95&&star.distancePc<505);assert.equal(gaiaPosition(star.xyz).length,3)}}
 assert.equal(seen.size,GAIA_COUNT);assert.notEqual(gaiaRenderIndex(1),gaiaRenderIndex(2));assert.throws(()=>validateGaia(new ArrayBuffer(20)));
});
