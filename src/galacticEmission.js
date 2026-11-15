import * as THREE from 'three';

// Procedural art aligned to the illustrative four-arm particle model. The hues,
// structure and dust-like lanes are not observational data or a fitted galaxy.
export function sampleGalacticEmission(x,z){
 const r=Math.hypot(x,z),theta=Math.atan2(z,x),outer=Math.max(0,Math.min(1,(51000-r)/7500));
 const spiral=Math.pow(Math.max(0,Math.cos(4*(theta-1.4*Math.log(Math.max(r,3000)/5500)))),3);
 const noise=.5+.18*Math.sin(x*.0011+Math.sin(z*.00042)*2)+.16*Math.sin(z*.00087-x*.00056)+.12*Math.sin(x*.0021+z*.0017);
 const mottled=Math.max(.1,Math.min(1,noise));
 const bar=Math.exp(-((x/6800)**2+(z/2900)**2)*.5);
 const disk=Math.exp(-r/30000);
 const dust=Math.max(.3,1-.5*Math.pow(Math.max(0,Math.sin(theta*4-1.4*4*Math.log(Math.max(r,3000)/5500)+.5)),8)*mottled);
 const light=outer*disk*(.12+spiral*.64)*(.42+mottled*.58)*dust;
 const warm=Math.min(1,bar*.9+Math.exp(-r/17000)*.35);
 return [Math.round(105+135*warm),Math.round(137+62*warm),Math.round(225-79*warm),Math.round(Math.min(.56,(light+bar*.7)*.31)*255)];
}
export function makeGalacticEmissionTexture(size=512){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d'),image=ctx.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const rgba=sampleGalacticEmission((x/(size-1)-.5)*107520,(y/(size-1)-.5)*107520),i=(y*size+x)*4;image.data[i]=rgba[0];image.data[i+1]=rgba[1];image.data[i+2]=rgba[2];image.data[i+3]=rgba[3];}
 ctx.putImageData(image,0,0);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
