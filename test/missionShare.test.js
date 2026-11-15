import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_DESIGN} from '../src/missionModel.js';
import {encodeDesign,decodeDesign,makeMissionUrl,inspectMissionUrl} from '../src/missionShare.js';
test('mission links round trip designs, not additional object data or flight outcomes',()=>{
 const design={...DEFAULT_DESIGN,objective:'ocean',instrument:'multispectral',radio:'low',extra:'private'};
 const encoded=encodeDesign(design);assert.ok(!encoded.includes('private'));
 assert.deepEqual(decodeDesign(encoded),Object.fromEntries(Object.keys(DEFAULT_DESIGN).map(k=>[k,design[k]])));
 const url=makeMissionUrl('https://example.org/app?lang=en#section',design);
 assert.equal(new URL(url).searchParams.get('lang'),null);assert.equal(new URL(url).hash,'');
 assert.deepEqual(inspectMissionUrl(url),{status:'valid',design:decodeDesign(encoded)});
});
test('malformed, oversized, unknown version and duplicate mission links are rejected',()=>{
 for(const input of ['', '{}','x'.repeat(501),JSON.stringify({v:2,d:[]}),JSON.stringify({v:1,d:['__proto__',...Array(8).fill('x')]})])assert.throws(()=>decodeDesign(input));
 assert.equal(inspectMissionUrl('https://example.org/?mission=x').status,'invalid');
 assert.equal(inspectMissionUrl('https://example.org/?mission=x&mission=y').status,'invalid');
 assert.equal(inspectMissionUrl('https://example.org/').status,'none');
});
