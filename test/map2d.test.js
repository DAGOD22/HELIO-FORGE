import test from 'node:test';
import assert from 'node:assert/strict';
import {clampMapZoom,exoplanetPhase,mapProjection} from '../src/map2d.js';
import {projectGlobe} from '../src/globeProjection.js';

test('2D projections retain the chosen center and ignore vertical depth explicitly',()=>{
 assert.deepEqual(mapProjection([26,99,10],[26,0,10],100),[500,300]);assert.deepEqual(mapProjection([126,0,110],[26,0,10],100),[740,540]);
 assert.equal(clampMapZoom(0),.55);assert.equal(clampMapZoom(100),3);
});
test('schematic exoplanet phases advance only with a measured period',()=>{
 const measured={pl_orbper:10,pl_orbperlim:0},unknown={pl_orbper:10,pl_orbperlim:1};
 assert.equal(exoplanetPhase(measured,0,1,5),Math.PI);assert.equal(exoplanetPhase(unknown,0,1,5),0);
});
test('software globe projection keeps corners transparent and samples the visible map',()=>{
 const data=new Uint8ClampedArray(4*2*4);for(let i=0;i<8;i++){data[i*4]=i+1;data[i*4+3]=255}
 const result=projectGlobe(data,4,2,5);assert.equal(result[3],0);assert.equal(result[(2*5+2)*4],7);assert.equal(result[(2*5+2)*4+3],255);
 assert.throws(()=>projectGlobe(data,0,2));assert.throws(()=>projectGlobe(data,4,2,0));
});
