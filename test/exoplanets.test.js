import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {EXOPLANET_HOSTS,exoplanetQuery,validateExoplanetRows,hasDrawableOrbit,schematicOrbitRadius,measurement} from '../src/exoplanets.js';
import {createApp} from '../server/app.js';
const snapshot=JSON.parse(await readFile(new URL('../public/data/exoplanet-snapshot.json',import.meta.url)));
const stars=JSON.parse(await readFile(new URL('../public/data/hyg-nearby-20pc.json',import.meta.url)));
test('curated host mappings correspond to HYG HIP and sky positions',()=>{
 assert.equal(snapshot.retrievedDate,'2026-11-13');assert.equal(snapshot.rows.length,16);
 for(const h of EXOPLANET_HOSTS){const star=stars.find(s=>s.id===h.hygId),rows=snapshot.rows.filter(r=>r.hostname===h.host);assert.equal(star.hip,h.hip);assert.ok(rows.length);validateExoplanetRows(rows,h.id);for(const r of rows){assert.ok(Math.abs(star.ra*15-r.ra)<.1);assert.ok(Math.abs(star.dec-r.dec)<.1)}}
 assert.equal(snapshot.rows.filter(r=>r.hostname==='55 Cnc').length,5);
 assert.equal(snapshot.rows.find(r=>r.pl_name==='Proxima Cen b').pl_bmassprov,'Msini');
 const proxima=snapshot.rows.find(r=>r.pl_name==='Proxima Cen b');assert.equal(proxima.pl_refname,'Suárez Mascareño et al. 2025');assert.equal(proxima.pl_controv_flag,0);assert.equal(proxima.soltype,'Published Confirmed');
 assert.throws(()=>validateExoplanetRows([{...proxima,pl_controv_flag:2}],'proxima'));assert.throws(()=>validateExoplanetRows([{...proxima,pl_orbperlim:9}],'proxima'));
});
test('orbit diagram excludes limits, unknown sizes and formats missing values',()=>{
 assert.equal(hasDrawableOrbit({pl_orbsmax:1,pl_orbsmaxlim:0}),true);assert.equal(hasDrawableOrbit({pl_orbsmax:1,pl_orbsmaxlim:1}),false);assert.equal(hasDrawableOrbit({pl_orbsmax:null,pl_orbsmaxlim:0}),false);
 assert.ok(schematicOrbitRadius(1,.1,2)<schematicOrbitRadius(2,.1,2));assert.equal(schematicOrbitRadius(0,.1,2),null);
 assert.equal(measurement({pl_rade:null},'pl_rade'),'Unavailable');assert.match(measurement({pl_bmasse:1,pl_bmasselim:1},'pl_bmasse'),/^≤/);assert.match(measurement({pl_orbper:2,pl_orbperlim:0,pl_orbpererr1:.2,pl_orbpererr2:-.1},'pl_orbper'),/\+0.2 \/ −0.1/);
 assert.throws(()=>exoplanetQuery('toString'));assert.throws(()=>validateExoplanetRows([{hostname:'different',pl_name:'x'}],'proxima'));
});
test('archive endpoint restricts hosts, handles failures, caches and validates results',async()=>{
 let calls=0;const urls=[];const data=snapshot.rows.filter(r=>r.hostname==='55 Cnc');
 const server=createApp({fetchImpl:async url=>{calls++;urls.push(new URL(url));return {ok:true,json:async()=>data}},now:()=>new Date('2026-11-13T00:00:00Z')}).listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 try{for(const host of ['toString',"55 Cnc' or 1=1",'missing'])assert.equal((await fetch(base+'/api/exoplanets?host='+encodeURIComponent(host))).status,400);let response=await fetch(base+'/api/exoplanets?host=55-cnc');assert.equal(response.status,200);let result=await response.json();assert.equal(result.data.length,5);assert.equal(result.retrievedAt,'2026-11-13T00:00:00.000Z');await fetch(base+'/api/exoplanets?host=55-cnc');assert.equal(calls,1);assert.equal(urls[0].hostname,'exoplanetarchive.ipac.caltech.edu');assert.equal(urls[0].searchParams.get('query'),exoplanetQuery('55-cnc'));assert.equal((await fetch(base+'/api/exoplanets?host=proxima')).status,502)}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
 const broken=createApp({fetchImpl:async()=>{throw Error('network')}}).listen(0,'127.0.0.1');await new Promise(resolve=>broken.once('listening',resolve));try{assert.equal((await fetch(`http://127.0.0.1:${broken.address().port}/api/exoplanets?host=proxima`)).status,502)}finally{broken.closeAllConnections();await new Promise(resolve=>broken.close(resolve))}
});
