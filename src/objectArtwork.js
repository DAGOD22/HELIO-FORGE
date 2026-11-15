// Deterministic artistic palettes and detail. These are not measured surfaces.
export function artworkSeed(value){let hash=2166136261;for(const c of String(value??'')){hash^=c.codePointAt(0);hash=Math.imul(hash,16777619)}return hash>>>0}
export function starPalette(star){
 // HYG B-V and Gaia BP-RP are different indices: only use broad color bands.
 const ci=Number.isFinite(star?.ci)?star.ci:null,bp=Number.isFinite(star?.bpRp)?star.bpRp:null;
 const index=ci??(bp===null?null:bp*.7);
 if(index===null)return {core:'#edf3ff',middle:'#b4c6ea',edge:'#728bb9',basis:'neutral color (index unavailable)'};
 if(index<.25)return {core:'#f5faff',middle:'#b7d8ff',edge:'#6397db',basis:'broad catalogue color band'};
 if(index<.8)return {core:'#fffdf0',middle:'#ffe4aa',edge:'#df9e65',basis:'broad catalogue color band'};
 if(index<1.4)return {core:'#fff0cf',middle:'#ffc083',edge:'#db744d',basis:'broad catalogue color band'};
 return {core:'#ffe4c2',middle:'#ff9f71',edge:'#c6554a',basis:'broad catalogue color band'};
}
const planetPalettes=[['#ddac81','#a15f58','#432d39'],['#bdd5d5','#64949f','#243e52'],['#e4cfaa','#b88b68','#55435b'],['#c4b3d8','#80769e','#333450'],['#c5c9b6','#879481','#3b5051'],['#e6c7a2','#c7826b','#54394a']];
export function planetPalette(name){return planetPalettes[artworkSeed(name)%planetPalettes.length]}
