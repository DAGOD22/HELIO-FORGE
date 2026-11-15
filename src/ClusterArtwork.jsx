import React,{useId,useMemo} from 'react';
import {clusterField} from './landmarkArtwork';

// A decorative cluster scene: positions, nebulosity and apparent stellar sizes
// are invented, not an observation or a map of the selected cluster.
export default function ClusterArtwork({id}){
 const uid=useId().replace(/:/g,''),stars=useMemo(()=>clusterField(id),[id]);
 return <svg className="cluster-artwork" viewBox="0 0 640 380" preserveAspectRatio="xMidYMid slice" aria-label="Illustrative star cluster; star positions and surrounding nebulosity are invented" role="img">
  <defs>
   <radialGradient id={uid+'bg'}><stop stopColor="#163d69"/><stop offset=".5" stopColor="#081b35"/><stop offset="1" stopColor="#020912"/></radialGradient>
   <radialGradient id={uid+'blue'}><stop stopColor="#8bd2ff" stopOpacity=".38"/><stop offset=".45" stopColor="#438ac8" stopOpacity=".16"/><stop offset="1" stopColor="#1a4a83" stopOpacity="0"/></radialGradient>
   <radialGradient id={uid+'glow'}><stop stopColor="#fff" stopOpacity=".95"/><stop offset=".12" stopColor="#bfe3ff" stopOpacity=".65"/><stop offset=".4" stopColor="#7ebcf8" stopOpacity=".16"/><stop offset="1" stopColor="#75b5fc" stopOpacity="0"/></radialGradient>
   <filter id={uid+'mist'} x="-40%" y="-60%" width="180%" height="220%"><feGaussianBlur stdDeviation="22"/></filter>
  </defs>
  <rect width="640" height="380" fill={'url(#'+uid+'bg)'}/>
  <g filter={'url(#'+uid+'mist)'} opacity=".75" fill="none" strokeLinecap="round"><path d="M 45 296 C 175 160 260 330 385 160 S 562 96 652 8" stroke="#3b8bc2" strokeWidth="35"/><path d="M -30 115 C 120 190 195 59 312 130 S 470 300 650 195" stroke="#315990" strokeWidth="26"/></g>
  <ellipse cx="319" cy="190" rx="290" ry="180" fill={'url(#'+uid+'blue)'}/>
  {stars.map((star,i)=><g key={i}><circle cx={star.x} cy={star.y} r={star.r*(star.bright?9:3)} fill={'url(#'+uid+'glow)'} opacity={star.bright?.8:.45}/>{star.bright&&<path d={`M ${star.x-13} ${star.y} h 26 M ${star.x} ${star.y-13} v 26`} stroke="#c7e6ff" strokeWidth=".6" opacity=".5"/>}<circle cx={star.x} cy={star.y} r={star.r} fill={star.color} opacity={star.bright?1:.75}/><circle cx={star.x-star.r*.22} cy={star.y-star.r*.22} r={star.r*.35} fill="#fff"/></g>)}
 </svg>;
}
