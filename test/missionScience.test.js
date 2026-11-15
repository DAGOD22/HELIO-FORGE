import test from 'node:test';
import assert from 'node:assert/strict';
import {SCIENCE_CONTEXT} from '../src/missionScience.js';
import {OBJECTIVES} from '../src/missionModel.js';
test('each objective has a NASA science connection with an HTTPS source',()=>{
 assert.deepEqual(Object.keys(SCIENCE_CONTEXT).sort(),Object.keys(OBJECTIVES).sort());
 for(const item of Object.values(SCIENCE_CONTEXT)){assert.ok(item.title&&item.body&&item.source);assert.equal(new URL(item.url).protocol,'https:');assert.match(new URL(item.url).hostname,/(^|\.)nasa\.gov$/)}
});
