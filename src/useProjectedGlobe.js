import {useEffect,useState} from 'react';
import {projectGlobe} from './globeProjection';
// Canvas 2D is optional: if unavailable or decoding fails, the SVG still uses
// the source image clipped to a disc. No WebGL context is requested here.
export function useProjectedGlobe(source){
 const [result,setResult]=useState(null);
 useEffect(()=>{
  if(!source)return;let cancelled=false;const image=new Image();
  image.onload=()=>{try{
   const input=document.createElement('canvas');input.width=1024;input.height=512;const ctx=input.getContext('2d',{willReadFrequently:true});if(!ctx)return;ctx.drawImage(image,0,0,1024,512);
   const src=ctx.getImageData(0,0,1024,512).data,output=document.createElement('canvas');output.width=output.height=256;const out=output.getContext('2d');if(!out)return;
   const data=out.createImageData(256,256);data.data.set(projectGlobe(src,1024,512,256));out.putImageData(data,0,0);const url=output.toDataURL('image/png');if(!cancelled)setResult({source,url});
  }catch{/* Plain clipped image remains available. */}};
  image.src=source;return()=>{cancelled=true;image.onload=null};
 },[source]);
 return result?.source===source?result.url:null;
}
