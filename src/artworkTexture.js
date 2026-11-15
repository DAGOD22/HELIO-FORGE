import * as THREE from 'three';
import {artworkSeed,planetPalette,starPalette} from './objectArtwork';
// Generated artwork, never a map of observed surface features.
export function makePlanetTexture(name){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d'),seed=artworkSeed(name),[light,mid,dark]=planetPalette(name);
 ctx.fillStyle=mid;ctx.fillRect(0,0,512,256);
 for(let i=0;i<32;i++){const h=artworkSeed(seed+':'+i),y=(h%256),height=2+(h>>>8)%16;ctx.globalAlpha=.08+(h%15)/100;ctx.fillStyle=i%2?light:dark;ctx.fillRect(0,y,512,height)}
 ctx.globalAlpha=.13;ctx.fillStyle=light;for(let i=0;i<30;i++){const h=artworkSeed(seed+'spot'+i);ctx.beginPath();ctx.ellipse(h%512,(h>>>9)%256,8+(h>>>18)%34,2+(h>>>23)%8,0,0,Math.PI*2);ctx.fill()}
 ctx.globalAlpha=1;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function makeStarTexture(star){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),c=starPalette(star),seed=artworkSeed(star?.id),halo=ctx.createRadialGradient(128,128,60,128,128,127);
 halo.addColorStop(0,c.middle+'99');halo.addColorStop(.5,c.edge+'35');halo.addColorStop(1,c.edge+'00');ctx.fillStyle=halo;ctx.fillRect(0,0,256,256);
 const disc=ctx.createRadialGradient(105,94,3,128,128,73);disc.addColorStop(0,c.core);disc.addColorStop(.65,c.middle);disc.addColorStop(1,c.edge);ctx.fillStyle=disc;ctx.beginPath();ctx.arc(128,128,73,0,Math.PI*2);ctx.fill();ctx.save();ctx.beginPath();ctx.arc(128,128,73,0,Math.PI*2);ctx.clip();for(let i=0;i<38;i++){const h=artworkSeed(seed+':'+i);ctx.fillStyle=i%2?c.core:c.edge;ctx.globalAlpha=.08+(h%9)/100;ctx.beginPath();ctx.arc(58+h%140,58+(h>>>8)%140,2+(h>>>18)%10,0,Math.PI*2);ctx.fill()}ctx.restore();const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
