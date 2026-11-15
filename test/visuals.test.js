import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Texture,MeshLambertMaterial,ShaderMaterial} from 'three';
import {createDetailTextureController,makeRingMaterial,makeCatalogSky} from '../src/visuals.js';
function mockTexture(){const texture=new Texture();let disposed=0;texture.addEventListener('dispose',()=>disposed++);return {texture,get disposed(){return disposed}};}
test('focused detail textures are quality gated, restored, disposed and race safe',()=>{
 const baseA=new Texture(),baseB=new Texture(),a=new ShaderMaterial({uniforms:{dayMap:{value:baseA}}}),b=new MeshLambertMaterial({map:baseB});const queue=[];
 const loader={load(url,onload,_progress,onerror){queue.push({url,onload,onerror})}},renderer={capabilities:{maxTextureSize:8192,getMaxAnisotropy:()=>4}};
 const manager=createDetailTextureController(renderer,{mars:{material:a,base:baseA,file:'mars_4k.jpg'},saturn:{material:b,base:baseB,file:'saturn_4k.jpg'}},loader);
 manager.update('mars','LOW');assert.equal(queue.length,0);manager.update('mars','HIGH');assert.equal(queue.length,1);manager.update('saturn','HIGH');assert.equal(queue.length,2);
 const stale=mockTexture();queue[0].onload(stale.texture);assert.equal(stale.disposed,1);assert.equal(a.uniforms.dayMap.value,baseA);
 const live=mockTexture();queue[1].onload(live.texture);assert.equal(b.map,live.texture);assert.equal(live.texture.anisotropy,4);
 manager.update('saturn','LOW');assert.equal(b.map,baseB);assert.equal(live.disposed,1);
 manager.update('mars','HIGH');const last=mockTexture();manager.dispose();queue[2].onload(last.texture);assert.equal(last.disposed,1);assert.equal(a.uniforms.dayMap.value,baseA);
 const small=createDetailTextureController({capabilities:{maxTextureSize:2048}}, {mars:{material:a,base:baseA,file:'mars_4k.jpg'}},loader);small.update('mars','HIGH');assert.equal(queue.length,3);small.dispose();
 const failed=createDetailTextureController(renderer,{mars:{material:a,base:baseA,file:'mars_4k.jpg'}},loader);failed.update('mars','HIGH');queue[3].onerror();assert.equal(a.uniforms.dayMap.value,baseA);failed.dispose();
});
test('ring shader receives separate scene-relative Sun and planet positions',()=>{const material=makeRingMaterial(3,.52,.86,1);assert.equal(material.uniforms.planetRadius.value,3);assert.equal(material.uniforms.ringInner.value,.52);assert.equal(material.uniforms.ringGap.value,.86);assert.notEqual(material.uniforms.center.value,material.uniforms.sunPosition.value);assert.match(material.fragmentShader,/sunPosition-vWorld/);material.dispose()});
test('optional visual assets are present as JPEG files',async()=>{for(const name of ['graphics/artistic-deep-space.jpg','textures/jupiter_4k.jpg','textures/saturn_4k.jpg','textures/mars_4k.jpg','graphics/nasa-deep-star-map-4k.jpg','graphics/nasa-deep-star-map-2k.jpg','textures/moon_lroc_2k.jpg','textures/moon_lroc_4k.jpg']){const file=await readFile(new URL('../public/'+name,import.meta.url));assert.equal(file[0],0xff);assert.equal(file[1],0xd8)}});

test('NASA star map selects a GPU-compatible panorama and registers it for disposal',()=>{
 const calls=[],textures=[],loader={load(url){calls.push(url);return new Texture()}};
 const large=makeCatalogSky(loader,textures,4096),small=makeCatalogSky(loader,textures,2048);
 assert.deepEqual(calls,['/graphics/nasa-deep-star-map-4k.jpg','/graphics/nasa-deep-star-map-2k.jpg']);
 assert.deepEqual(textures,[large,small]);assert.equal(large.mapping,small.mapping);assert.equal(large.colorSpace,small.colorSpace);
});

test('surface and atmosphere shaders use scene-relative sunlight and logarithmic depth',async()=>{
 const {surfaceVertex,surfaceFragment,atmosphereVertex,atmosphereFragment,ringVertex,ringFragment,makeAtmosphereMaterial}=await import('../src/visuals.js');
 const {Vector3}=await import('three');const position=new Vector3(3,4,5),material=makeAtmosphereMaterial('earth',position);
 assert.equal(material.uniforms.sunPosition.value,position);assert.match(surfaceFragment,/sunPosition-vWorldPosition/);assert.match(atmosphereFragment,/sunPosition-vWorld/);
 for(const vertex of [surfaceVertex,atmosphereVertex,ringVertex]){assert.match(vertex,/#include <common>/);assert.match(vertex,/#include <logdepthbuf_vertex>/)}
 for(const fragment of [surfaceFragment,atmosphereFragment,ringFragment])assert.match(fragment,/#include <logdepthbuf_fragment>/);
 material.dispose();
});

test('cinematic glow uses reduced blur dimensions and bypasses cleanly',async()=>{
 const {bloomDimensions,createCinematicEffects}=await import('../src/cinematicEffects.js');
 assert.deepEqual(bloomDimensions(1000,500,2),[1000,500]);assert.deepEqual(bloomDimensions(1,1,1),[1,1]);
 const scene={},camera={},calls=[];const renderer={render:(s,c)=>calls.push([s,c])};
 const effects=createCinematicEffects(renderer,scene,camera);effects.resize(800,600);effects.render(false);effects.dispose();assert.deepEqual(calls,[[scene,camera]]);
});

test('NASA Blue Marble texture has verified bytes',async()=>{
 const {createHash}=await import('node:crypto');const data=await readFile(new URL('../public/textures/earth_blue_marble_4k.jpg',import.meta.url));
 assert.equal(createHash('sha256').update(data).digest('hex'),'228deba2e4b600146bdcb6cfa359b8ead6aacc2b1c13550a29cd82824cfa1c01');
});
test('all catalogue previews have lightweight local thumbnails',async()=>{
 const {allObjects}=await import('../src/data.js');const {statSync}=await import('node:fs');
 for(const file of new Set(allObjects.map(o=>o.texture).filter(Boolean)))assert.ok(statSync(new URL('../public/thumbs/'+file,import.meta.url)).size<50000,file);
});
