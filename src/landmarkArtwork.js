import {artworkSeed} from './objectArtwork.js';
// A fallback symbol for objects without a bundled photograph. This is not a
// measured distribution of stars or an image of the actual cluster.
export function clusterPoints(id){
 return Array.from({length:34},(_,i)=>{const n=artworkSeed(`${id}:${i}`),a=n%360*Math.PI/180,r=Math.sqrt(((n>>>9)%1000)/1000)*38;return {x:50+Math.cos(a)*r,y:50+Math.sin(a)*r,r:i<7?3.2:1.4+(n%7)/10,color:i%4?'#cbe8ff':'#fff1c8'}});
}
