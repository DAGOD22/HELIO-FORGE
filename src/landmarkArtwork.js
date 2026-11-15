import {artworkSeed} from './objectArtwork.js';
// A fallback symbol for objects without a bundled photograph. This is not a
// measured distribution of stars or an image of the actual cluster.
export function clusterPoints(id){
 return Array.from({length:34},(_,i)=>{const n=artworkSeed(`${id}:${i}`),a=n%360*Math.PI/180,r=Math.sqrt(((n>>>9)%1000)/1000)*38;return {x:50+Math.cos(a)*r,y:50+Math.sin(a)*r,r:i<7?3.2:1.4+(n%7)/10,color:i%4?'#cbe8ff':'#fff1c8'}});
}
// Artist-generated field for the Pleiades preview, not its observed membership.
export function clusterField(id){
 return Array.from({length:115},(_,i)=>{const n=artworkSeed(`${id}:field:${i}`);return {x:25+n%590,y:25+(n>>>10)%330,r:i<9?2.4+(n%14)/10:.35+(n%10)/10,bright:i<9,color:i%6===0?'#ffe0c4':'#d9edff'}});
}
