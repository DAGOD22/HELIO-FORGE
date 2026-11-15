import React,{useId} from 'react';
import {DEEP_SKY_IMAGES} from './deepSky';
import {clusterPoints} from './landmarkArtwork';
// Observed 2D thumbnails are map icons, not volumetric models of a nebula.
export default function LandmarkArtwork({object,x,y,size}){
 const id=useId().replace(/:/g,''),image=DEEP_SKY_IMAGES[object.id];
 return <svg x={x-size/2} y={y-size/2} width={size} height={size} viewBox="0 0 100 100" style={{pointerEvents:'none',overflow:'visible'}}>
  <defs><clipPath id={id}><circle cx="50" cy="50" r="42"/></clipPath></defs>
  <circle cx="50" cy="50" r="49" fill="#9cd5e3" opacity=".1"/>
  <circle cx="50" cy="50" r="43" fill="#0c1f30"/>
  {image?<image href={'/deepsky/'+image.file} width="100" height="100" preserveAspectRatio="xMidYMid slice" clipPath={'url(#'+id+')'}/>:<g clipPath={'url(#'+id+')'}>{clusterPoints(object.id).map((point,i)=><g key={i}><circle cx={point.x} cy={point.y} r={point.r*1.5} fill={point.color} opacity=".14"/><circle cx={point.x} cy={point.y} r={point.r} fill={point.color}/><circle cx={point.x-point.r*.25} cy={point.y-point.r*.25} r={point.r*.32} fill="#fff" opacity=".7"/></g>)}</g>}
  <circle cx="50" cy="50" r="43" fill="none" stroke="#c5e7f1" strokeWidth="2" opacity=".8"/>
 </svg>;
}
