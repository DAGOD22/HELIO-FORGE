import express from 'express';
import path from 'node:path';

export const HORIZONS_BODIES={mercury:['1','10'],venus:['2','10'],earth:['3','10'],mars:['4','10'],jupiter:['5','10'],saturn:['6','10'],uranus:['7','10'],neptune:['8','10'],pluto:['9','10'],moon:['301','399'],io:['501','599'],europa:['502','599'],ganymede:['503','599'],callisto:['504','599'],phobos:['401','499'],deimos:['402','499'],enceladus:['602','699'],rhea:['605','699'],titan:['606','699'],iapetus:['608','699'],triton:['801','899'],charon:['901','999'],ceres:['1;','10'],haumea:['136108;','10'],makemake:['136472;','10'],eris:['136199;','10'],eros:['433;','10'],halley:['90000030;','10']};
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

// Parse Horizons CSV VEC_TABLE=2; reject partial or unordered tracks.
export function parseHorizonsTrack(result) {
 const section=typeof result==='string'&&result.match(/\$\$SOE\s*([\s\S]*?)\s*\$\$EOE/);
 if(!section)throw new Error('Horizons did not return a track.');
 const samples=section[1].trim().split('\n').map(line=>{
  const fields=line.split(',');if(fields.length<8||[fields[0],...fields.slice(2,8)].some(v=>!v.trim()))throw new Error('Incomplete track.');
  const [jd,...values]=[fields[0],...fields.slice(2,8)].map(Number);
  if(![jd,...values].every(Number.isFinite))throw new Error('Invalid track.');
  return {jd,positionAU:values.slice(0,3),velocityAUPerDay:values.slice(3)};
 });
 if(samples.length!==25||samples.some((v,i)=>i>0&&v.jd<=samples[i-1].jd))throw new Error('Unexpected track length or order.');
 return samples;
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
  return load(res,`horizons:${id}:${date}`,url,{source:'NASA/JPL Horizons',parse:data=>({positionAU:parseHorizonsVector(data.result),date:instant.toISOString(),frame:center==='10'?(id.endsWith(';')?'Sun-centered small-body, J2000 ecliptic; geometric, UT':'Sun-centered planetary-system barycenter, J2000 ecliptic; geometric, UT'):`${({'399':'Earth','499':'Mars','599':'Jupiter','699':'Saturn','899':'Neptune','999':'Pluto'})[center]}-centered satellite, J2000 ecliptic; geometric, UT`,signature:data.signature})});
 });
 app.get('/api/satellite-track',(req,res)=>{
  const allowed=['phobos','deimos','titan','enceladus','rhea','iapetus','triton','charon'];
  const key=req.query.body,date=req.query.date;
  if(typeof key!=='string'||!allowed.includes(key)||typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return res.status(400).json({error:'Choose a supported moon and date.'});
  const start=new Date(date+'T00:00:00Z');
  if(!Number.isFinite(start.getTime())||start.toISOString().slice(0,10)!==date||start.getTime()<MIN||start.getTime()>MAX)return res.status(400).json({error:'Choose a valid date from 1800 through 2050.'});
  const stop=new Date(start.getTime()+86400000).toISOString().slice(0,10),[id,center]=HORIZONS_BODIES[key];
  const url=new URL('https://ssd.jpl.nasa.gov/api/horizons.api');
  const params={format:'json',COMMAND:id,MAKE_EPHEM:'YES',OBJ_DATA:'NO',EPHEM_TYPE:'VECTORS',CENTER:'500@'+center,START_TIME:date+' 00:00',STOP_TIME:stop+' 00:00',STEP_SIZE:'1 h',TIME_TYPE:'UT',REF_PLANE:'ECLIPTIC',OUT_UNITS:'AU-D',VEC_TABLE:'2',CSV_FORMAT:'YES'};
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,k==='format'?v:`'${v}'`);
  return load(res,`satellite-track:${id}:${date}`,url,{source:'NASA/JPL Horizons',parse:data=>{const samples=parseHorizonsTrack(data.result),startJD=start.getTime()/86400000+2440587.5;if(samples.some((sample,i)=>Math.abs(sample.jd-(startJD+i/24))>1e-7))throw new Error('Unexpected sample times.');return {samples,frame:'Parent-centered J2000 ecliptic; geometric, UT',signature:data.signature}}});
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
