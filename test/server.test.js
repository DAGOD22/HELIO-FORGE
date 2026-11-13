import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp,parseHorizonsVector} from '../server/app.js';

const result=`header\n$$SOE\n2451545.000000000, A.D. 2000-Jan-01 12:00:00.0000, -1.771587841839055E-01, 9.672193524609504E-01, -1.139275508446145E-06,\n$$EOE\n`;
test('Horizons parser accepts vectors and rejects invalid tables',()=>{assert.deepEqual(parseHorizonsVector(result),[-.1771587841839055,.9672193524609504,-.000001139275508446145]);assert.throws(()=>parseHorizonsVector('unavailable'));});
test('API endpoints validate input, cache responses, and handle missing key and upstream failures',async()=>{
 let calls=0; const requested=[];
 const fetchImpl=async url=>{calls++;requested.push(String(url));return {ok:true,json:async()=>String(url).includes('horizons')?{signature:{version:'1.2'},result}:{object:{fullname:'433 Eros'},orbit:{elements:[]}}}};
 const server=createApp({fetchImpl,apiKey:()=>'',now:()=>new Date('2026-11-13T00:00:00Z')}).listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 try {
  assert.equal((await fetch(base+'/api/apod')).status,503);
  assert.equal((await fetch(base+'/api/does-not-exist')).status,404);
  assert.equal((await fetch(base+'/api/horizons?body=earth&date=2200-01-01')).status,400);
  assert.equal((await fetch(base+'/api/horizons?body=earth&date=2025-02-31')).status,400);
  assert.equal((await fetch(base+'/api/sbdb?q=%3Cscript%3E')).status,400);
  const url=base+'/api/horizons?body=earth&date=2000-01-01';const first=await (await fetch(url)).json();assert.deepEqual(first.data.positionAU,[-.1771587841839055,.9672193524609504,-.000001139275508446145]);await fetch(url);assert.equal(calls,1);
  assert.match(requested[0],/ssd\.jpl\.nasa\.gov/);assert.match(requested[0],/COMMAND=%273%27/);
  assert.equal((await (await fetch(base+'/api/sbdb?q=Eros')).json()).data.object.fullname,'433 Eros');assert.equal(calls,2);
 } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 const broken=createApp({fetchImpl:async()=>{throw Error('network')},apiKey:()=> 'test-key'}).listen(0,'127.0.0.1');await new Promise(resolve=>broken.once('listening',resolve));try{const r=await fetch(`http://127.0.0.1:${broken.address().port}/api/apod`);assert.equal(r.status,502);assert.doesNotMatch(JSON.stringify(await r.json()),/test-key/)}finally{broken.closeAllConnections();await new Promise(resolve=>broken.close(resolve))}
});
