import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import handler from '../api/[...path].js';

test('serverless API handler exposes validation and JSON errors without serving the SPA',async()=>{
 const server=http.createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  let res=await fetch(base+'/api/exoplanets?host=not-a-host');assert.equal(res.status,400);assert.match((await res.json()).error,/supported/);
  res=await fetch(base+'/api/not-a-dataset');assert.equal(res.status,404);assert.match(res.headers.get('content-type'),/json/);
  res=await fetch(base+'/api/unknown/route');assert.equal(res.status,404);assert.match(res.headers.get('content-type'),/json/);
 }finally{await new Promise(resolve=>server.close(resolve))}
});
