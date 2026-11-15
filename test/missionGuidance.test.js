import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_DESIGN,OBJECTIVES,OPTIONS,simulate} from '../src/missionModel.js';
import {preflightChecks} from '../src/missionChecks.js';
import {recommendedScienceDesign,initialMonthEstimate,REVIEW_TARGETS} from '../src/missionGuidance.js';

test('recommendations match the objective but preserve every unrelated selection',()=>{
 for(const objective of Object.keys(OBJECTIVES)){
  const original={...DEFAULT_DESIGN,objective,bus:'extended',ground:'network',solar:'body',duration:'24'};
  const before={...original},result=recommendedScienceDesign(original);
  assert.deepEqual(original,before);assert.equal(result.instrument,OBJECTIVES[objective].instrument);assert.equal(result.orbit,OBJECTIVES[objective].orbit);
  for(const key of ['objective','bus','solar','radio','ground','launch','duration'])assert.equal(result[key],original[key]);
 }
 assert.throws(()=>recommendedScienceDesign({...DEFAULT_DESIGN,orbit:'invalid'}));
});
test('first-month preview comes from the existing model and is unavailable on launch hold',()=>{
 const a=simulate(DEFAULT_DESIGN,{solar:'push',contacts:'push'}),b=simulate(DEFAULT_DESIGN,{solar:'conserve',contacts:'conserve'});
 assert.deepEqual(initialMonthEstimate(a),a.timeline[0]);assert.deepEqual(initialMonthEstimate(a),initialMonthEstimate(b));
 assert.equal(initialMonthEstimate(simulate({...DEFAULT_DESIGN,bus:'extended',ground:'network',duration:'24'})),null);
});
test('each preflight warning links only to real editable subsystem fields',()=>{
 const checks=preflightChecks(DEFAULT_DESIGN);
 for(const {id} of checks){assert.ok(REVIEW_TARGETS[id]?.length);for(const [field,label] of REVIEW_TARGETS[id]){assert.ok(OPTIONS[field],field);assert.ok(label)}}
});
