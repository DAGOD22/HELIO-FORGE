import * as THREE from 'three';
import {artworkSeed,planetPalette,starPalette,planetPattern} from './objectArtwork';
import {fractalNoise} from './proceduralNoise';
// Generated artwork, never a map of observed surface features.
export function makePlanetTexture(name){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d'),seed=artworkSeed(name),[light,mid,dark]=planetPalette(name);
 ctx.fillStyle=mid;ctx.fillRect(0,0,512,256);
 const pattern=planetPattern(name);
 if(pattern==='banded')for(let i=0;i<32;i++){const h=artworkSeed(seed+':'+i),y=(h%256),height=2+(h>>>8)%16;ctx.globalAlpha=.08+(h%15)/100;ctx.fillStyle=i%2?light:dark;ctx.fillRect(0,y,512,height)}
 if(pattern==='cratered')for(let i=0;i<140;i++){const h=artworkSeed(seed+':crater:'+i);ctx.globalAlpha=.1+(h%12)/100;ctx.strokeStyle=light;ctx.fillStyle=dark;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(h%512,(h>>>9)%256,2+(h>>>18)%13,0,Math.PI*2);ctx.fill();ctx.stroke()}
 if(pattern==='marbled')for(let i=0;i<16;i++){const h=artworkSeed(seed+':marble:'+i);ctx.globalAlpha=.12;ctx.strokeStyle=i%2?light:dark;ctx.lineWidth=3+(h%16);ctx.beginPath();ctx.moveTo(h%512,0);ctx.bezierCurveTo((h>>>8)%512,70,(h>>>16)%512,180,h%512,256);ctx.stroke()}
 ctx.globalAlpha=.13;ctx.fillStyle=light;for(let i=0;i<30;i++){const h=artworkSeed(seed+'spot'+i);ctx.beginPath();ctx.ellipse(h%512,(h>>>9)%256,8+(h>>>18)%34,2+(h>>>23)%8,0,0,Math.PI*2);ctx.fill()}
 ctx.globalAlpha=1;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function makeStarTexture(star){
 // One bounded texture is built per selected star; the million-source layer
 // continues to use lightweight GPU glyphs. Surface details are invented.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=384;
 const ctx=canvas.getContext('2d'),image=ctx.createImageData(384,384),pixels=image.data,c=starPalette(star),seed=artworkSeed(star?.id??star?.name),phase=(seed%10000)/733;
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),core=rgb(c.core),mid=rgb(c.middle),edge=rgb(c.edge);
 for(let y=0;y<384;y++)for(let x=0;x<384;x++){
  const u=(x-192)/112,v=(y-192)/112,r=Math.hypot(u,v),off=(y*384+x)*4;
  if(r<=1){
   const z=Math.sqrt(Math.max(0,1-r*r));
   const warp=fractalNoise(u*3+phase,v*3-phase,seed),granule=fractalNoise(u*14+warp*2,v*14-warp*2,seed+17),patch=fractalNoise(u*4+phase,v*4-phase,seed+81);
   const light=Math.max(0,Math.min(1,.31+.27*z+.45*granule+.16*(patch-.5)));
   for(let k=0;k<3;k++)pixels[off+k]=Math.max(0,Math.min(255,(edge[k]*(1-light)+mid[k]*light)*.84+core[k]*.16*z));
   pixels[off+3]=255;
  }else{const halo=Math.max(0,Math.exp(-Math.pow((r-1)*4.5,2))*.22-Math.max(0,r-1)*.04);for(let k=0;k<3;k++)pixels[off+k]=mid[k];pixels[off+3]=Math.round(halo*255)}
 }
 ctx.putImageData(image,0,0);
 ctx.strokeStyle=c.middle;ctx.lineCap='round';for(let i=0;i<9;i++){const h=artworkSeed(seed+':arc:'+i),a=(h%360)*Math.PI/180,b=a+.11+(h%17)/100,r=112,outer=119+h%27;ctx.globalAlpha=.2+(h%30)/100;ctx.lineWidth=.8+(h%20)/10;ctx.beginPath();ctx.moveTo(192+Math.cos(a)*r,192+Math.sin(a)*r);ctx.quadraticCurveTo(192+Math.cos((a+b)/2)*outer,192+Math.sin((a+b)/2)*outer,192+Math.cos(b)*r,192+Math.sin(b)*r);ctx.stroke()}
 ctx.globalAlpha=1;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
// Seam-safe procedural equirectangular texture for an illustrative 3D star.
// Sphere coordinates ensure the first and last longitude meet smoothly.
export function makeStarSurfaceTexture(star){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
 const ctx=canvas.getContext('2d'),image=ctx.createImageData(512,256),pixels=image.data,c=starPalette(star),seed=artworkSeed(star?.id??star?.name),phase=(seed%10000)/937;
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),light=rgb(c.core),mid=rgb(c.middle),dark=rgb(c.edge);
 for(let y=0;y<256;y++)for(let x=0;x<512;x++){
  const lat=(y/255-.5)*Math.PI,lon=(x/511)*Math.PI*2,nx=Math.cos(lat)*Math.cos(lon),ny=Math.sin(lat),nz=Math.cos(lat)*Math.sin(lon);
  const warp=fractalNoise(nx*3+nz*2+phase,ny*3+nz*2-phase,seed),detail=fractalNoise(nx*12+nz*7+warp*2,ny*12+nz*4-warp*2,seed+59),large=fractalNoise(nx*3+nz*2+phase,ny*3+nz-phase,seed+181);
  const tone=Math.max(0,Math.min(1,.2+detail*.68+large*.25)),j=(y*512+x)*4;
  for(let k=0;k<3;k++)pixels[j+k]=Math.min(255,dark[k]*(1-tone)*.7+mid[k]*tone*.8+light[k]*.22);
  pixels[j+3]=255;
 }
 ctx.putImageData(image,0,0);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
