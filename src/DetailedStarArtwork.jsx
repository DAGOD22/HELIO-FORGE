import React,{useId,useMemo} from 'react';
import {artworkSeed,starPalette} from './objectArtwork';

// The surface and corona are seeded artwork, not measurements of this star.
export default function DetailedStarArtwork({star}){
 const uid=useId().replace(/:/g,''),seed=artworkSeed(star?.id??star?.name),c=starPalette(star);
 const spots=useMemo(()=>Array.from({length:42},(_,i)=>{const n=artworkSeed(seed+':detail:'+i),a=n%360*Math.PI/180,r=Math.sqrt(((n>>>9)%850)/1000)*29;return {x:50+Math.cos(a)*r,y:50+Math.sin(a)*r,r:.35+(n>>>20)%22/10,opacity:.1+(n%13)/100}}),[seed]);
 const loops=useMemo(()=>Array.from({length:7},(_,i)=>{const n=artworkSeed(seed+':loop:'+i),angle=(n%360)*Math.PI/180,x=50+Math.cos(angle)*29,y=50+Math.sin(angle)*29,a2=angle+.18+(n%20)/100,xx=50+Math.cos(a2)*29,yy=50+Math.sin(a2)*29;return `M ${x} ${y} Q ${50+Math.cos((angle+a2)/2)*(35+n%8)} ${50+Math.sin((angle+a2)/2)*(35+n%8)} ${xx} ${yy}`}),[seed]);
 return <svg className="object-art detailed-star" viewBox="0 0 100 100" aria-hidden="true"><defs>
  <radialGradient id={uid+'halo'}><stop offset=".49" stopColor={c.middle} stopOpacity=".42"/><stop offset=".68" stopColor={c.edge} stopOpacity=".17"/><stop offset="1" stopColor={c.edge} stopOpacity="0"/></radialGradient>
  <radialGradient id={uid+'disc'} cx="37%" cy="31%" r="68%"><stop stopColor={c.core}/><stop offset=".55" stopColor={c.middle}/><stop offset="1" stopColor={c.edge}/></radialGradient>
  <radialGradient id={uid+'rim'}><stop offset=".35" stopColor="#fff" stopOpacity="0"/><stop offset=".85" stopColor={c.edge} stopOpacity=".08"/><stop offset="1" stopColor="#160d20" stopOpacity=".5"/></radialGradient>
  <filter id={uid+'grain'} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".18" numOctaves="3" seed={seed%997}/><feColorMatrix type="saturate" values="0"/></filter>
  <clipPath id={uid+'clip'}><circle cx="50" cy="50" r="29"/></clipPath>
 </defs><circle cx="50" cy="50" r="49" fill={'url(#'+uid+'halo)'}/><g fill="none" stroke={c.middle} strokeLinecap="round">{loops.map((d,i)=><path key={i} d={d} strokeWidth={i%2?.55:1} opacity=".7"/>)}</g>
 <circle cx="50" cy="50" r="29" fill={'url(#'+uid+'disc)'}/><g clipPath={'url(#'+uid+'clip)'}><rect x="21" y="21" width="58" height="58" filter={'url(#'+uid+'grain)'} opacity=".27" style={{mixBlendMode:'overlay'}}/>{spots.map((f,i)=><circle key={i} cx={f.x} cy={f.y} r={f.r} fill={i%3?c.edge:c.core} opacity={f.opacity}/>)}<path d="M 18 38 C 32 31 41 45 55 39 S 77 33 86 41 M 18 56 C 33 46 42 60 55 55 S 74 50 85 58 M 19 67 C 38 58 45 71 63 64 S 76 62 84 67" fill="none" stroke={c.core} strokeWidth=".6" opacity=".22"/><circle cx="50" cy="50" r="29" fill={'url(#'+uid+'rim)'}/></g><circle cx="50" cy="50" r="29" fill="none" stroke={c.core} strokeOpacity=".6" strokeWidth=".45"/></svg>;
}
