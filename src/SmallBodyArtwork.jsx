import React,{useId} from 'react';
import {artworkSeed} from './objectArtwork';
// Decorative, seeded relief for bodies without bundled surface maps. Shapes and
// markings are fictional; even an elongated silhouette is not a measured model.
export default function SmallBodyArtwork({name,id,color='#aaa9a1'}){
 const uid=useId().replace(/:/g,''),seed=artworkSeed(name),irregular=id==='eros'||id==='halley'||id==='small-body',elongated=id==='haumea';
 const shape=irregular?'M 12 48 Q 10 31 24 26 Q 29 13 44 18 Q 59 10 69 20 Q 86 18 91 35 Q 96 51 84 64 Q 77 80 61 80 Q 45 88 32 79 Q 16 78 12 60 Z':elongated?'M 7 50 C 7 28 23 24 50 24 C 77 24 93 28 93 50 C 93 72 77 76 50 76 C 23 76 7 72 7 50 Z':'M 50 11 C 72 11 88 28 89 50 C 90 72 72 89 50 89 C 28 89 11 72 11 50 C 11 28 28 11 50 11 Z';
 return <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><defs><radialGradient id={uid+'g'} cx="32%" cy="25%" r="75%"><stop stopColor="#f5e8cf"/><stop offset=".55" stopColor={color}/><stop offset="1" stopColor="#292f3a"/></radialGradient><clipPath id={uid+'c'}><path d={shape}/></clipPath></defs><path d={shape} fill={'url(#'+uid+'g)'}/><g clipPath={'url(#'+uid+'c)'}>{Array.from({length:35},(_,i)=>{const h=artworkSeed(seed+':'+i);return <g key={i}><ellipse cx={16+h%68} cy={16+(h>>>8)%68} rx={2+(h>>>18)%6} ry={1.5+(h>>>21)%4} fill="#252c34" fillOpacity=".18" stroke="#f3e2ce" strokeOpacity=".21" strokeWidth=".5"/></g>})}<path d="M 7 60 Q 31 47 49 55 T 95 48 M 12 70 Q 36 59 61 66 T 91 59" fill="none" stroke="#e6d9c1" strokeOpacity=".17" strokeWidth="1"/></g><path d={shape} fill="none" stroke="#e6e2d7" strokeOpacity=".55" strokeWidth=".7"/></svg>;
}
