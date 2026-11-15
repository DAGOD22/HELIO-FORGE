import React,{useEffect,useState} from 'react';
import ClusterArtwork from './ClusterArtwork';

// Pinned 2D media, not a 3D reconstruction or a physical-scale object.
export default function DeepSkyStage({object,image,onOpen,use2d}){
 const [collapsed,setCollapsed]=useState(!use2d);
 useEffect(()=>setCollapsed(!use2d),[use2d]);
 return <section className={'deep-stage '+(collapsed?'is-collapsed':'')} aria-label={object.name+' visual preview'}>
  {!collapsed&&<><div className="deep-stage-media">{image?<img src={'/deepsky/'+image.file} alt={'Observation thumbnail: '+object.name}/>:<ClusterArtwork id={object.id}/>}<div className="deep-stage-vignette"/></div><div className="deep-stage-label"><span>{image?'OBSERVATION / 2D IMAGE':'PROCEDURAL ILLUSTRATION'}</span><b>{object.name}</b><small>{image?'Image preview · not a 3D reconstruction or physical size':'Invented stellar positions and nebulosity · not an observation'}</small></div></>}
  <div className="deep-stage-actions">{image&&!collapsed&&<button onClick={onOpen}>VIEW IMAGE ↗</button>}<button onClick={()=>setCollapsed(v=>!v)} aria-expanded={!collapsed}>{collapsed?'SHOW PREVIEW':'HIDE PREVIEW'}</button></div>
 </section>;
}
