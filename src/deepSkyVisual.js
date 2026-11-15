import {artworkSeed} from './objectArtwork.js';

// Decorative geometry only: neither the spatial distribution nor the sizes,
// colors or apparent morphology are observational reconstructions.
export function buildDeepSkyCloud(object){
 const seed=artworkSeed(object.id);let state=seed||1;
 const rand=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
 const isCluster=object.type.toLowerCase().includes('cluster'),ring=object.type==='Planetary nebula';
 const count=isCluster?540:1100,positions=new Float32Array(count*3),colors=new Float32Array(count*3);
 const palette=isCluster?[[.75,.84,1],[1,.72,.46],[.72,.87,1]]:ring?[[.21,.68,.92],[.45,.42,.9],[.92,.44,.58]]:[[.32,.53,1],[.7,.39,.77],[1,.48,.34]];
 for(let i=0;i<count;i++){
  const a=rand()*Math.PI*2,up=rand()*2-1,q=Math.sqrt(Math.max(0,1-up*up)),r=isCluster?Math.pow(rand(),1.5)*.45:ring?.19+rand()*.16:Math.pow(rand(),.65)*.47;
  const j=i*3;
  if(ring){positions[j]=Math.cos(a)*r;positions[j+1]=up*.1;positions[j+2]=Math.sin(a)*r}
  else{positions[j]=Math.cos(a)*q*r;positions[j+1]=up*r*(isCluster?.8:.42);positions[j+2]=Math.sin(a)*q*r}
  const color=palette[Math.floor(rand()*palette.length)],brightness=.52+rand()*.48;
  colors[j]=color[0]*brightness;colors[j+1]=color[1]*brightness;colors[j+2]=color[2]*brightness;
 }
 return {positions,colors,isCluster};
}
