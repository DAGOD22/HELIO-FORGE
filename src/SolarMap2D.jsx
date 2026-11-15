import React,{useMemo} from 'react';
import {planets,allObjects} from './data';
import {orbitalPosition,orbitalPath} from './orbits';
import {MapStatus,useMapZoom} from './Map2DControls';
import {useProjectedGlobe} from './useProjectedGlobe';
import './map2d.css';

// A lightweight top-down projection: positions use the existing approximate
// planetary model, while all disc sizes and the focus portrait are illustrative.
export default function SolarMap2D({selected,onSelect,date,settings,overview,smallBody,navigationRef,retry,onZoomOut}){
 const [zoom,touch,containerRef,pan]=useMapZoom(navigationRef,`${selected}:${overview}`,gesture=>{if(gesture==='out')onZoomOut()});
 const day=date.toISOString().slice(0,10),model=useMemo(()=>{
  const dayDate=new Date(day+'T12:00:00Z');return planets.map(p=>({body:p,position:orbitalPosition(p,dayDate),path:orbitalPath(p,dayDate,80)}));
 },[day]);
 const object=selected==='small-body'&&smallBody?{name:smallBody.object?.shortname||'Small body',color:'#ab9d89'}:allObjects.find(o=>o.id===selected)||allObjects.find(o=>o.id==='earth');
 const overviewMode=selected==='overview',oort=selected==='oort-cloud';
 const texture=object.texture?'/textures/'+object.texture:null,projected=useProjectedGlobe(overviewMode||oort?null:texture);
 const toPoint=([x,,z])=>[500+x*7*zoom,310+z*7*zoom];
 return <div className="scene map2d solar-map" ref={containerRef} {...touch} aria-label="Interactive 2D solar system map; no WebGL required">
  <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label={overviewMode?'Top-down schematic planetary map. Planet positions are approximate, with compressed distances and symbolic sizes.':`Illustrative 2D view of ${object.name}; not to scale or a current image.`}>
   <defs><radialGradient id="solar-bg"><stop stopColor="#173747"/><stop offset=".6" stopColor="#091a29"/><stop offset="1" stopColor="#030914"/></radialGradient><radialGradient id="sun-glow"><stop stopColor="#fff3c2"/><stop offset=".22" stopColor="#f2aa5a" stopOpacity=".8"/><stop offset="1" stopColor="#f1a16b" stopOpacity="0"/></radialGradient><linearGradient id="disc-shade" x1="0" x2="1" y1="0" y2=".2"><stop stopColor="#ffffff" stopOpacity=".1"/><stop offset=".56" stopColor="#000000" stopOpacity=".08"/><stop offset="1" stopColor="#000711" stopOpacity=".82"/></linearGradient><clipPath id="focus-disc"><circle cx="500" cy="325" r={Math.min(180,147*zoom)}/></clipPath></defs>
   <rect width="1000" height="600" fill="url(#solar-bg)"/><MapStars/><g transform={`translate(${pan.x} ${pan.y})`}>
   {overviewMode?<><circle cx="500" cy="310" r="55" fill="url(#sun-glow)"/><circle cx="500" cy="310" r="8" fill="#ffe4a7" onClick={()=>onSelect('sun')} className="map-hit"/>
    {model.map(({body,position,path})=>{const [x,y]=toPoint(position);return <g key={body.id}>{settings.orbits&&<polyline points={path.map(p=>toPoint(p).join(',')).join(' ')} fill="none" stroke="#85aaba" strokeOpacity=".34" strokeWidth="1"/>}<g className="map-hit" onClick={()=>onSelect(body.id)}><circle cx={x} cy={y} r="16" fill="transparent"/>{body.id==='saturn'&&<ellipse cx={x} cy={y} rx="13" ry="3.5" fill="none" stroke="#dbc9a5" strokeWidth="1.5" transform={`rotate(-20 ${x} ${y})`}/>}<circle cx={x} cy={y} r="8" fill={body.color}/><svg x={x-8} y={y-8} width="16" height="16" viewBox="0 0 16 16" style={{pointerEvents:'none'}}><defs><clipPath id={'overview-'+body.id}><circle cx="8" cy="8" r="8"/></clipPath></defs><image href={'/thumbs/'+body.texture} width="16" height="16" preserveAspectRatio="xMidYMid slice" clipPath={'url(#overview-'+body.id+')'}/><circle cx="8" cy="8" r="7.7" fill="url(#disc-shade)" stroke="#d0e9f0" strokeWidth=".5"/></svg>{settings.labels&&<text x={x+12} y={y-9} className="map-label">{body.name}</text>}</g></g>})}</>:oort?<><circle cx="500" cy="320" r={195*zoom} fill="none" stroke="#9acbd5" strokeOpacity=".32" strokeDasharray="2 6"/><circle cx="500" cy="320" r="8" fill="#ffe4a7"/><text x="500" y="530" textAnchor="middle" className="map-caption">HYPOTHETICAL CLOUD · CONCEPTUAL ONLY</text></>:<>
    <circle cx="500" cy="325" r={Math.min(195,162*zoom)} fill={object.color||'#7792a0'} opacity=".13"/>
    {selected==='saturn'&&<ellipse cx="500" cy="325" rx={Math.min(250,200*zoom)} ry={Math.min(64,50*zoom)} transform="rotate(-18 500 325)" fill="none" stroke="#cfbb92" strokeWidth="14" opacity=".7"/>}
    <circle cx="500" cy="325" r={Math.min(180,147*zoom)} fill={object.color||'#78929e'}/>
    {texture&&<image href={projected||texture} x={500-Math.min(180,147*zoom)} y={325-Math.min(180,147*zoom)} width={2*Math.min(180,147*zoom)} height={2*Math.min(180,147*zoom)} preserveAspectRatio="xMidYMid slice" clipPath="url(#focus-disc)"/>}
    <circle cx="500" cy="325" r={Math.min(180,147*zoom)} fill="url(#disc-shade)" stroke="#99c3d3" strokeOpacity=".6"/>
   </>}
  </g></svg><MapStatus retry={retry}/>
 </div>;
}
function MapStars(){const stars=useMemo(()=>Array.from({length:130},(_,i)=>({x:(i*541+37)%1000,y:(i*313+61)%600,r:i%13===0?1.4:.65})),[]);return <g fill="#bddae4" opacity=".6">{stars.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={p.r}/>)}</g>}
