import React,{useEffect,useMemo} from 'react';
import {schematicGalaxy,starPositionLy,positionFromEquatorialLy,SUN_GALACTIC_RADIUS_LY,symbolicStarBrightness} from './galaxyModel';
import {gaiaPosition} from './gaiaCatalog';
import {StarArtwork} from './ObjectArtwork';
import {starPalette} from './objectArtwork';
import {glyphAngle} from './stellarGlyph';
import LandmarkArtwork from './LandmarkArtwork';
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
 const glyphSize=Math.min(18,(selection==='sun'?7:11)*Math.sqrt(zoom));
 const galaxyPoints=useMemo(()=>Array.from({length:synthetic.positions.length/3},(_,i)=>{const j=i*3;return {p:[synthetic.positions[j],synthetic.positions[j+1],synthetic.positions[j+2]],color:`rgb(${Math.round(synthetic.colors[j]*255)},${Math.round(synthetic.colors[j+1]*255)},${Math.round(synthetic.colors[j+2]*255)})`}}),[synthetic]);
 const localStars=useMemo(()=>{return stars.map(star=>({star,p:starPositionLy(star)}))},[stars]);
 const gaiaPoints=useMemo(()=>{if(!gaiaData)return [];const length=gaiaData.positions.length/3,stride=Math.max(1,Math.ceil(length/4000)),points=[];for(let i=0;i<length;i+=stride){const j=i*3;points.push({p:[gaiaData.positions[j],gaiaData.positions[j+1],gaiaData.positions[j+2]],color:`rgb(${Math.round(gaiaData.colors[j]*255)},${Math.round(gaiaData.colors[j+1]*255)},${Math.round(gaiaData.colors[j+2]*255)})`,angle:(i*137)%360})}return points},[gaiaData]);
 useEffect(()=>{onDensity(2400);onGaiaDrawn(gaiaPoints.length)},[gaiaPoints.length,onDensity,onGaiaDrawn]);
 const inside=([x,y])=>x+pan.x>-10&&x+pan.x<1010&&y+pan.y>-10&&y+pan.y<610;
 return <div className="galaxy-canvas map2d galaxy-map" ref={containerRef} {...touch} aria-label="Interactive 2D galaxy and local-star map; no WebGL required">
  <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="2D projection. Galaxy arms and stellar surfaces are illustrative; thumbnail markers are not physical sizes. Nearby catalogues are incomplete and vertical depth is omitted.">
   <defs><radialGradient id="star-surface" cx="35%" cy="30%" r="70%"><stop stopColor="#fff" stopOpacity=".7"/><stop offset=".5" stopColor="#fff" stopOpacity=".05"/><stop offset="1" stopColor="#09111d" stopOpacity=".55"/></radialGradient><symbol id="local-star-glyph" viewBox="-12 -12 24 24"><circle r="10" fill="currentColor" opacity=".14"/><circle r="7" fill="currentColor"/><circle r="7" fill="url(#star-surface)"/><path d="M-5 -2 Q-2 -5 1 -3 M-4 2 Q0 0 4 2 M-1 4 Q2 3 4 4" stroke="#30202e" strokeOpacity=".28" strokeWidth="1" fill="none"/><circle cx="-2.4" cy="-3" r="1" fill="#fff" opacity=".55"/></symbol><radialGradient id="galaxy-bg"><stop stopColor="#15293c"/><stop offset="1" stopColor="#030914"/></radialGradient><radialGradient id="galaxy-core"><stop stopColor="#ffe6b0" stopOpacity=".85"/><stop offset=".2" stopColor="#e5a972" stopOpacity=".35"/><stop offset="1" stopColor="#d09170" stopOpacity="0"/></radialGradient></defs>
   <rect width="1000" height="600" fill="url(#galaxy-bg)"/><g transform={`translate(${pan.x} ${pan.y})`}>
   {global&&<><circle cx={project([0,0,0])[0]} cy={project([0,0,0])[1]} r={Math.min(170,5000/extent*240)} fill="url(#galaxy-core)"/>{galaxyPoints.map(({p,color},i)=>{const [x,y]=project(p);return inside([x,y])?<circle key={i} cx={x} cy={y} r={i%11===0?1.9:.85} fill={color} opacity=".7"/>:null})}</>}
   {!global&&<>{gaiaPoints.map(({p,color,angle},i)=>{const [x,y]=project(p);return inside([x,y])?<use key={'g'+i} href="#local-star-glyph" x={x-5} y={y-5} width="10" height="10" color={color} opacity=".65" transform={`rotate(${angle} ${x} ${y})`}/>:null})}{localStars.map(({star,p})=>{const [x,y]=project(p),size=glyphSize*(.78+.45*symbolicStarBrightness(star.mag));return inside([x,y])?<g key={star.id} className="map-hit" onClick={()=>onSelect(String(star.id))}><circle cx={x} cy={y} r="9" fill="transparent"/><use href="#local-star-glyph" x={x-size/2} y={y-size/2} width={size} height={size} color={starPalette(star).middle} opacity=".95" transform={`rotate(${glyphAngle(star.id)} ${x} ${y})`}/></g>:null})}
    {showNeighbors&&selected&&neighbors.map(({star})=>{const a=project(starPositionLy(selected)),b=project(starPositionLy(star));return <line key={star.id} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#80c4d0" strokeWidth="1" opacity=".65"/>})}</>}
   {showLandmarks&&[...DEEP_SKY].sort((a,b)=>(selection==='dso:'+a.id?1:0)-(selection==='dso:'+b.id?1:0)).map(d=>{const [x,y]=project(positionFromEquatorialLy(d.ra,d.dec,d.distanceLy));return inside([x,y])?<g key={d.id} className="map-hit" onClick={()=>onSelect('dso:'+d.id)}><LandmarkArtwork object={d} x={x} y={y} size={selection==='dso:'+d.id?132:32}/></g>:null})}
   {(()=>{const [x,y]=project(sun);return !landmark&&!(selected&&Math.hypot(x-500,y-300)<80)&&inside([x,y])?<g className="map-hit" onClick={()=>onSelect('sun')}><svg x={x-20} y={y-20} width="40" height="40" viewBox="0 0 100 100" style={{pointerEvents:'none'}}><StarArtwork star={{id:'sun',ci:.65}}/></svg><text x={x+9} y={y-7} className="map-label">SUN</text></g>:null})()}
   {(selected||gaiaStar)&&<svg x="410" y="210" width="180" height="180" viewBox="0 0 100 100" style={{pointerEvents:'none',overflow:'visible'}}><StarArtwork star={selected||gaiaStar} detailed/></svg>}
  </g></svg><MapStatus retry={retry}/>
 </div>;
}
