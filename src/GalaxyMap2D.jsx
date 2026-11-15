import React,{useEffect,useMemo} from 'react';
import {schematicGalaxy,starPositionLy,positionFromEquatorialLy,SUN_GALACTIC_RADIUS_LY} from './galaxyModel';
import {gaiaPosition} from './gaiaCatalog';
import {StarArtwork} from './ObjectArtwork';
import {starPalette} from './objectArtwork';
import {DEEP_SKY} from './deepSky';
import {mapProjection} from './map2d';
import {MapStatus,useMapZoom} from './Map2DControls';
import './map2d.css';

// Orthographic x/z projection: the vertical coordinate is omitted. The
// schematic overview and the incomplete local catalogues remain separate.
export default function GalaxyMap2D({stars,selection,request,onSelect,showLandmarks,neighbors,showNeighbors,gaiaData,gaiaStar,onGaiaDrawn,onDensity,navigationRef,retry,onZoomInto,canZoomInto}){
 const [zoom,touch,containerRef,pan]=useMapZoom(navigationRef,request,gesture=>{if(gesture==='in'&&Math.hypot(pan.x,pan.y)<15&&canZoomInto(selection))onZoomInto(selection)});
 const synthetic=useMemo(()=>schematicGalaxy(2400),[]);
 const selected=stars.find(s=>String(s.id)===selection),landmark=DEEP_SKY.find(d=>'dso:'+d.id===selection);
 const global=selection==='galaxy'||selection==='center',sun=[SUN_GALACTIC_RADIUS_LY,0,0];
 const focus=gaiaStar?gaiaPosition(gaiaStar.xyz):selected?starPositionLy(selected):landmark?positionFromEquatorialLy(landmark.ra,landmark.dec,landmark.distanceLy):selection==='galaxy'||selection==='center'?[0,0,0]:sun;
 const extent=(selection==='galaxy'?56000:selection==='center'?18000:gaiaStar?1000:landmark?2500:selection==='sun'&&gaiaData?600:selected?45:150)/zoom;
 const project=p=>mapProjection(p,focus,extent);
 const galaxyPoints=useMemo(()=>Array.from({length:synthetic.positions.length/3},(_,i)=>{const j=i*3;return {p:[synthetic.positions[j],synthetic.positions[j+1],synthetic.positions[j+2]],color:`rgb(${Math.round(synthetic.colors[j]*255)},${Math.round(synthetic.colors[j+1]*255)},${Math.round(synthetic.colors[j+2]*255)})`}}),[synthetic]);
 const localStars=useMemo(()=>{const stride=Math.max(1,Math.ceil(stars.length/2200));return stars.filter((_,i)=>i%stride===0).map(star=>({star,p:starPositionLy(star)}))},[stars]);
 const gaiaPoints=useMemo(()=>{if(!gaiaData)return [];const length=gaiaData.positions.length/3,stride=Math.max(1,Math.ceil(length/4000)),points=[];for(let i=0;i<length;i+=stride){const j=i*3;points.push([gaiaData.positions[j],gaiaData.positions[j+1],gaiaData.positions[j+2]])}return points},[gaiaData]);
 useEffect(()=>{onDensity(2400);onGaiaDrawn(gaiaPoints.length)},[gaiaPoints.length,onDensity,onGaiaDrawn]);
 const inside=([x,y])=>x+pan.x>-10&&x+pan.x<1010&&y+pan.y>-10&&y+pan.y<610;
 return <div className="galaxy-canvas map2d galaxy-map" ref={containerRef} {...touch} aria-label="Interactive 2D galaxy and local-star map; no WebGL required">
  <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="2D projection. Galaxy arms are procedural; nearby catalogue stars are an incomplete sample. Vertical depth is omitted.">
   <defs><radialGradient id="galaxy-bg"><stop stopColor="#15293c"/><stop offset="1" stopColor="#030914"/></radialGradient><radialGradient id="galaxy-core"><stop stopColor="#ffe6b0" stopOpacity=".85"/><stop offset=".2" stopColor="#e5a972" stopOpacity=".35"/><stop offset="1" stopColor="#d09170" stopOpacity="0"/></radialGradient></defs>
   <rect width="1000" height="600" fill="url(#galaxy-bg)"/><g transform={`translate(${pan.x} ${pan.y})`}>
   {global&&<><circle cx={project([0,0,0])[0]} cy={project([0,0,0])[1]} r={Math.min(170,5000/extent*240)} fill="url(#galaxy-core)"/>{galaxyPoints.map(({p,color},i)=>{const [x,y]=project(p);return inside([x,y])?<circle key={i} cx={x} cy={y} r={i%11===0?1.9:.85} fill={color} opacity=".7"/>:null})}</>}
   {!global&&<>{gaiaPoints.map((p,i)=>{const [x,y]=project(p);return inside([x,y])?<circle key={'g'+i} cx={x} cy={y} r="1" fill="#b7c9e8" opacity=".45"/>:null})}{localStars.map(({star,p})=>{const [x,y]=project(p);return inside([x,y])?<g key={star.id} className="map-hit" onClick={()=>onSelect(String(star.id))}><circle cx={x} cy={y} r="9" fill="transparent"/><circle cx={x} cy={y} r={String(star.id)===selection?4:1.4} fill={starPalette(star).middle} opacity={String(star.id)===selection?1:.7}/></g>:null})}
    {showNeighbors&&selected&&neighbors.map(({star})=>{const a=project(starPositionLy(selected)),b=project(starPositionLy(star));return <line key={star.id} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#80c4d0" strokeWidth="1" opacity=".65"/>})}</>}
   {showLandmarks&&DEEP_SKY.map(d=>{const [x,y]=project(positionFromEquatorialLy(d.ra,d.dec,d.distanceLy));return inside([x,y])?<g key={d.id} className="map-hit" onClick={()=>onSelect('dso:'+d.id)}><circle cx={x} cy={y} r="5" fill="#adc7ff"/><circle cx={x} cy={y} r="10" fill="none" stroke="#adc7ff" opacity=".45"/>{selection==='dso:'+d.id&&<text x={x+12} y={y-8} className="map-label">{d.name}</text>}</g>:null})}
   {(()=>{const [x,y]=project(sun);return inside([x,y])?<g className="map-hit" onClick={()=>onSelect('sun')}><circle cx={x} cy={y} r="10" fill="#ffd99b" opacity=".2"/><circle cx={x} cy={y} r="4" fill="#fff1c8"/><text x={x+9} y={y-7} className="map-label">SUN</text></g>:null})()}
   {(selected||gaiaStar)&&<svg x="435" y="235" width="130" height="130" viewBox="0 0 100 100" style={{pointerEvents:'none',overflow:'visible'}}><StarArtwork star={selected||gaiaStar}/></svg>}{landmark&&<circle cx="500" cy="300" r="9" fill="none" stroke="#9af6e1" strokeWidth="1.5"/>}
  </g></svg><MapStatus retry={retry}/>
 </div>;
}
