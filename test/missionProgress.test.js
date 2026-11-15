import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_DESIGN,simulate} from '../src/missionModel.js';
import {createCheckpoint,restoreCheckpoint,readCheckpoint,MODEL_REVISION} from '../src/missionProgress.js';
const decisions={solar:'conserve',contacts:'push',strategy:'conserve'};
test('completed flight restores a freshly recomputed report for exactly the same design',()=>{
 const data=createCheckpoint(DEFAULT_DESIGN,3,decisions,true),restored=restoreCheckpoint(data,DEFAULT_DESIGN);
 assert.deepEqual(restored.result,simulate(DEFAULT_DESIGN,decisions));
 assert.equal(restoreCheckpoint(data,{...DEFAULT_DESIGN,scenario:'clouds'}),null);
 assert.equal(restoreCheckpoint({...data,model:'old'},DEFAULT_DESIGN),null);
});
test('invalid or partial checkpoints never resume inconsistent flight progress',()=>{
 const pending={solar:'push',contacts:null,strategy:null},valid=createCheckpoint(DEFAULT_DESIGN,1,pending);
 assert.equal(restoreCheckpoint(valid,DEFAULT_DESIGN).phase,1);
 for(const corrupted of [{...valid,phase:3}, {...valid,completed:true}, {...valid,phase:0},{...valid,decisions:{...pending,strategy:'push'}}, {...valid,model:MODEL_REVISION+'!'}])assert.equal(restoreCheckpoint(corrupted,DEFAULT_DESIGN),null);
 assert.throws(()=>createCheckpoint(DEFAULT_DESIGN,2,pending,true));
 assert.equal(readCheckpoint({getItem(){throw Error('denied')}},DEFAULT_DESIGN),null);
});
