import React,{useMemo} from 'react';
import {hasDrawableOrbit,schematicOrbitRadius} from './exoplanets';
import {exoplanetPhase} from './map2d';
import {PlanetArtwork,StarArtwork} from './ObjectArtwork';
import {MapStatus,useMapZoom} from './Map2DControls';
import './map2d.css';

export default function ExoplanetMap2D({hostStar,rows,days,selected,onSelect,view,navigationRef,retry}){
 const [zoom,touch,containerRef,pan]=useMapZoom(navigationRef,view?.request);
 const drawable=useMemo(()=>rows.filter(hasDrawableOrbit),[rows]);
 const values=drawable.map(row=>row.pl_orbsmax),min=Math.min(...values),max=Math.max(...values),tilt=view?.mode==='top'?1:.58;
 return <div className="exo-scene map2d exo-map" ref={containerRef} {...touch} aria-label="2D schematic planetary system; no WebGL required">
  <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Symbolic planetary system; orbit spacing compressed, phases arbitrary, not an ephemeris.">
   <defs><radialGradient id="exo-bg"><stop stopColor="#1d3542"/><stop offset="1" stopColor="#06101a"/></radialGradient><radialGradient id="exo-star"><stop stopColor="#fff6d1"/><stop offset=".2" stopColor="#ffc478" stopOpacity=".9"/><stop offset="1" stopColor="#ff9c55" stopOpacity="0"/></radialGradient></defs>
   <rect width="1000" height="600" fill="url(#exo-bg)"/><g transform={`translate(${pan.x} ${pan.y})`}>
   <svg x="458" y="268" width="84" height="84" viewBox="0 0 100 100" style={{pointerEvents:'none'}}><StarArtwork star={hostStar}/></svg>
   {drawable.map((row,i)=>{const radius=schematicOrbitRadius(row.pl_orbsmax,min,max)*14*zoom,phase=exoplanetPhase(row,i,drawable.length,days),x=500+radius*Math.cos(phase),y=310+radius*tilt*Math.sin(phase),active=row.pl_name===selected;return <g key={row.pl_name}><ellipse cx="500" cy="310" rx={radius} ry={radius*tilt} fill="none" stroke={active?'#a4ebed':'#7397a8'} strokeWidth={active?'2':'1'} opacity={active?.8:.4}/><g className="map-hit" onClick={()=>onSelect(row.pl_name)}><circle cx={x} cy={y} r="18" fill="transparent"/><svg x={x-(active?26:19)} y={y-(active?26:19)} width={active?52:38} height={active?52:38} viewBox="0 0 100 100" style={{pointerEvents:'none'}}><PlanetArtwork name={row.pl_name}/></svg>{active&&<text x={x+25} y={y-23} className="map-label">{row.pl_name}</text>}</g></g>})}
  </g></svg><MapStatus retry={retry}/>
 </div>;
}
