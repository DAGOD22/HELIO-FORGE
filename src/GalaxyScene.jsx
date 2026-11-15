import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {gaiaPosition} from './gaiaCatalog';
import {makeStarTexture} from './artworkTexture';
import {makeGalacticEmissionTexture} from './galacticEmission';
import {zoomCamera} from './cameraNavigation';
import {createCinematicEffects} from './cinematicEffects';
import {attachZoomBoundary} from './zoomBoundary';
import {schematicGalaxy,illustrativeGalaxyKnots,starPositionLy,positionFromEquatorialLy,SUN_GALACTIC_RADIUS_LY,symbolicStarBrightness} from './galaxyModel';
import {DEEP_SKY,DEEP_SKY_BY_ID,DEEP_SKY_IMAGES} from './deepSky';
import {clusterPoints} from './landmarkArtwork';
import {stellarFragment} from './stellarGlyph';

const vec=a=>new THREE.Vector3(...a);
function discTexture(){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,1,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,'rgba(255,255,255,.8)');g.addColorStop(.5,'rgba(255,255,255,.16)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
function markerLabel(text){const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='rgba(4,14,25,.82)';ctx.fillRect(0,6,512,70);ctx.font='500 28px sans-serif';ctx.fillStyle='#d9eaf2';ctx.fillText(text,14,53);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
// Flat observation thumbnails used as symbolic screen-facing markers, not 3D reconstructions.
function landmarkTexture(object){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');let alive=true,image=null;
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 function draw(source){if(!alive)return;ctx.clearRect(0,0,128,128);ctx.fillStyle='#0b1d2b';ctx.beginPath();ctx.arc(64,64,55,0,Math.PI*2);ctx.fill();ctx.save();ctx.beginPath();ctx.arc(64,64,54,0,Math.PI*2);ctx.clip();if(source){const side=Math.min(source.naturalWidth,source.naturalHeight);ctx.drawImage(source,(source.naturalWidth-side)/2,(source.naturalHeight-side)/2,side,side,10,10,108,108)}else{for(const p of clusterPoints(object.id)){ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x*1.28,p.y*1.28,p.r*1.28,0,Math.PI*2);ctx.fill()}}ctx.restore();ctx.strokeStyle='#bddde8';ctx.lineWidth=2;ctx.beginPath();ctx.arc(64,64,55,0,Math.PI*2);ctx.stroke();texture.needsUpdate=true}
 draw(null);const file=DEEP_SKY_IMAGES[object.id]?.file;if(file){image=new Image();image.onload=()=>draw(image);image.src='/deepsky/'+file}
 return {texture,dispose(){alive=false;if(image){image.onload=null;image.onerror=null}texture.dispose()}};
}
function starColor(ci){if(ci==null)return new THREE.Color('#d8e6ff');if(ci<.25)return new THREE.Color('#b4d5ff');if(ci<.8)return new THREE.Color('#fff1d5');if(ci<1.4)return new THREE.Color('#ffd2a1');return new THREE.Color('#f5a78c');}
export default function GalaxyScene({stars,selection,request,onSelect,showLandmarks,neighbors,showNeighbors,onZoomInto,canZoomInto,density,onDensity,gaiaData,gaiaStar,onGaiaDrawn,navigationRef,effects}){
 const mount=useRef(),current=useRef({stars,selection,request,onSelect,showLandmarks,neighbors,showNeighbors,onZoomInto,canZoomInto,onDensity,gaiaData,gaiaStar,onGaiaDrawn,effects});
 useEffect(()=>{current.current={stars,selection,request,onSelect,showLandmarks,neighbors,showNeighbors,onZoomInto,canZoomInto,onDensity,gaiaData,gaiaStar,onGaiaDrawn,effects}},[stars,selection,request,onSelect,showLandmarks,neighbors,showNeighbors,onZoomInto,canZoomInto,onDensity,gaiaData,gaiaStar,onGaiaDrawn,effects]);
 useEffect(()=>{
  const el=mount.current,scene=new THREE.Scene();scene.background=new THREE.Color('#030812');
  const camera=new THREE.PerspectiveCamera(42,1,.005,500000),renderer=new THREE.WebGLRenderer({antialias:true,logarithmicDepthBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;el.appendChild(renderer.domElement);
  const post=createCinematicEffects(renderer,scene,camera,{strength:.5,threshold:.7,radius:.48});
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.5;controls.maxDistance=250000;if(selection==='sun'){controls.target.set(SUN_GALACTIC_RADIUS_LY,0,0);camera.position.set(SUN_GALACTIC_RADIUS_LY+100,105,150)}else camera.position.set(70000,85000,105000);controls.update();
  const texture=discTexture(),schematic=schematicGalaxy(),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(schematic.positions,3));geo.setAttribute('color',new THREE.BufferAttribute(schematic.colors,3));
  const galaxy=new THREE.Points(geo,new THREE.PointsMaterial({map:texture,size:2.7,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.53,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(galaxy);
  // Generate the dense, illustrative galaxy off the main thread. Replace the
  // low-density preview in-place; catalogue stars remain a separate layer.
  let worker=null,workerRequest=0,densityOpacity=.53,detailTarget=38000,detailDrawn=38000,lodElapsed=0,lodFrames=0;
  function setDensity(count){
   workerRequest++;const token=workerRequest;if(worker)worker.terminate();
   try{worker=new Worker(new URL('./galaxyWorker.js',import.meta.url),{type:'module'});worker.onmessage=event=>{if(token!==workerRequest)return;const {positions,colors}=event.data;geo.dispose();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.computeBoundingSphere();detailTarget=count;detailDrawn=Math.min(count,80000);geo.setDrawRange(0,detailDrawn);galaxy.material.size=count>500000?1.25:1.7;densityOpacity=count>500000?.22:.3;current.current.onDensity(detailDrawn);};worker.onerror=()=>{if(token===workerRequest)current.current.onDensity(null)};worker.postMessage({count});}catch{current.current.onDensity(null)}
  }
  el.setGalaxyDensity=setDensity;current.current.onDensity(38000);
  // A sparse second layer spreads illustrative light around the procedural particles;
  // these wisps are not a measured dust map or individually catalogued stars.
  const hazeGeo=new THREE.BufferGeometry(),hazePositions=[],hazeColors=[];
  for(let i=0;i<schematic.positions.length;i+=18){hazePositions.push(...schematic.positions.slice(i,i+3));hazeColors.push(...schematic.colors.slice(i,i+3));}
  hazeGeo.setAttribute('position',new THREE.Float32BufferAttribute(hazePositions,3));hazeGeo.setAttribute('color',new THREE.Float32BufferAttribute(hazeColors,3));
  const haze=new THREE.Points(hazeGeo,new THREE.PointsMaterial({map:texture,size:18,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.09,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(haze);
  // Decorative glowing knots lend the synthetic arms colour and depth. None are
  // observed star-forming regions; they fade out for the local catalogue view.
  const knots=illustrativeGalaxyKnots(schematic),knotsGeo=new THREE.BufferGeometry();
  knotsGeo.setAttribute('position',new THREE.BufferAttribute(knots.positions,3));knotsGeo.setAttribute('color',new THREE.BufferAttribute(knots.colors,3));
  const knotsLayer=new THREE.Points(knotsGeo,new THREE.PointsMaterial({map:texture,size:30,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(knotsLayer);
  // A diffuse, stylised disk adds depth to the schematic overview, not a dust observation.
  const cloudCanvas=document.createElement('canvas');cloudCanvas.width=cloudCanvas.height=1024;
  const cloudCtx=cloudCanvas.getContext('2d');cloudCtx.globalCompositeOperation='lighter';
  for(let i=0;i<schematic.positions.length;i+=9){const x=512+schematic.positions[i]/105,y=512+schematic.positions[i+2]/105;const col=schematic.colors;const warm=col[i]>col[i+2];const radius=warm?6:8;const glow=cloudCtx.createRadialGradient(x,y,0,x,y,radius);glow.addColorStop(0,warm?'rgba(231,152,94,.025)':'rgba(84,134,226,.025)');glow.addColorStop(1,'rgba(0,0,0,0)');cloudCtx.fillStyle=glow;cloudCtx.fillRect(x-radius,y-radius,radius*2,radius*2)}
  const cloudTexture=new THREE.CanvasTexture(cloudCanvas);cloudTexture.colorSpace=THREE.SRGBColorSpace;
  const cloud=new THREE.Mesh(new THREE.PlaneGeometry(107520,107520),new THREE.MeshBasicMaterial({map:cloudTexture,transparent:true,opacity:.6,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));cloud.rotation.x=-Math.PI/2;scene.add(cloud);
  // Broad translucent arm emission is generated artwork, never a dust map.
  const emissionTexture=makeGalacticEmissionTexture();
  const emission=new THREE.Mesh(new THREE.PlaneGeometry(107520,107520),new THREE.MeshBasicMaterial({map:emissionTexture,transparent:true,opacity:.85,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));emission.rotation.x=-Math.PI/2;emission.position.y=-5;scene.add(emission);
  const core=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:0xffd5a0,transparent:true,opacity:.27,blending:THREE.AdditiveBlending,depthWrite:false}));core.scale.set(27000,27000,1);scene.add(core);
  const sunMap=makeStarTexture({id:'sun',ci:.65});const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:sunMap,transparent:true,depthWrite:false,depthTest:false}));sun.position.set(SUN_GALACTIC_RADIUS_LY,0,0);scene.add(sun);
  const center=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:0xffffff,transparent:true,depthWrite:false,depthTest:false}));scene.add(center);
  const highlight=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false,depthTest:false}));scene.add(highlight);let portraitKey=null;
  // Hubble image-pointing markers are symbolic: position and distance are approximate,
  // and flat image thumbnails are not observed three-dimensional morphology or measured size.
  const landmarks=DEEP_SKY.map(object=>{
   const id='dso:'+object.id,position=vec(positionFromEquatorialLy(object.ra,object.dec,object.distanceLy));
   const art=landmarkTexture(object);
   const marker=new THREE.Sprite(new THREE.SpriteMaterial({map:art.texture,transparent:true,depthWrite:false,depthTest:false}));marker.position.copy(position);scene.add(marker);
   const labelMap=markerLabel(object.name),label=new THREE.Sprite(new THREE.SpriteMaterial({map:labelMap,transparent:true,depthWrite:false,depthTest:false}));scene.add(label);
   return {id,position,marker,label,labelMap,art};
  });
  // HYG stars keep catalogue positions and approximate colour, with bounded,
  // symbolic brightness-based sprite sizes (not measured stellar radii).
  const nearbyGeo=new THREE.BufferGeometry(),nearbyMat=new THREE.ShaderMaterial({
   uniforms:{fade:{value:1},pixelRatio:{value:Math.min(window.devicePixelRatio,1.5)}},
   vertexShader:`#include <common>
   #include <logdepthbuf_pars_vertex>
   attribute vec3 color;attribute float brightness;varying vec3 vColor;varying float vBrightness;varying float seed;uniform float pixelRatio;
   void main(){vColor=color;vBrightness=brightness;seed=fract(sin(dot(position,vec3(12.9898,78.233,31.17)))*43758.5453)*6.283;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=(12.0+brightness*8.0)*pixelRatio;
   #include <logdepthbuf_vertex>
   }`,
   fragmentShader:`#include <logdepthbuf_pars_fragment>
   varying vec3 vColor;varying float vBrightness;varying float seed;uniform float fade;
   void main(){
   #include <logdepthbuf_fragment>
   ${stellarFragment}
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }`,transparent:true,depthWrite:false});
  const nearby=new THREE.Points(nearbyGeo,nearbyMat);scene.add(nearby);
  // Gaia is an optional, separately labelled observed-data layer. Its point size,
  // halo and colour ramp are illustrative; the render budget is adaptive.
  const gaiaGeo=new THREE.BufferGeometry(),gaiaMat=new THREE.ShaderMaterial({uniforms:{fade:{value:1},pixelRatio:{value:Math.min(window.devicePixelRatio,1.5)}},
   vertexShader:`#include <common>
   #include <logdepthbuf_pars_vertex>
   attribute vec3 color; attribute float brightness; varying vec3 vColor; varying float vBrightness; varying float seed; uniform float pixelRatio;
   void main(){vColor=color;vBrightness=brightness;seed=fract(sin(dot(position,vec3(12.9898,78.233,31.17)))*43758.5453)*6.283;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=(7.0+brightness*4.0)*pixelRatio;
   #include <logdepthbuf_vertex>
   }`,
   fragmentShader:`#include <logdepthbuf_pars_fragment>
   varying vec3 vColor; varying float vBrightness; varying float seed; uniform float fade;
   void main(){
   #include <logdepthbuf_fragment>
   ${stellarFragment}
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }`,transparent:true,depthWrite:false});
  const gaiaPoints=new THREE.Points(gaiaGeo,gaiaMat);scene.add(gaiaPoints);
  let loadedGaia=null,gaiaDrawn=0,gaiaElapsed=0,gaiaFrames=0;
  // Connections show straight-line catalogue separations, never trajectories.
  const guideGeometry=new THREE.BufferGeometry(),guideMaterial=new THREE.LineBasicMaterial({color:0x7ac8db,transparent:true,opacity:.48,depthWrite:false}),guides=new THREE.LineSegments(guideGeometry,guideMaterial);scene.add(guides);
  const neighborGeometry=new THREE.BufferGeometry(),neighborMaterial=new THREE.PointsMaterial({map:texture,color:0xa8e6f0,size:13,sizeAttenuation:false,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}),neighborPoints=new THREE.Points(neighborGeometry,neighborMaterial);scene.add(neighborPoints);let previousNeighbors=null,previousNeighborSelection='';
  let loaded=null,positions=[],byId=new Map(),frame,fly=null,lastRequest=selection==='sun'?request:-1,lastFrame=performance.now();
  controls.addEventListener('start',()=>{fly=null});
  function resize(){const w=el.clientWidth,h=el.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);post.resize(w,h);}window.addEventListener('resize',resize);resize();
  let down;function onDown(e){down=[e.clientX,e.clientY];}function onUp(e){
   if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
   const box=renderer.domElement.getBoundingClientRect(),x=(e.clientX-box.left)/box.width*2-1,y=-(e.clientY-box.top)/box.height*2+1;
   let best=14,found=null;const projected=new THREE.Vector3();const hit=(position,id)=>{const p=projected.copy(position).project(camera);if(p.z< -1||p.z>1)return;const d=Math.hypot((p.x-x)*box.width/2,(p.y-y)*box.height/2);if(d<best){best=d;found=id;}};
   hit(sun.position,'sun');if(center.visible)hit(center.position,'center');if(current.current.showLandmarks)landmarks.forEach(item=>hit(item.position,item.id));if(nearby.visible)positions.forEach((p,i)=>hit(p,String(loaded[i].id)));if(found)current.current.onSelect(found);
  }
  renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointerup',onUp);
  const detachZoom=attachZoomBoundary(renderer.domElement,controls,{direction:'in',canEnter:()=>{const id=current.current.selection,star=byId.get(id),target=id==='sun'?sun.position:star?vec(starPositionLy(star)):null;return !!target&&current.current.canZoomInto(id)&&controls.target.distanceTo(target)<.25},onEnter:()=>current.current.onZoomInto(current.current.selection)});
  const navigation={zoom:factor=>{fly=null;return zoomCamera(controls,factor)}};navigationRef.current=navigation;
  function animate(){frame=requestAnimationFrame(animate);const now=performance.now(),dt=(now-lastFrame)/1000;lastFrame=now;if(dt>1){lodElapsed=lodFrames=gaiaElapsed=gaiaFrames=0}const s=current.current;
   if(loaded!==s.stars){loaded=s.stars;byId=new Map(loaded.map(a=>[String(a.id),a]));positions=loaded.map(a=>vec(starPositionLy(a)));const p=new Float32Array(positions.length*3),c=new Float32Array(positions.length*3),b=new Float32Array(positions.length);positions.forEach((v,i)=>{v.toArray(p,i*3);starColor(loaded[i].ci).toArray(c,i*3);b[i]=symbolicStarBrightness(loaded[i].mag)});nearbyGeo.setAttribute('position',new THREE.BufferAttribute(p,3));nearbyGeo.setAttribute('color',new THREE.BufferAttribute(c,3));nearbyGeo.setAttribute('brightness',new THREE.BufferAttribute(b,1));nearbyGeo.computeBoundingSphere();}
   if(loadedGaia!==s.gaiaData){loadedGaia=s.gaiaData;if(loadedGaia){gaiaGeo.setAttribute('position',new THREE.BufferAttribute(loadedGaia.positions,3));gaiaGeo.setAttribute('color',new THREE.BufferAttribute(loadedGaia.colors,3));gaiaGeo.setAttribute('brightness',new THREE.BufferAttribute(loadedGaia.brightness,1));gaiaGeo.computeBoundingSphere();gaiaDrawn=50000;gaiaGeo.setDrawRange(0,gaiaDrawn);s.onGaiaDrawn(gaiaDrawn)}else{s.onGaiaDrawn(0)}}
   if(previousNeighbors!==s.neighbors||previousNeighborSelection!==s.selection){previousNeighbors=s.neighbors;previousNeighborSelection=s.selection;const selected=byId.get(s.selection),lines=[],points=[];if(selected){const start=starPositionLy(selected);for(const entry of s.neighbors){const end=starPositionLy(entry.star);lines.push(...start,...end);points.push(...end)}}guideGeometry.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));neighborGeometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));guideGeometry.computeBoundingSphere();neighborGeometry.computeBoundingSphere();}
   if(s.request!==lastRequest){lastRequest=s.request;const star=byId.get(s.selection);const object=DEEP_SKY_BY_ID[s.selection];const target=s.gaiaStar?vec(gaiaPosition(s.gaiaStar.xyz)):s.selection==='galaxy'||s.selection==='center'?new THREE.Vector3():s.selection==='sun'?sun.position.clone():object?vec(positionFromEquatorialLy(object.ra,object.dec,object.distanceLy)):star?vec(starPositionLy(star)):sun.position.clone();const distance=s.gaiaStar?250:s.selection==='galaxy'?155000:s.selection==='center'?15000:s.selection==='sun'?180:object?Math.max(750,Math.min(2400,object.distanceLy*.4)):8;const dir=s.selection==='galaxy'?new THREE.Vector3(.48,.58,.7).normalize():new THREE.Vector3(.65,.7,1).normalize();const offset=camera.position.clone().sub(controls.target);fly={elapsed:0,start:controls.target.clone(),target,dir0:offset.clone().normalize(),dir1:dir,dist0:Math.max(offset.length(),.5),dist1:distance};}
   if(fly){fly.elapsed+=window.matchMedia('(prefers-reduced-motion: reduce)').matches?2:Math.min(dt,.25);let t=Math.min(1,fly.elapsed/2),k=t*t*(3-2*t);controls.target.lerpVectors(fly.start,fly.target,k);let direction=fly.dir0.clone().lerp(fly.dir1,k).normalize();camera.position.copy(controls.target).addScaledVector(direction,Math.exp(Math.log(fly.dist0)*(1-k)+Math.log(fly.dist1)*k));if(t===1)fly=null;}
   const dist=camera.position.distanceTo(controls.target),fade=THREE.MathUtils.clamp((dist-500)/2000,0,1),localFade=THREE.MathUtils.clamp((3500-camera.position.distanceTo(sun.position))/1000,0,1);galaxy.visible=haze.visible=knotsLayer.visible=core.visible=cloud.visible=emission.visible=fade>0;knotsLayer.material.opacity=.12*fade;cloud.material.opacity=.6*fade;emission.material.opacity=.85*fade;galaxy.material.opacity=densityOpacity*fade;haze.material.opacity=.09*fade;core.material.opacity=.27*fade;gaiaPoints.visible=!!loadedGaia&&localFade>0;gaiaMat.uniforms.fade.value=.8*localFade;
   if(gaiaPoints.visible){gaiaElapsed+=Math.min(dt,.25);gaiaFrames++;if(gaiaElapsed>2){const fps=gaiaFrames/gaiaElapsed;let next=gaiaDrawn;if(fps<24)next=Math.max(20000,Math.floor(gaiaDrawn*.7));else if(fps>42)next=Math.min(1000000,Math.ceil(gaiaDrawn*1.35));if(next!==gaiaDrawn){gaiaDrawn=next;gaiaGeo.setDrawRange(0,next);s.onGaiaDrawn(next)}gaiaElapsed=gaiaFrames=0}}else{gaiaElapsed=gaiaFrames=0}
   nearby.visible=localFade>0;nearbyMat.uniforms.fade.value=.95*localFade;sun.visible=true;center.visible=dist>500;
   // The density target is a ceiling, not a promise of interactive performance.
   // Adjust only while the galaxy is actually rendered, and never fabricate data.
   if(galaxy.visible&&detailTarget>38000){lodElapsed+=Math.min(dt,.25);lodFrames++;if(lodElapsed>2){const fps=lodFrames/lodElapsed;let next=detailDrawn;if(fps<24)next=Math.max(30000,Math.floor(detailDrawn*.65));else if(fps>42)next=Math.min(detailTarget,Math.ceil(detailDrawn*1.35));if(next!==detailDrawn){detailDrawn=next;geo.setDrawRange(0,detailDrawn);s.onDensity(detailDrawn)}lodElapsed=0;lodFrames=0;}}else{lodElapsed=0;lodFrames=0;}highlight.visible=(byId.has(s.selection)&&nearby.visible)||!!s.gaiaStar;guides.visible=neighborPoints.visible=!!(s.showNeighbors&&nearby.visible&&byId.has(s.selection));
   const star=byId.get(s.selection),portrait=star||s.gaiaStar,portraitId=portrait?s.selection:null;if(portraitId!==portraitKey){portraitKey=portraitId;highlight.material.map?.dispose();highlight.material.map=portrait?makeStarTexture(portrait):null;highlight.material.needsUpdate=true}if(star)highlight.position.copy(vec(starPositionLy(star)));else if(s.gaiaStar)highlight.position.copy(vec(gaiaPosition(s.gaiaStar.xyz)));
   for(const marker of [sun,center,highlight]){const d=Math.max(1,camera.position.distanceTo(marker.position)),scale=marker===highlight?.16:.025;marker.scale.set(d*scale,d*scale,1);}
   // Labels are decluttered in screen space; the underlying marker positions never move.
   const used=[],ordered=[...landmarks].sort((a,b)=>(a.id===s.selection?-1:0)-(b.id===s.selection?-1:0)),up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
   for(const item of ordered){const d=Math.max(1,camera.position.distanceTo(item.position));item.marker.visible=s.showLandmarks;item.marker.scale.set(d*(item.id===s.selection ? .18 : .045),d*(item.id===s.selection ? .18 : .045),1);item.label.position.copy(item.position).addScaledVector(up,d*(item.id===s.selection?.105:.032));item.label.scale.set(d*.14,d*.026,1);const p=item.position.clone().project(camera),screenX=p.x*el.clientWidth/2,screenY=p.y*el.clientHeight/2;const clear=p.z>=-1&&p.z<=1&&Math.abs(p.x)<1.1&&Math.abs(p.y)<1.1&&!used.some(([x,y])=>Math.abs(x-screenX)<115&&Math.abs(y-screenY)<24);item.label.visible=s.showLandmarks&&(clear||item.id===s.selection);if(item.label.visible)used.push([screenX,screenY]);}
   camera.near=Math.max(.005,dist*.00001);camera.updateProjectionMatrix();controls.update();post.render(s.effects);
  }
  animate();return()=>{if(navigationRef.current===navigation)navigationRef.current=null;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);detachZoom();workerRequest++;worker?.terminate();delete el.setGalaxyDensity;controls.dispose();post.dispose();landmarks.forEach(item=>{item.marker.material.dispose();item.label.material.dispose();item.labelMap.dispose();item.art.dispose()});guideGeometry.dispose();guideMaterial.dispose();neighborGeometry.dispose();neighborMaterial.dispose();geo.dispose();hazeGeo.dispose();haze.material.dispose();knotsGeo.dispose();knotsLayer.material.dispose();cloud.geometry.dispose();cloud.material.dispose();cloudTexture.dispose();emission.geometry.dispose();emission.material.dispose();emissionTexture.dispose();nearbyGeo.dispose();nearbyMat.dispose();gaiaGeo.dispose();gaiaMat.dispose();galaxy.material.dispose();core.material.dispose();sun.material.dispose();sunMap.dispose();center.material.dispose();highlight.material.map?.dispose();highlight.material.dispose();texture.dispose();renderer.dispose();el.removeChild(renderer.domElement);};
 },[]);
 useEffect(()=>{mount.current?.setGalaxyDensity?.(density)},[density]);
 return <div ref={mount} className="galaxy-canvas" aria-label="Three dimensional Milky Way, nearby stars and deep-sky map. Drag to rotate, scroll to zoom."/>;
}
