import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {zoomCamera,isEditableTarget} from '../src/cameraNavigation.js';

test('zoom controls preserve target and direction, clamp to limits and never switch views',()=>{
 const target=new Vector3(10,2,-3),camera={position:new Vector3(10,2,7)},controls={target,object:camera,minDistance:2,maxDistance:20,update(){this.updates=(this.updates||0)+1}};
 assert.equal(zoomCamera(controls,.5),true);assert.equal(camera.position.distanceTo(target),5);assert.deepEqual(target.toArray(),[10,2,-3]);
 zoomCamera(controls,.001);assert.equal(camera.position.distanceTo(target),2);zoomCamera(controls,100);assert.equal(camera.position.distanceTo(target),20);assert.equal(controls.updates,3);
 assert.equal(zoomCamera(controls,0),false);assert.equal(zoomCamera(controls,NaN),false);camera.position.copy(target);assert.equal(zoomCamera(controls,2),false);
});
test('zoom keyboard shortcuts do not take over text and form editing',()=>{
 for(const tagName of ['INPUT','TEXTAREA','SELECT'])assert.equal(isEditableTarget({tagName}),true);
 assert.equal(isEditableTarget({tagName:'DIV',isContentEditable:true}),true);assert.equal(isEditableTarget({tagName:'BUTTON'}),false);assert.equal(isEditableTarget(null),false);
});
