import express from 'express';
import path from 'node:path';

export const HORIZONS_BODIES={mercury:['1','10'],venus:['2','10'],earth:['3','10'],mars:['4','10'],jupiter:['5','10'],saturn:['6','10'],uranus:['7','10'],neptune:['8','10'],pluto:['9','10'],moon:['301','399'],io:['501','599'],europa:['502','599'],ganymede:['503','599'],callisto:['504','599']};
const MIN=Date.UTC(1800,0,1),MAX=Date.UTC(2051,0,1)-1;

export function parseHorizonsVector(result) {
 const section=typeof result==='string'&&result.match(/\$\$SOE\s*([\s\S]*?)\s*\$\$EOE/);
 if(!section)throw new Error('Horizons did not return a vector for this request.');
 const fields=section[1].trim().split('\n')[0].split(',');
 if(fields.length<5||fields.slice(2,5).some(v=>!v.trim()))throw new Error('Horizons returned an incomplete vector.');
 const position=fields.slice(2,5).map(Number);
 if(position.length!==3||position.some(n=>!Number.isFinite(n)))throw new Error('Horizons returned an unrecognized vector.');
 return position;
}

export function createApp({fetchImpl=fetch, apiKey=()=>process.env.NASA_API_KEY, now=()=>new Date()}={}) {
 const app=express(),cache=new Map();
 async function load(res,cacheKey,url,{source,parse=(data)=>data}={}) {
  const time=now().getTime(),hit=cache.get(cacheKey);
  if(hit&&time-hit.time<3600000)return res.json(hit.body);
  try {
   const response=await fetchImpl(url,{signal:AbortSignal.timeout(12000)});
   if(!response.ok)return res.status(response.status===429?429:502).json({error:response.status===429?`${source} rate limit reached. Please try again later.`:`${source} returned HTTP ${response.status}.`});
   const payload=await response.json();
   if(payload.error) return res.status(502).json({error:`${source}: ${typeof payload.error==='string'?payload.error:'request failed.'}`});
   const body={data:parse(payload),source,retrievedAt:now().toISOString()};
   // Keep memory bounded even if a visitor tries many dates or names.
   if(cache.size>=200)cache.delete(cache.keys().next().value);
   cache.set(cacheKey,{time,body});return res.json(body);
  } catch {return res.status(502).json({error:`${source} is unavailable or returned an unexpected response. Please try again later.`});}
 }
 app.get('/api/horizons',(req,res)=>{
  const body=HORIZONS_BODIES[req.query.body],date=req.query.date;
  if(!body||typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return res.status(400).json({error:'Choose a supported planet and a YYYY-MM-DD date.'});
  const instant=new Date(date+'T12:00:00Z');
  if(!Number.isFinite(instant.getTime())||instant.toISOString().slice(0,10)!==date||instant.getTime()<MIN||instant.getTime()>MAX)return res.status(400).json({error:'Choose a valid date from 1800 through 2050.'});
  const jd=instant.getTime()/86400000+2440587.5;
  const url=new URL('https://ssd.jpl.nasa.gov/api/horizons.api');
  const [id,center]=body;const params={format:'json',COMMAND:id,MAKE_EPHEM:'YES',OBJ_DATA:'NO',EPHEM_TYPE:'VECTORS',CENTER:'500@'+center,TLIST:String(jd),TLIST_TYPE:'JD',TIME_TYPE:'UT',REF_PLANE:'ECLIPTIC',OUT_UNITS:'AU-D',VEC_TABLE:'1',CSV_FORMAT:'YES'};
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,k==='format'?v:`'${v}'`);
  return load(res,`horizons:${id}:${date}`,url,{source:'NASA/JPL Horizons',parse:data=>({positionAU:parseHorizonsVector(data.result),date:instant.toISOString(),frame:center==='10'?'Sun-centered planetary-system barycenter, J2000 ecliptic; geometric, UT':`${center==='399'?'Earth':'Jupiter'}-centered satellite, J2000 ecliptic; geometric, UT`,signature:data.signature})});
 });
 app.get('/api/sbdb',(req,res)=>{
  const q=typeof req.query.q==='string'?req.query.q.trim():'';
  if(q.length<1||q.length>80||!/^[a-zA-Z0-9 /()+.\-]+$/.test(q))return res.status(400).json({error:'Enter a valid small-body name or designation (up to 80 characters).'});
  const url=new URL('https://ssd-api.jpl.nasa.gov/sbdb.api');url.searchParams.set('sstr',q);url.searchParams.set('phys-par','1');url.searchParams.set('discovery','1');url.searchParams.set('full-prec','1');
  return load(res,`sbdb:${q.toLowerCase()}`,url,{source:'NASA/JPL Small-Body Database'});
 });
 app.get('/api/:dataset',(req,res)=>{
  const nowDate=now().toISOString().slice(0,10);
  const endpoints={apod:'planetary/apod',neo:`neo/rest/v1/feed?start_date=${nowDate}&end_date=${nowDate}`,donki:`DONKI/FLR?startDate=${nowDate}&endDate=${nowDate}`};
  const endpoint=endpoints[req.params.dataset];if(!endpoint)return res.status(404).json({error:'Unknown dataset'});
  const key=apiKey();if(!key)return res.status(503).json({error:'NASA_API_KEY is not configured on the server.'});
  const url=new URL('https://api.nasa.gov/'+endpoint);url.searchParams.set('api_key',key);
  return load(res,`nasa:${req.params.dataset}:${nowDate}`,url,{source:'NASA Open APIs'});
 });
 app.use(express.static('dist'));app.get('*',(_req,res)=>res.sendFile(path.resolve('dist/index.html')));
 return app;
}
