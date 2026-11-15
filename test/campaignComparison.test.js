import test from 'node:test';
import assert from 'node:assert/strict';
import {compareCampaigns} from '../src/campaignComparison.js';
import {DEFAULT_DESIGN,simulate} from '../src/missionModel.js';
test('comparison isolates scenario and uses the same design and decisions',()=>{
 const decisions={solar:'conserve',contacts:'push',strategy:'conserve'};
 const rows=compareCampaigns(DEFAULT_DESIGN,decisions);
 assert.equal(rows.length,3);assert.equal(new Set(rows.map(x=>x.id)).size,3);
 for(const row of rows)assert.deepEqual(row.result,simulate({...DEFAULT_DESIGN,scenario:row.id},decisions));
 assert.ok(rows[1].result.produced<rows[0].result.produced);
});
