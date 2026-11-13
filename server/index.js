import 'dotenv/config';
import express from 'express';
import path from 'node:path';
const app=express(), port=Number(process.env.PORT)||3001, cache=new Map();
app.get('/api/:dataset',async(req,res)=>{
 const key=process.env.NASA_API_KEY;
 if(!key) return res.status(503).json({error:'NASA_API_KEY is not configured on the server.'});
 const now=new Date(), date=now.toISOString().slice(0,10);
 const endpoints={apod:'planetary/apod',neo:`neo/rest/v1/feed?start_date=${date}&end_date=${date}`,donki:`DONKI/FLR?startDate=${date}&endDate=${date}`};
 const endpoint=endpoints[req.params.dataset]; if(!endpoint)return res.status(404).json({error:'Unknown dataset'});
 const hit=cache.get(req.params.dataset); if(hit && Date.now()-hit.time<3600000)return res.json(hit.body);
 try {const url=new URL('https://api.nasa.gov/'+endpoint);url.searchParams.set('api_key',key);const response=await fetch(url,{signal:AbortSignal.timeout(12000)}); if(!response.ok)return res.status(response.status===429?429:502).json({error:response.status===429?'NASA rate limit reached. Please try again later.':`NASA service returned ${response.status}.`});const data=await response.json();const body={data,source:'NASA Open APIs',retrievedAt:new Date().toISOString()};cache.set(req.params.dataset,{time:Date.now(),body});res.json(body)}catch{res.status(502).json({error:'NASA service is unavailable. Please try again later.'})}
});
app.use(express.static('dist')); app.get('*',(_req,res)=>res.sendFile(path.resolve('dist/index.html')));
app.listen(port,'0.0.0.0',()=>console.log(`COSMOS server listening on ${port}`));
