import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,simulate,DEFAULT_DESIGN,OBJECTIVES,OPTIONS} from '../src/missionModel.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('mission budgets sum components and use NASA Earth constants for a circular period',()=>{
 const c=calculate(DEFAULT_DESIGN);
 assert.equal(c.mass,19);assert.equal(c.cost,24);assert.equal(c.canLaunch,true);
 assert.ok(c.periodHours*60>94&&c.periodHours*60<95);
 near(c.eclipseWh,c.load*c.periodHours*(1-c.parts.orbit.sun));
 assert.throws(()=>calculate({...DEFAULT_DESIGN,radio:'invented'}));
});
test('launch restrictions identify both cost and mass',()=>{
 const heavy={...DEFAULT_DESIGN,bus:'extended',launch:'rideshare',ground:'network',duration:'24'};
 const c=calculate(heavy);assert.ok(c.mass>c.parts.launch.capacity);assert.ok(c.cost>c.objective.budget);
 assert.equal(simulate(heavy).launched,false);
});
test('simulation is deterministic, conserves data and explains recurring events',()=>{
 const a=simulate(DEFAULT_DESIGN),b=simulate(DEFAULT_DESIGN);assert.deepEqual(a,b);
 assert.equal(a.timeline.length,12);near(a.produced,a.returned+a.lost+a.stored);
 assert.match(a.timeline[3].event,/20%/);assert.match(a.timeline[6].event,/halved/);
 const powerLimited=simulate({...DEFAULT_DESIGN,solar:'body'});assert.ok(powerLimited.timeline[3].power<powerLimited.timeline[0].power);assert.ok(a.score>=0&&a.score<=100);
});
test('mismatched instrument cannot score and operations stop beyond bus life',()=>{
 const wrong=simulate({...DEFAULT_DESIGN,instrument:'spectrometer'});assert.equal(wrong.score,0);assert.ok(wrong.advice.some(a=>a.includes('instrument')));
 const long=simulate({...DEFAULT_DESIGN,duration:'24'});assert.equal(long.launched,true);assert.equal(long.timeline[12].returned,0);assert.ok(long.advice.some(a=>a.includes('design life')));
});
test('all valid configurations are finite, bounded, and conserve data',()=>{
 const keys=Object.keys(OPTIONS);let launched=0;
 function visit(d,index){if(index===keys.length){for(const objective of Object.keys(OBJECTIVES)){const r=simulate({...d,objective});if(r.launched){launched++;assert.ok(Number.isFinite(r.score)&&r.score>=0&&r.score<=100);near(r.produced,r.returned+r.lost+r.stored);assert.ok(r.stored<=r.parts.bus.storage+1e-8);}}return}const k=keys[index];for(const value of Object.keys(OPTIONS[k]))visit({...d,[k]:value},index+1)}
 visit({},0);assert.ok(launched>100);
});
test('in-flight decisions change the modeled trade-offs without rewriting prior months',()=>{
 const power={...DEFAULT_DESIGN,solar:'body'};
 const push=simulate(power,{solar:'push',contacts:'push'}),protect=simulate(power,{solar:'conserve',contacts:'push'});
 assert.deepEqual(push.timeline.slice(0,3),protect.timeline.slice(0,3));
 assert.ok(protect.timeline[3].power>push.timeline[3].power);
 const full=simulate(DEFAULT_DESIGN,{solar:'push',contacts:'push'}),reduced=simulate(DEFAULT_DESIGN,{solar:'push',contacts:'conserve'});
 assert.deepEqual(full.timeline.slice(0,6),reduced.timeline.slice(0,6));
 assert.ok(reduced.lost<full.lost);assert.ok(reduced.returned<full.returned);
 for(const r of [push,protect,full,reduced])near(r.produced,r.returned+r.lost+r.stored);
});
test('rejects malformed and prototype-derived stored choices',()=>{
 for(const d of [null,{}, {...DEFAULT_DESIGN,objective:'__proto__'}, {...DEFAULT_DESIGN,bus:'constructor'}])assert.throws(()=>calculate(d));
});
test('player-imposed duty limits are not mislabeled as power shortfalls',()=>{
 const result=simulate(DEFAULT_DESIGN,{solar:'conserve',contacts:'conserve'});
 assert.ok(result.advice.some(a=>a.includes('operating choices')));
 assert.ok(!result.advice.some(a=>a.includes('power-limited')));
});
