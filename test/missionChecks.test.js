import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_DESIGN} from '../src/missionModel.js';
import {preflightChecks} from '../src/missionChecks.js';
const check=(d,id)=>preflightChecks(d).find(x=>x.id===id);
test('preflight separates hard limits from educational cautions',()=>{
 assert.equal(check(DEFAULT_DESIGN,'launch').status,'ready');
 assert.equal(check({...DEFAULT_DESIGN,bus:'extended'},'launch').status,'hold');
 assert.equal(check({...DEFAULT_DESIGN,instrument:'spectrometer'},'science').status,'caution');
 assert.equal(check({...DEFAULT_DESIGN,orbit:'mid'},'orbit').status,'caution');
 assert.equal(check({...DEFAULT_DESIGN,solar:'body'},'power').status,'caution');
 assert.equal(check({...DEFAULT_DESIGN,radio:'low'},'data').status,'caution');
 assert.equal(check({...DEFAULT_DESIGN,duration:'24'},'lifetime').status,'caution');
});
test('preflight launch check agrees with model for every supported combination',async()=>{
 const {OPTIONS,OBJECTIVES,simulate}=await import('../src/missionModel.js');
 const keys=Object.keys(OPTIONS);let cases=0;
 function visit(design,i){if(i<keys.length){for(const value of Object.keys(OPTIONS[keys[i]]))visit({...design,[keys[i]]:value},i+1);return}for(const objective of Object.keys(OBJECTIVES)){const d={...design,objective},result=simulate(d);assert.equal(check(d,'launch').status,result.launched?'ready':'hold');if(result.launched){for(const solar of ['push','conserve'])for(const contacts of ['push','conserve']){const r=simulate(d,{solar,contacts});assert.ok(Math.abs(r.produced-r.returned-r.stored-r.lost)<1e-7);assert.ok(r.score>=0&&r.score<=100);assert.equal(r.timeline.length,r.parts.duration.months)}}cases++}}
 visit({},0);assert.ok(cases>1000);
});
