import * as THREE from 'three';
import {artworkSeed} from './objectArtwork';
import {fractalNoise} from './proceduralNoise';
// A compact generated mist texture, used only as conceptual atmosphere around
// a selected object. Its structure and colour are not astronomical data.
export function makeNebulaTexture(id){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d'),image=ctx.createImageData(256,256),data=image.data,seed=artworkSeed(id);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const u=(x-128)/128,v=(y-128)/128,r=Math.hypot(u,v),off=(y*256+x)*4;if(r>=1)continue;
  const warp=fractalNoise(u*2.3+3,v*2.3+5,seed),mist=fractalNoise(u*5+warp*2+2,v*5-warp*2-1,seed+59),fine=fractalNoise(u*11-2,v*11+3,seed+191);
  const density=Math.max(0,mist*.8+fine*.2-.37),fall=Math.pow(Math.max(0,1-r*r),1.8);
  data[off]=180+Math.round(65*mist);data[off+1]=195+Math.round(50*fine);data[off+2]=255;data[off+3]=Math.round(210*density*fall);
 }
 ctx.putImageData(image,0,0);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
