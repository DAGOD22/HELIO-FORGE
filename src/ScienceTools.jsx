import React, {useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {heliocentricPosition,parseSmallBodyOrbit,smallBodyHeliocentricPosition} from './orbits';
import {MINOR_BODIES} from './minorBodies';
import {SATELLITES,satelliteEclipticPosition,plutoEclipticPosition} from './satellites';

export function HorizonsCheck({object,date}) {
 const [state,setState]=useState({});
 if(!object?.a&&!SATELLITES[object?.id]&&!MINOR_BODIES[object?.id]&&object?.id!=='pluto')return null;
 const check=async()=>{
  const day=date.toISOString().slice(0,10);setState({loading:true});
  try {
   const response=await fetch(`/api/horizons?body=${encodeURIComponent(object.id)}&date=${day}`);const json=await response.json();if(!response.ok)throw new Error(json.error);
   const reference=json.data.positionAU,approx=MINOR_BODIES[object.id]?smallBodyHeliocentricPosition(MINOR_BODIES[object.id],new Date(day+'T12:00:00Z')):SATELLITES[object.id]?satelliteEclipticPosition(object.id,new Date(day+'T12:00:00Z')):object.id==='pluto'?plutoEclipticPosition(new Date(day+'T12:00:00Z')):heliocentricPosition(object,new Date(day+'T12:00:00Z'));
   const difference=Math.hypot(...approx.map((value,i)=>value-reference[i]));
   setState({day,difference,reference,approx,retrievedAt:json.retrievedAt});
  }catch(error){setState({error:error.message})}
 };
 return <div className="horizons-check"><div className="section-title"><span>EPHEMERIS CHECK</span><span className="verified">JPL HORIZONS</span></div><p>Compare the uncompressed model with a geometric Horizons vector at 12:00 UT on the selected date.</p><button className="primary" onClick={check} disabled={state.loading}>{state.loading?'CHECKING...':'COMPARE WITH HORIZONS'} <ArrowUpRight size={13}/></button>{state.error&&<p className="error">{state.error}</p>}{state.reference&&<div className="horizons-result"><b>{(state.difference*149597870.7).toLocaleString(undefined,{maximumFractionDigits:0})} km vector difference</b><p>{state.day} 12:00 UT · {SATELLITES[object.id]?(SATELLITES[object.id].parent==='earth'?'Earth-centered':'Jupiter-centered'):MINOR_BODIES[object.id]?'Sun-centered small-body':'Sun-centered planetary-system barycenter'}, J2000 ecliptic; geometric. Models have different accuracy and timing approximations.</p><p>Model AU: {state.approx.map(v=>v.toFixed(6)).join(', ')}<br/>Horizons AU: {state.reference.map(v=>v.toFixed(6)).join(', ')}</p><small>Retrieved {new Date(state.retrievedAt).toUTCString()}</small></div>}</div>
}

export function SmallBodyLookup({onExplore}) {
 const [query,setQuery]=useState('Eros'),[state,setState]=useState({});
 async function search(e){e.preventDefault();setState({loading:true});try{const response=await fetch('/api/sbdb?q='+encodeURIComponent(query));const result=await response.json();if(!response.ok)throw Error(result.error);setState(result)}catch(error){setState({error:error.message})}}
 const data=state.data, orbit=parseSmallBodyOrbit(data);
 return <article className="smallbody-panel"><span className="eyebrow">NASA / JPL SMALL-BODY DATABASE</span><h3>Search the real catalogue</h3><p>Look up an asteroid, comet or dwarf planet by name or designation. Results are fetched from JPL, not generated entries.</p><form onSubmit={search} className="sbdb-search"><input aria-label="Small-body name" value={query} maxLength={80} onChange={e=>setQuery(e.target.value)} placeholder="Eros, Bennu, 1P..."/><button className="primary" disabled={state.loading}>{state.loading?'SEARCHING...':'SEARCH JPL'} <ArrowUpRight size={13}/></button></form>{state.error&&<p className="error">{state.error}</p>}{data&&!data.object&&<p className="muted">{data.message||'No unique object returned. Try a more specific designation.'}</p>}{data?.object&&<div className="sbdb-result"><h3>{data.object.fullname||data.object.shortname}</h3><p>{data.object.orbit_class?.name||'Small body'} · JPL solution {data.orbit?.orbit_id||'unavailable'} · {data.object.neo?'near-Earth object':'not classified as a near-Earth object'}</p><div className="sbdb-stats">{(data.orbit?.elements||[]).filter(x=>['a','e','i','per'].includes(x.name)).map(x=><div key={x.name}><small>{x.title}</small><b>{x.value} {x.units||''}</b></div>)}{(data.phys_par||[]).filter(x=>['diameter','rot_per'].includes(x.name)).map(x=><div key={x.name}><small>{x.title}</small><b>{x.value} {x.units||''}</b></div>)}</div><p>Osculating element epoch: JD {data.orbit?.epoch||'unavailable'} TDB. Retrieved {new Date(state.retrievedAt).toUTCString()}.</p>{orbit?<button className="primary" onClick={()=>onExplore(data)}>EXPLORE APPROXIMATE ORBIT <ArrowUpRight size={13}/></button>:<p>Orbital visualization unavailable: a complete bound elliptical solution is required.</p>}<p>When visualized, orbit is two-body propagation from this solution, not a live ephemeris. The shape is procedural and not a real image.</p><a href={'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr='+encodeURIComponent(data.object.des||query)} target="_blank" rel="noreferrer">View JPL source ↗</a></div>}</article>
}
