import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {schematicGalaxy,starPositionLy,positionFromEquatorialLy,SUN_GALACTIC_RADIUS_LY} from './galaxyModel';
import {DEEP_SKY,DEEP_SKY_BY_ID} from './deepSky';

const vec=a=>new THREE.Vector3(...a);
function discTexture(){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,1,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,'rgba(255,255,255,.8)');g.addColorStop(.5,'rgba(255,255,255,.16)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
function markerLabel(text){const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='rgba(4,14,25,.82)';ctx.fillRect(0,6,512,70);ctx.font='500 28px sans-serif';ctx.fillStyle='#d9eaf2';ctx.fillText(text,14,53);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function starColor(ci){if(ci==null)return new THREE.Color('#d8e6ff');if(ci<.25)return new THREE.Color('#b4d5ff');if(ci<.8)return new THREE.Color('#fff1d5');if(ci<1.4)return new THREE.Color('#ffd2a1');return new THREE.Color('#f5a78c');}
export default function GalaxyScene({stars,selection,request,onSelect,showLandmarks}){
 const mount=useRef(),current=useRef({stars,selection,request,onSelect,showLandmarks});
 useEffect(()=>{current.current={stars,selection,request,onSelect,showLandmarks}},[stars,selection,request,onSelect,showLandmarks]);
 useEffect(()=>{
  const el=mount.current,scene=new THREE.Scene();scene.background=new THREE.Color('#030812');
  const camera=new THREE.PerspectiveCamera(42,1,.005,500000),renderer=new THREE.WebGLRenderer({antialias:true,logarithmicDepthBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;el.appendChild(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.5;controls.maxDistance=250000;camera.position.set(70000,85000,105000);controls.update();
  const texture=discTexture(),schematic=schematicGalaxy(),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(schematic.positions,3));geo.setAttribute('color',new THREE.BufferAttribute(schematic.colors,3));
  const galaxy=new THREE.Points(geo,new THREE.PointsMaterial({map:texture,size:3.8,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(galaxy);
  const core=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:0xffd5a0,transparent:true,opacity:.27,blending:THREE.AdditiveBlending,depthWrite:false}));core.scale.set(27000,27000,1);scene.add(core);
  const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:0xffe6a4,transparent:true,depthWrite:false,depthTest:false}));sun.position.set(SUN_GALACTIC_RADIUS_LY,0,0);scene.add(sun);
  const center=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:0xffffff,transparent:true,depthWrite:false,depthTest:false}));scene.add(center);
  const highlight=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:0xb0edff,transparent:true,depthWrite:false,depthTest:false}));scene.add(highlight);
  // Hubble image-pointing markers are symbolic: position and distance are approximate,
  // and no observed three-dimensional morphology or measured size is implied.
  const landmarks=DEEP_SKY.map(object=>{
   const id='dso:'+object.id,position=vec(positionFromEquatorialLy(object.ra,object.dec,object.distanceLy));
   const color=object.type.includes('cluster')?0xffd796:object.type==='Supernova remnant'?0xffaaad:0xa9cfff;
   const marker=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color,transparent:true,depthWrite:false,depthTest:false}));marker.position.copy(position);scene.add(marker);
   const labelMap=markerLabel(object.name),label=new THREE.Sprite(new THREE.SpriteMaterial({map:labelMap,transparent:true,depthWrite:false,depthTest:false}));scene.add(label);
   return {id,position,marker,label,labelMap};
  });
  const nearbyGeo=new THREE.BufferGeometry(),nearbyMat=new THREE.PointsMaterial({map:texture,size:9,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false});const nearby=new THREE.Points(nearbyGeo,nearbyMat);scene.add(nearby);
  let loaded=null,positions=[],byId=new Map(),frame,fly=null,lastRequest=-1,lastFrame=performance.now();
  controls.addEventListener('start',()=>{fly=null});
  function resize(){const w=el.clientWidth,h=el.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}window.addEventListener('resize',resize);resize();
  let down;function onDown(e){down=[e.clientX,e.clientY];}function onUp(e){
   if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
   const box=renderer.domElement.getBoundingClientRect(),x=(e.clientX-box.left)/box.width*2-1,y=-(e.clientY-box.top)/box.height*2+1;
   let best=14,found=null;const projected=new THREE.Vector3();const hit=(position,id)=>{const p=projected.copy(position).project(camera);if(p.z< -1||p.z>1)return;const d=Math.hypot((p.x-x)*box.width/2,(p.y-y)*box.height/2);if(d<best){best=d;found=id;}};
   hit(sun.position,'sun');if(center.visible)hit(center.position,'center');if(current.current.showLandmarks)landmarks.forEach(item=>hit(item.position,item.id));if(nearby.visible)positions.forEach((p,i)=>hit(p,String(loaded[i].id)));if(found)current.current.onSelect(found);
  }
  renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointerup',onUp);
  function animate(){frame=requestAnimationFrame(animate);const now=performance.now(),dt=(now-lastFrame)/1000;lastFrame=now;const s=current.current;
   if(loaded!==s.stars){loaded=s.stars;byId=new Map(loaded.map(a=>[String(a.id),a]));positions=loaded.map(a=>vec(starPositionLy(a)));const p=new Float32Array(positions.length*3),c=new Float32Array(positions.length*3);positions.forEach((v,i)=>{v.toArray(p,i*3);starColor(loaded[i].ci).toArray(c,i*3)});nearbyGeo.setAttribute('position',new THREE.BufferAttribute(p,3));nearbyGeo.setAttribute('color',new THREE.BufferAttribute(c,3));nearbyGeo.computeBoundingSphere();}
   if(s.request!==lastRequest){lastRequest=s.request;const star=byId.get(s.selection);const object=DEEP_SKY_BY_ID[s.selection];const target=s.selection==='galaxy'||s.selection==='center'?new THREE.Vector3():s.selection==='sun'?sun.position.clone():object?vec(positionFromEquatorialLy(object.ra,object.dec,object.distanceLy)):star?vec(starPositionLy(star)):sun.position.clone();const distance=s.selection==='galaxy'?155000:s.selection==='center'?15000:s.selection==='sun'?180:object?Math.max(750,Math.min(2400,object.distanceLy*.4)):8;const dir=s.selection==='galaxy'?new THREE.Vector3(.48,.58,.7).normalize():new THREE.Vector3(.65,.7,1).normalize();const offset=camera.position.clone().sub(controls.target);fly={elapsed:0,start:controls.target.clone(),target,dir0:offset.clone().normalize(),dir1:dir,dist0:Math.max(offset.length(),.5),dist1:distance};}
   if(fly){fly.elapsed+=dt;let t=Math.min(1,fly.elapsed/2),k=t*t*(3-2*t);controls.target.lerpVectors(fly.start,fly.target,k);let direction=fly.dir0.clone().lerp(fly.dir1,k).normalize();camera.position.copy(controls.target).addScaledVector(direction,Math.exp(Math.log(fly.dist0)*(1-k)+Math.log(fly.dist1)*k));if(t===1)fly=null;}
   const dist=camera.position.distanceTo(controls.target);galaxy.visible=dist>500;core.visible=dist>500;nearby.visible=camera.position.distanceTo(sun.position)<3500;sun.visible=true;center.visible=dist>500;highlight.visible=byId.has(s.selection)&&nearby.visible;
   const star=byId.get(s.selection);if(star)highlight.position.copy(vec(starPositionLy(star)));
   for(const marker of [sun,center,highlight]){const d=Math.max(1,camera.position.distanceTo(marker.position));marker.scale.set(d*.025,d*.025,1);}
   // Labels are decluttered in screen space; the underlying marker positions never move.
   const used=[],ordered=[...landmarks].sort((a,b)=>(a.id===s.selection?-1:0)-(b.id===s.selection?-1:0)),up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
   for(const item of ordered){const d=Math.max(1,camera.position.distanceTo(item.position));item.marker.visible=s.showLandmarks;item.marker.scale.set(d*(item.id===s.selection ? .035 : .021),d*(item.id===s.selection ? .035 : .021),1);item.label.position.copy(item.position).addScaledVector(up,d*.022);item.label.scale.set(d*.14,d*.026,1);const p=item.position.clone().project(camera),screenX=p.x*el.clientWidth/2,screenY=p.y*el.clientHeight/2;const clear=p.z>=-1&&p.z<=1&&Math.abs(p.x)<1.1&&Math.abs(p.y)<1.1&&!used.some(([x,y])=>Math.abs(x-screenX)<115&&Math.abs(y-screenY)<24);item.label.visible=s.showLandmarks&&(clear||item.id===s.selection);if(item.label.visible)used.push([screenX,screenY]);}
   camera.near=Math.max(.005,dist*.00001);camera.updateProjectionMatrix();controls.update();renderer.render(scene,camera);
  }
  animate();return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);controls.dispose();landmarks.forEach(item=>{item.marker.material.dispose();item.label.material.dispose();item.labelMap.dispose()});geo.dispose();nearbyGeo.dispose();nearbyMat.dispose();galaxy.material.dispose();core.material.dispose();sun.material.dispose();center.material.dispose();highlight.material.dispose();texture.dispose();renderer.dispose();el.removeChild(renderer.domElement);};
 },[]);
 return <div ref={mount} className="galaxy-canvas" aria-label="Three dimensional Milky Way, nearby stars and deep-sky map. Drag to rotate, scroll to zoom."/>;
}
