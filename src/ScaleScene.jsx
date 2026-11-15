import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {zoomCamera} from './cameraNavigation';
import {createCinematicEffects} from './cinematicEffects';
import {attachZoomBoundary} from './zoomBoundary';
import {allObjects,planets} from './data';
import {SATELLITES,allSatelliteEclipticPositions,plutoEclipticPosition} from './satellites';
import {LIVE_MOONS,interpolateTrack} from './liveMoons';
import {MINOR_BODIES} from './minorBodies';
import {AU_KM,radiusAU} from './scaleModel';
import {heliocentricPosition,orbitalPath,smallBodyPath,smallBodyHeliocentricPosition,parseSmallBodyOrbit,eclipticToScene} from './orbits';
import {makeArtisticSky,makeCatalogSky,makeRingMaterial,createDetailTextureController,makeSoftParticleTexture,makeCoronaTexture,makeAtmosphereMaterial,ATMOSPHERES,surfaceVertex,surfaceFragment} from './visuals';

const EPOCH=Date.UTC(2000,0,1,12),ROT={mercury:1407.6,venus:-5832.5,earth:23.9345,mars:24.6229,jupiter:9.925,saturn:10.656,uranus:-17.24,neptune:16.11,pluto:-153.2928,ceres:9.07417};
const mapVector=v=>new THREE.Vector3(...eclipticToScene(v));
function labelTexture(text){const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');ctx.font='500 27px sans-serif';ctx.fillStyle='#d2e8f2';ctx.fillText('•  '+text,8,42);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

// Positions and radii are in AU. The render origin follows the current focus;
// coordinate subtraction is performed in JS double precision in Three's scene graph.
export default function ScaleScene({selected,onSelect,date,settings,overview,smallBody,snapshot,cinematic,onZoomOut,navigationRef}){
 const mount=useRef(),state=useRef({});
 useEffect(()=>{state.current={selected,date,settings,overview,smallBody,snapshot,cinematic,onZoomOut}},[selected,date,settings,overview,smallBody,snapshot,cinematic,onZoomOut]);
 useEffect(()=>{
  const el=mount.current,scene=new THREE.Scene(),root=new THREE.Group(),camera=new THREE.PerspectiveCamera(36,1,1e-11,2000);scene.add(root);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,logarithmicDepthBuffer:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;el.appendChild(renderer.domElement);
  const post=createCinematicEffects(renderer,scene,camera,{strength:.38,threshold:.78,radius:.4});
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=true;controls.minDistance=1e-10;controls.maxDistance=200;controls.zoomSpeed=4;
  scene.add(new THREE.AmbientLight(0xabb9c7,.35));root.add(new THREE.PointLight(0xfff6e7,1.6,0,0));
  const loader=new THREE.TextureLoader(),textures=[],objects={},positions={},lines=[],meshes=[],radiusById={},detailTargets={},geometry=new THREE.SphereGeometry(1,64,40);const skyMap=makeArtisticSky(loader,textures),catalogSky=makeCatalogSky(loader,textures,renderer.capabilities.maxTextureSize),darkSky=new THREE.Color('#030812');scene.background=catalogSky;scene.backgroundIntensity=.48;
  function texture(file){const t=loader.load('/textures/'+file);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.push(t);return t;}
  const nightMap=texture('earth_night_4096.jpg'),specularMap=texture('earth_specular_2048.jpg');specularMap.colorSpace=THREE.NoColorSpace;
  const particleTexture=makeSoftParticleTexture();textures.push(particleTexture);
  function addObject(id,parent=root){
   const data=allObjects.find(o=>o.id===id),r=radiusAU(id),group=new THREE.Group();parent.add(group);objects[id]=group;radiusById[id]=r;
   let material;
   if(id==='sun')material=new THREE.MeshBasicMaterial({map:texture(data.texture),color:0xffefd2,toneMapped:false});
   else if(data.texture){const surface=texture(id==='earth'?'earth_day_4096.jpg':data.texture);material=new THREE.ShaderMaterial({uniforms:{dayMap:{value:surface},nightMap:{value:nightMap},specularMap:{value:specularMap},earth:{value:id==='earth'?1:0},sunPosition:{value:root.position},hasRings:{value:0},ringCenter:{value:new THREE.Vector3()},ringNormal:{value:new THREE.Vector3(0,1,0)},ringOuter:{value:1}},vertexShader:surfaceVertex,fragmentShader:surfaceFragment});}
   else material=new THREE.MeshLambertMaterial({color:data.color});
   if(['earth','jupiter','saturn','mars','moon'].includes(id))detailTargets[id]={material,base:material.uniforms.dayMap.value,file:id==='moon'?'moon_lroc_4k.jpg':id==='earth'?'earth_blue_marble_4k.jpg':id+'_4k.jpg'};
   const mesh=new THREE.Mesh(geometry,material);mesh.scale.setScalar(r);mesh.rotation.z=parseFloat(data.tilt||'0')*Math.PI/180;mesh.userData.id=id;group.add(mesh);meshes.push(mesh);group.userData.mesh=mesh;
   if(ATMOSPHERES[id]){const atmos=new THREE.Mesh(geometry,makeAtmosphereMaterial(id,root.position));atmos.scale.setScalar(r*ATMOSPHERES[id][2]);group.add(atmos);group.userData.atmos=atmos;}
   if(id==='earth'){const clouds=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({map:texture('earth_clouds_1024.png'),transparent:true,opacity:.75,depthWrite:false}));clouds.scale.setScalar(r*1.012);clouds.rotation.z=mesh.rotation.z;group.add(clouds);group.userData.clouds=clouds;}
   const tex=labelTexture(data.name);textures.push(tex);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));group.add(label);group.userData.label=label;
   return group;
  }
  addObject('sun');const coronaTexture=makeCoronaTexture();textures.push(coronaTexture);const solarGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:coronaTexture,color:0xffcb85,transparent:true,opacity:.48,blending:THREE.AdditiveBlending,depthWrite:false}));solarGlow.scale.setScalar(radiusAU('sun')*8);objects.sun.add(solarGlow);for(const p of planets)addObject(p.id);addObject('pluto');for(const id of Object.keys(MINOR_BODIES))addObject(id);
  for(const [id,info] of Object.entries(SATELLITES))addObject(id,objects[info.parent]);
  const detailController=createDetailTextureController(renderer,detailTargets);
  // The visible ring radii and opacity are illustrative, not an optical-depth model.
  const ringWidth=radiusAU('saturn')*4.54;
  const ring=new THREE.Mesh(new THREE.PlaneGeometry(ringWidth,ringWidth),makeRingMaterial(radiusAU('saturn'),.52,.86,1));ring.rotation.x=-Math.PI/2;const ringTilt=new THREE.Group();ringTilt.rotation.z=26.7*Math.PI/180;ringTilt.add(ring);objects.saturn.add(ringTilt);
  function addLine(points,color=0x7690a1,opacity=.27,parent=root){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(v=>new THREE.Vector3(...v))),new THREE.LineBasicMaterial({color,transparent:true,opacity}));parent.add(line);lines.push(line);return line;}
  for(const p of planets)objects[p.id].userData.orbit=addLine(orbitalPath(p,state.current.date||new Date(),256,true));
  for(const [id,o] of Object.entries(MINOR_BODIES))objects[id].userData.orbit=addLine(smallBodyPath(o,256,true));
  const plutoPoints=[];for(let i=0;i<=100;i++){const d=new Date((state.current.date||new Date()).getTime()+90560*86400000*i/100);plutoPoints.push(eclipticToScene(plutoEclipticPosition(d)));}objects.pluto.userData.orbit=addLine(plutoPoints);
  // Procedural markers are not individual catalogued bodies.
  let seed=1827;const rnd=()=>((seed=seed*16807%2147483647)/2147483647);
  function points(coords,material){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));const point=new THREE.Points(geo,material);root.add(point);return point;}
  const stars=[];for(let i=0;i<4000;i++){const z=2*rnd()-1,t=rnd()*Math.PI*2,r=500+rnd()*400,q=Math.sqrt(1-z*z);stars.push(r*q*Math.cos(t),r*z,r*q*Math.sin(t));}const starField=points(stars,new THREE.PointsMaterial({map:particleTexture,color:0xaec7dd,size:2.5,sizeAttenuation:false,transparent:true,opacity:.85,depthWrite:false}));
  function belt(count,a,b,color){const coords=[];for(let i=0;i<count;i++){const r=a+(b-a)*rnd(),t=rnd()*2*Math.PI;coords.push(r*Math.cos(t),(rnd()-.5)*.12,r*Math.sin(t));}return points(coords,new THREE.PointsMaterial({map:particleTexture,color,size:2.5,sizeAttenuation:false,transparent:true,opacity:.55,depthWrite:false}));}
  const belts=[belt(1400,2.2,3.2,0x9c9288),belt(1900,30,50,0x758a95)];
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down;
  function pointerDown(e){down=[e.clientX,e.clientY]}
  function click(e){if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const box=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(meshes.filter(m=>m.visible&&m.parent?.visible!==false));if(hits.length)onSelect(hits[0].object.userData.id)}
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',click);
  const detachZoom=attachZoomBoundary(renderer.domElement,controls,{direction:'out',canEnter:()=>true,onEnter:()=>state.current.onZoomOut()});
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);post.resize(w,h)};window.addEventListener('resize',resize);const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(el);resize();
  let frame,lastQuality='',lastYear=null,lastSecond=null,lastFocus='',lastOverview=-1,oldAnchor=new THREE.Vector3(),fly=null,lastFrame=performance.now(),previousSmall=null,smallOrbit=null,smallLine=null;
  controls.addEventListener('start',()=>{fly=null});
  const navigation={zoom:factor=>{fly=null;return zoomCamera(controls,factor)}};navigationRef.current=navigation;
  function animate(){
   frame=requestAnimationFrame(animate);const now=performance.now(),dt=(now-lastFrame)/1000;lastFrame=now;const s=state.current;if(!s.date)return;
   if(lastQuality!==s.settings.quality){lastQuality=s.settings.quality;const caps={LOW:.75,MEDIUM:1,HIGH:1.5,ULTRA:2,EXTREME:2.5};renderer.setPixelRatio(Math.min(devicePixelRatio,caps[lastQuality]||1.5));const fraction={LOW:.3,MEDIUM:.6,HIGH:1,ULTRA:1,EXTREME:1}[lastQuality]||1;starField.geometry.setDrawRange(0,Math.floor(4000*fraction));belts.forEach(b=>b.geometry.setDrawRange(0,Math.floor(b.geometry.attributes.position.count*fraction)));resize();}
   scene.background=s.settings.sky==='catalogue'?catalogSky:s.settings.sky==='artistic'?skyMap:darkSky;starField.visible=s.settings.sky==='artistic';detailController.update(s.selected,s.settings.quality);
   const days=(s.date.getTime()-EPOCH)/86400000;
   positions.sun=new THREE.Vector3();
   for(const p of planets){const pos=mapVector(heliocentricPosition(p,s.date));positions[p.id]=pos;objects[p.id].position.copy(pos);objects[p.id].userData.mesh.rotation.y=(days*24/ROT[p.id]*Math.PI*2)%(2*Math.PI);const obj=objects[p.id];if(obj.userData.atmos)obj.userData.atmos.visible=s.settings.atmosphere;if(obj.userData.clouds){obj.userData.clouds.visible=s.settings.atmosphere;obj.userData.clouds.rotation.y=obj.userData.mesh.rotation.y+days*.018;}}
   const second=Math.floor(s.date.getTime()/1000);if(second!==lastSecond){lastSecond=second;objects.pluto.position.copy(mapVector(plutoEclipticPosition(s.date)));const physical=allSatelliteEclipticPositions(s.date);for(const info of Object.values(SATELLITES))objects[info.id].position.copy(mapVector(physical[info.id]));}
   positions.pluto=objects.pluto.position.clone();objects.pluto.userData.mesh.rotation.y=days*24/ROT.pluto*Math.PI*2;
   for(const info of Object.values(SATELLITES)){positions[info.id]=positions[info.parent].clone().add(objects[info.id].position);objects[info.id].rotation.y=Math.atan2(-objects[info.id].position.x,-objects[info.id].position.z);}
   for(const [id,o] of Object.entries(MINOR_BODIES)){const pos=mapVector(smallBodyHeliocentricPosition(o,s.date));objects[id].position.copy(pos);positions[id]=pos;objects[id].userData.mesh.rotation.y=days*(id==='ceres'?24/ROT.ceres*Math.PI*2:.15);}
   if(previousSmall!==s.smallBody){previousSmall=s.smallBody;smallOrbit=parseSmallBodyOrbit(s.smallBody);if(objects['small-body']){const old=objects['small-body'];root.remove(old);meshes.splice(meshes.indexOf(old.userData.mesh),1);old.userData.mesh.material.dispose();delete objects['small-body'];}if(smallLine){root.remove(smallLine);smallLine.geometry.dispose();smallLine.material.dispose();lines.splice(lines.indexOf(smallLine),1);smallLine=null;}
    if(smallOrbit){const entry=s.smallBody.phys_par?.find(e=>e.name==='diameter'),diameter=Number(entry?.value),size=Number.isFinite(diameter)&&diameter>0?diameter/(2*AU_KM):null;radiusById['small-body']=size;const group=new THREE.Group(),mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color:0xaba69b}));mesh.userData.id='small-body';mesh.scale.setScalar(size||1e-9);mesh.visible=!!size;group.add(mesh);group.userData.mesh=mesh;group.userData.label=new THREE.Object3D();root.add(group);objects['small-body']=group;meshes.push(mesh);smallLine=addLine(smallBodyPath(smallOrbit,256,true));}
   }
   if(smallOrbit&&objects['small-body']){const pos=mapVector(smallBodyHeliocentricPosition(smallOrbit,s.date));objects['small-body'].position.copy(pos);positions['small-body']=pos;}
   for(const id of Object.keys(LIVE_MOONS))if(objects[id])objects[id].visible=false;
   const live=LIVE_MOONS[s.selected],snap=s.snapshot,valid=!!(live&&snap?.id===s.selected&&snap?.day===s.date.toISOString().slice(0,10)&&Array.isArray(snap.samples));
   if(valid){const vec=interpolateTrack(snap.samples,s.date);if(vec){if(!objects[s.selected])addObject(s.selected,objects[live.parent]);const body=objects[s.selected];body.position.copy(mapVector(vec));body.visible=true;positions[s.selected]=positions[live.parent].clone().add(body.position);}}
   if(s.date.getUTCFullYear()!==lastYear){lastYear=s.date.getUTCFullYear();for(const p of planets){const line=objects[p.id].userData.orbit;line.geometry.dispose();line.geometry=new THREE.BufferGeometry().setFromPoints(orbitalPath(p,s.date,256,true).map(v=>new THREE.Vector3(...v)));}}
   lines.forEach(line=>line.visible=s.settings.orbits);belts.forEach(b=>b.visible=s.settings.belts);
   const focusId=live&&!valid?live.parent:s.selected,focus=positions[focusId]||new THREE.Vector3(),portraitFit=s.cinematic?Math.max(1,(focusId==='saturn'?.9:.72)/(el.clientWidth/Math.max(el.clientHeight,1))):1,key=focusId+':'+(valid?'live':'normal')+(s.cinematic?':cinema:'+portraitFit.toFixed(2):'');
   if(key!==lastFocus||lastOverview!==s.overview){
    const first=lastFocus==='';lastFocus=key;lastOverview=s.overview;
    if(!first){const shift=oldAnchor.clone().sub(focus);camera.position.add(shift);controls.target.add(shift);}
    const radius=radiusById[focusId]||1e-6,endDistance=focusId==='overview'?100:Math.max(radius*(s.cinematic?(focusId==='saturn'?6.3:4.7):6.3)*portraitFit,1e-10),towardSun=focus.clone().negate().normalize();if(towardSun.lengthSq()<.1)towardSun.set(1,.3,1).normalize();const tangent=new THREE.Vector3(-towardSun.z,.2,towardSun.x).normalize(),endDir=towardSun.multiplyScalar(.9).addScaledVector(tangent,.4).normalize();
    if(first){camera.position.copy(endDir).multiplyScalar(endDistance);controls.target.set(0,0,0);fly=null;}else{const delta=camera.position.clone().sub(controls.target),startDist=Math.max(delta.length(),1e-12);fly={elapsed:0,startTarget:controls.target.clone(),startDir:delta.normalize(),startDist,endDir,endDistance};}
   }
   oldAnchor.copy(focus);root.position.copy(focus).negate();ring.material.uniforms.center.value.copy(objects.saturn.position).add(root.position);ring.material.uniforms.sunPosition.value.copy(root.position);
   if(fly){fly.elapsed+=window.matchMedia('(prefers-reduced-motion: reduce)').matches?2:Math.min(dt,.25);const k=Math.min(1,fly.elapsed/2),ease=k*k*(3-2*k),dir=fly.startDir.clone().lerp(fly.endDir,ease);if(dir.lengthSq()<1e-8)dir.copy(fly.endDir);dir.normalize();controls.target.copy(fly.startTarget).multiplyScalar(1-ease);const distance=Math.exp(Math.log(fly.startDist)*(1-ease)+Math.log(fly.endDistance)*ease);camera.position.copy(controls.target).addScaledVector(dir,distance);if(k===1)fly=null;}
   const focusRadius=radiusById[focusId]||1e-6;controls.minDistance=Math.max(1e-11,focusRadius*1.08);camera.near=Math.max(1e-12,Math.min(focusRadius*.01,camera.position.distanceTo(controls.target)*.001));camera.updateProjectionMatrix();
   const cameraAbsolute=camera.position.clone().add(focus);
   for(const [id,body] of Object.entries(objects)){const label=body.userData.label;if(!label?.isSprite)continue;const absolute=positions[id];label.visible=!!(!s.cinematic&&s.settings.labels&&absolute&&id!==focusId&&body.visible!==false);if(label.visible){const dist=Math.max(cameraAbsolute.distanceTo(absolute),radiusById[id]||1e-8);label.scale.set(dist*.1,dist*.025,1);label.position.set(dist*.025,(radiusById[id]||0)+dist*.02,0);}}
   controls.update();post.render(s.settings.effects&&s.settings.quality!=='LOW');
  }
  animate();
  return()=>{if(navigationRef.current===navigation)navigationRef.current=null;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);resizeObserver.disconnect();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',click);detachZoom();controls.dispose();post.dispose();detailController.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())});textures.forEach(t=>t.dispose());renderer.dispose();el.removeChild(renderer.domElement);};
 },[]);
 return <div className="scene" ref={mount} aria-label="Physical-scale three dimensional solar system. Drag to rotate and scroll to zoom."/>;
}
