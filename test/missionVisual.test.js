import test from 'node:test';
import assert from 'node:assert/strict';
import {visualConfiguration} from '../src/missionVisualModel.js';
import {DEFAULT_DESIGN} from '../src/missionModel.js';
import {existsSync,statSync} from 'node:fs';
test('concept illustration reflects selected spacecraft components and orbit',()=>{
 const a=visualConfiguration(DEFAULT_DESIGN),b=visualConfiguration({...DEFAULT_DESIGN,bus:'extended',solar:'body',radio:'low',instrument:'spectrometer',orbit:'mid'});
 assert.equal(a.deploy,true);assert.equal(a.highRate,true);assert.ok(b.busHeight>a.busHeight);assert.equal(b.deploy,false);assert.equal(b.highRate,false);assert.notEqual(a.sensorColor,b.sensorColor);assert.notEqual(a.orbitTilt,b.orbitTilt);assert.match(b.description,/Extended bus, body-mounted panels, low-rate radio/);
 assert.throws(()=>visualConfiguration({...DEFAULT_DESIGN,instrument:'constructor'}));
});
test('mission artwork and NASA texture assets exist',()=>{
 for(const name of ['public/graphics/mission-orbit-hero.jpg','public/graphics/mission-wildfire.jpg','public/graphics/mission-ocean.jpg','public/graphics/mission-atmosphere.jpg','public/textures/earth_blue_marble_4k.jpg']){assert.ok(existsSync(name),name);assert.ok(statSync(name).size>1000,name)}
});
test('3D concept geometry matches component choices',async()=>{
 const {makeConceptSpacecraft}=await import('../src/missionSpacecraft.js');
 const deployed=makeConceptSpacecraft(DEFAULT_DESIGN);
 const compact=makeConceptSpacecraft({...DEFAULT_DESIGN,solar:'body',radio:'low'});
 assert.ok(deployed.getObjectByName('left-array'));assert.ok(deployed.getObjectByName('left-cells'));assert.ok(deployed.getObjectByName('high-rate-reflector'));
 assert.ok(!compact.getObjectByName('left-array'));assert.ok(compact.getObjectByName('left-body-panel'));assert.ok(compact.getObjectByName('low-rate-antenna'));
 for(const model of [deployed,compact])model.traverse(node=>{node.geometry?.dispose();if(node.material){for(const m of Array.isArray(node.material)?node.material:[node.material])m.dispose()}});
});
test('payload silhouettes, two-sided arrays and procedural insulation follow the chosen design',async()=>{
 const {makeConceptSpacecraft,makeThermalBlanketTexture}=await import('../src/missionSpacecraft.js');
 const thermal=makeConceptSpacecraft({...DEFAULT_DESIGN,instrument:'thermal'}),multi=makeConceptSpacecraft({...DEFAULT_DESIGN,instrument:'multispectral'}),spectrometer=makeConceptSpacecraft({...DEFAULT_DESIGN,instrument:'spectrometer'});
 assert.ok(thermal.getObjectByName('sensor-aperture'));
 assert.ok(multi.getObjectByName('multispectral-housing'));assert.ok(!thermal.getObjectByName('multispectral-housing'));
 assert.ok(spectrometer.getObjectByName('spectrometer-housing'));assert.ok(!multi.getObjectByName('spectrometer-housing'));
 assert.ok(thermal.getObjectByName('left-cells-back'));assert.ok(thermal.getObjectByName('equipment-box'));
 const textureA=makeThermalBlanketTexture(16),textureB=makeThermalBlanketTexture(16);assert.deepEqual(textureA.image.data,textureB.image.data);assert.ok(textureA.image.data.some(value=>value!==255));
 textureA.dispose();textureB.dispose();
 for(const model of [thermal,multi,spectrometer])model.traverse(node=>{node.geometry?.dispose();if(node.isInstancedMesh)node.dispose();if(node.material)for(const m of Array.isArray(node.material)?node.material:[node.material]){m.map?.dispose();m.dispose()}});
});
