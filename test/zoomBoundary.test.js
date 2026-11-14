import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {attachZoomBoundary} from '../src/zoomBoundary.js';
class Surface extends EventTarget {emit(type,props){const e=new Event(type);Object.assign(e,props);this.dispatchEvent(e)}}
test('zoom boundaries trigger only the intended gesture at the threshold once',()=>{
 const surface=new Surface(),controls={object:{position:new Vector3(0,0,80)},target:new Vector3(),minDistance:1,maxDistance:100};let count=0,allowed=true;
 const detach=attachZoomBoundary(surface,controls,{direction:'out',canEnter:()=>allowed,onEnter:()=>count++});
 surface.emit('wheel',{deltaY:100});assert.equal(count,0);controls.object.position.z=100;surface.emit('wheel',{deltaY:-20});assert.equal(count,0);allowed=false;surface.emit('wheel',{deltaY:20});assert.equal(count,0);allowed=true;surface.emit('wheel',{deltaY:20});surface.emit('wheel',{deltaY:20});assert.equal(count,1);detach();surface.emit('wheel',{deltaY:20});assert.equal(count,1);
});
test('pinch boundary honors direction, eligibility, and cancellation',()=>{
 const surface=new Surface(),controls={object:{position:new Vector3(0,0,1)},target:new Vector3(),minDistance:1,maxDistance:100};let count=0;
 const detach=attachZoomBoundary(surface,controls,{direction:'in',canEnter:()=>true,onEnter:()=>count++});
 surface.emit('pointerdown',{pointerType:'touch',pointerId:1,clientX:0,clientY:0});surface.emit('pointerdown',{pointerType:'touch',pointerId:2,clientX:20,clientY:0});surface.emit('pointermove',{pointerId:2,clientX:15,clientY:0});assert.equal(count,0);surface.emit('pointermove',{pointerId:2,clientX:25,clientY:0});assert.equal(count,1);surface.emit('pointercancel',{pointerId:1});detach();
});
