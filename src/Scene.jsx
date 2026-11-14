import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {planets,allObjects} from './data';
import {MINOR_BODIES} from './minorBodies';
import {LIVE_MOONS,interpolateTrack} from './liveMoons';
import {SATELLITES, satelliteDisplayPosition, satellitePath, plutoEclipticPosition, allSatelliteEclipticPositions} from './satellites';
import {orbitalPosition, orbitalPath, parseSmallBodyOrbit, smallBodyHeliocentricPosition, smallBodyPath, renderPosition} from './orbits';
import {makeArtisticSky,makeRingMaterial,createDetailTextureController} from './visuals';

const ROTATION_HOURS = {mercury:1407.6, venus:-5832.5, earth:23.9345, mars:24.6229, jupiter:9.925, saturn:10.656, uranus:-17.24, neptune:16.11};
const EPOCH = Date.UTC(2000,0,1,12);
const noRingUniforms=()=>({hasRings:{value:0},ringCenter:{value:new THREE.Vector3()},ringNormal:{value:new THREE.Vector3(0,1,0)},ringOuter:{value:1}});
const vertex = `
 varying vec2 vUv;
 varying vec3 vWorldNormal;
 varying vec3 vWorldPosition;
 void main() {
   vUv = uv;
   vWorldNormal = normalize(mat3(modelMatrix) * normal);
   vec4 world = modelMatrix * vec4(position, 1.0);
   vWorldPosition = world.xyz;
   gl_Position = projectionMatrix * viewMatrix * world;
 }`;
const planetFragment = `
 uniform sampler2D dayMap;
 uniform sampler2D nightMap;
 uniform sampler2D specularMap;
 uniform float earth;
 uniform float hasRings;
 uniform vec3 ringCenter;
 uniform vec3 ringNormal;
 uniform float ringOuter;
 varying vec2 vUv;
 varying vec3 vWorldNormal;
 varying vec3 vWorldPosition;
 void main() {
   vec3 normal = normalize(vWorldNormal);
   vec3 lightDir = normalize(-vWorldPosition);
   float sun = dot(normal, lightDir);
   float daylight = smoothstep(-0.13, 0.12, sun);
   vec3 surface = texture2D(dayMap, vUv).rgb;
   // Exposure is deliberately normalized across planets; sunlight direction is heliocentric.
   float ringShade=0.0;
   if(hasRings>0.5){
     float denom=dot(lightDir,ringNormal);
     if(abs(denom)>0.0001){
       float t=dot(ringCenter-vWorldPosition,ringNormal)/denom;
       vec3 hit=vWorldPosition+lightDir*t-ringCenter;
       float r=length(hit)/ringOuter;
       float band=smoothstep(.46,.49,r)*(1.0-smoothstep(.96,.985,r));
       float gap=1.0-smoothstep(.006,.014,abs(r-.82));
       ringShade=step(0.0,t)*band*(1.0-gap*.95)*.65;
     }
   }
   vec3 color = surface * (0.035 + 1.18 * max(sun, 0.0)*(1.0-ringShade));
   if (earth > 0.5) {
     vec3 night = texture2D(nightMap, vUv).rgb;
     color += night * (1.0 - daylight) * 1.3;
     vec3 viewDir = normalize(cameraPosition - vWorldPosition);
     vec3 halfDir = normalize(lightDir + viewDir);
     float ocean = texture2D(specularMap, vUv).r;
     color += vec3(0.55, 0.69, 0.77) * pow(max(dot(normal, halfDir), 0.0), 90.0) * ocean * daylight * 0.26;
   }
   gl_FragColor = vec4(color, 1.0);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
 }`;
const atmosphereVertex = `
 varying vec3 vNormal;
 varying vec3 vView;
 varying vec3 vWorld;
 void main() {
   vNormal = normalize(mat3(modelMatrix) * normal);
   vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
   vView = normalize(cameraPosition - vWorld);
   gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
 }`;
const atmosphereFragment = `
 varying vec3 vNormal;
 varying vec3 vView;
 varying vec3 vWorld;
 uniform vec3 hazeColor;
 uniform float hazeStrength;
 void main() {
   float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.5);
   float sunlit = smoothstep(-0.5, 0.35, dot(normalize(vNormal), normalize(-vWorld)));
   vec3 twilight=mix(hazeColor*.45,hazeColor,sunlit)+vec3(.12,.045,.015)*(1.0-sunlit)*sunlit;
   gl_FragColor = vec4(twilight, rim * (0.08 + hazeStrength * sunlit));
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
 }`;

function makeLabel(name){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
 const ctx=canvas.getContext('2d');ctx.font='500 27px sans-serif';ctx.fillStyle='rgba(210,232,242,.95)';ctx.fillText('•  '+name,10,42);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;return map;
}
function makeGlowTexture() {
 const canvas=document.createElement('canvas'); canvas.width=256; canvas.height=256;
 const ctx=canvas.getContext('2d'), gradient=ctx.createRadialGradient(128,128,2,128,128,128);
 gradient.addColorStop(0,'rgba(255,225,165,.8)');gradient.addColorStop(.15,'rgba(255,178,90,.35)');gradient.addColorStop(.45,'rgba(232,127,55,.08)');gradient.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);return new THREE.CanvasTexture(canvas);
}

export default function Scene({selected,onSelect,date,settings,overview,smallBody,snapshot,cinematic}) {
 const mount=useRef(), state=useRef({});
 useEffect(()=>{state.current={selected,date,settings,overview,smallBody,snapshot,cinematic}},[selected,date,settings,overview,smallBody,snapshot,cinematic]);
 useEffect(()=>{
  const el=mount.current, scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(36,1,.01,2000);
  camera.position.set(0,5,18);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;el.appendChild(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=.35;controls.maxDistance=240;controls.enablePan=true;
  scene.add(new THREE.AmbientLight(0x8197af,.42));scene.add(new THREE.PointLight(0xfff3df,1.4,0,0));
  const loader=new THREE.TextureLoader(), objects={}, textures=[],detailTargets={};const skyMap=makeArtisticSky(loader,textures),darkSky=new THREE.Color('#030812');scene.background=skyMap;
  function texture(file, color=true){const t=loader.load('/textures/'+file);if(color)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.push(t);return t}
  const sphere=new THREE.SphereGeometry(1,96,64),sphereGeometries={ULTRA:sphere};let currentSphere=sphere;
  const sun=new THREE.Mesh(sphere,new THREE.MeshBasicMaterial({map:texture('Sun.jpg'),color:0xfff2d6,toneMapped:false}));sun.scale.setScalar(2.5);sun.userData.id='sun';scene.add(sun);objects.sun=sun;
  const glowTexture=makeGlowTexture();textures.push(glowTexture);const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));glow.scale.set(15,15,1);scene.add(glow);
  const nightMap=texture('earth_night_4096.jpg'), specularMap=texture('earth_specular_2048.jpg',false);
  planets.forEach(p=>{
   const group=new THREE.Group();scene.add(group);objects[p.id]=group;
   const surface=texture(p.id==='earth'?'earth_day_4096.jpg':p.texture);
   const material=new THREE.ShaderMaterial({uniforms:{dayMap:{value:surface},nightMap:{value:nightMap},specularMap:{value:specularMap},earth:{value:p.id==='earth'?1:0},hasRings:{value:p.id==='saturn'?1:0},ringCenter:{value:new THREE.Vector3()},ringNormal:{value:new THREE.Vector3(-Math.sin(parseFloat(p.tilt||'0')*Math.PI/180),Math.cos(parseFloat(p.tilt||'0')*Math.PI/180),0)},ringOuter:{value:p.size*2.5}},vertexShader:vertex,fragmentShader:planetFragment});
   if(['jupiter','saturn','mars'].includes(p.id))detailTargets[p.id]={material,base:surface,file:p.id+'_4k.jpg'};
   const labelTexture=makeLabel(p.name);textures.push(labelTexture);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture,transparent:true,depthWrite:false}));label.scale.set(3.0,.75,1);label.position.set(1.0,p.size+.55,0);group.add(label);group.userData.label=label;
   const tilted=new THREE.Group();tilted.rotation.z=parseFloat(p.tilt||'0')*Math.PI/180;group.add(tilted);
   const mesh=new THREE.Mesh(sphere,material);mesh.scale.setScalar(p.size);mesh.userData.id=p.id;tilted.add(mesh);group.userData.mesh=mesh;
   if(p.id==='earth'){
    const cloudMat=new THREE.MeshLambertMaterial({map:texture('earth_clouds_1024.png'),transparent:true,opacity:.75,depthWrite:false});
    const clouds=new THREE.Mesh(sphere,cloudMat);clouds.scale.setScalar(p.size*1.012);tilted.add(clouds);group.userData.clouds=clouds;
   }
   const atmosphereStyles={earth:['#468fd6',.62,1.055],venus:['#d9a75e',.27,1.035],mars:['#d7a37b',.16,1.025],jupiter:['#c9a687',.15,1.025],saturn:['#d7bb89',.15,1.025],uranus:['#70c0c5',.2,1.035],neptune:['#648ddf',.2,1.035]};
   if(atmosphereStyles[p.id]){const [color,strength,scale]=atmosphereStyles[p.id];const atmos=new THREE.Mesh(sphere,new THREE.ShaderMaterial({uniforms:{hazeColor:{value:new THREE.Color(color)},hazeStrength:{value:strength}},vertexShader:atmosphereVertex,fragmentShader:atmosphereFragment,transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));atmos.scale.setScalar(p.size*scale);group.add(atmos);group.userData.atmos=atmos;}
   if(p.id==='saturn'){
    // Rings and mutual shadows are illustrative approximations, not an optical-depth measurement.
    const ring=new THREE.Mesh(new THREE.PlaneGeometry(p.size*5.0,p.size*5.0),makeRingMaterial(p.size));ring.rotation.x=-Math.PI/2;tilted.add(ring);group.userData.ring=ring;
   }
   const points=orbitalPath(p,state.current.date||new Date()).map(point=>new THREE.Vector3(...point));
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x6f91a4,transparent:true,opacity:.24}));scene.add(line);group.userData.orbit=line;
  });
  const detailController=createDetailTextureController(renderer,detailTargets);
  // Pluto's system barycenter is computed by Astronomy Engine; surface orientation is approximate.
  const pluto=new THREE.Group();scene.add(pluto);objects.pluto=pluto;
  const plutoSurface=new THREE.Mesh(sphere,new THREE.ShaderMaterial({uniforms:{dayMap:{value:texture('pluto.jpg')},nightMap:{value:nightMap},specularMap:{value:specularMap},earth:{value:0},...noRingUniforms()},vertexShader:vertex,fragmentShader:planetFragment}));
  plutoSurface.scale.setScalar(.32);plutoSurface.rotation.z=119.51*Math.PI/180;plutoSurface.userData.id='pluto';pluto.add(plutoSurface);pluto.userData.mesh=plutoSurface;
  const plutoMap=makeLabel('Pluto');textures.push(plutoMap);const plutoLabel=new THREE.Sprite(new THREE.SpriteMaterial({map:plutoMap,transparent:true,depthWrite:false}));plutoLabel.scale.set(3,.75,1);plutoLabel.position.set(1,.9,0);pluto.add(plutoLabel);pluto.userData.label=plutoLabel;
  const plutoPath=[];for(let j=0;j<=80;j++){const t=new Date((state.current.date||new Date()).getTime()+90560*86400000*j/80);plutoPath.push(new THREE.Vector3(...renderPosition(plutoEclipticPosition(t))))}
  const plutoLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(plutoPath),new THREE.LineBasicMaterial({color:0x7894a4,transparent:true,opacity:.28}));scene.add(plutoLine);
  // Offline minor bodies: osculating two-body positions and deliberately generic appearance.
  for(const [id,orbit] of Object.entries(MINOR_BODIES)){
   const body=allObjects.find(o=>o.id===id),group=new THREE.Group();scene.add(group);objects[id]=group;
   const geometry=id==='ceres'?sphere:new THREE.IcosahedronGeometry(body.size,4),positions=geometry.attributes.position;
   if(id!=='ceres'){
   for(let j=0;j<positions.count;j++){
    const x=positions.getX(j),y=positions.getY(j),z=positions.getZ(j);
    const rough=(id==='eros'||id==='halley')?1+.09*Math.sin(x*37+y*23+z*19)*Math.sin(z*41-x*17):1+.025*Math.sin(x*48+y*33)*Math.sin(z*31-y*27);
    const elongation=(id==='eros'||id==='halley'||id==='haumea')?1.35:1;
    positions.setXYZ(j,x*rough*elongation,y*rough,z*rough);
   }geometry.computeVertexNormals();}
   const material=id==='ceres'?new THREE.ShaderMaterial({uniforms:{dayMap:{value:texture(body.texture)},nightMap:{value:nightMap},specularMap:{value:specularMap},earth:{value:0},...noRingUniforms()},vertexShader:vertex,fragmentShader:planetFragment}):new THREE.MeshLambertMaterial({color:body.color,flatShading:true});
   const mesh=new THREE.Mesh(geometry,material);if(id==='ceres')mesh.scale.setScalar(body.size);mesh.userData.id=id;group.add(mesh);group.userData.mesh=mesh;
   const map=makeLabel(body.name);textures.push(map);const label=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthWrite:false}));label.scale.set(3,.75,1);label.position.set(1,.9,0);group.add(label);group.userData.label=label;
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(smallBodyPath(orbit).map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color:0xa0a9ac,transparent:true,opacity:.3}));scene.add(line);group.userData.orbit=line;
  }
  // Satellite orbits use physical parent-relative vectors from Astronomy Engine;
  // display distances and radii are independently enlarged for visibility.
  for(const info of Object.values(SATELLITES)){
   const parent=objects[info.parent],body=allObjects.find(o=>o.id===info.id);
   const material=new THREE.ShaderMaterial({uniforms:{dayMap:{value:texture(body.texture)},nightMap:{value:nightMap},specularMap:{value:specularMap},earth:{value:0},...noRingUniforms()},vertexShader:vertex,fragmentShader:planetFragment});
   const moon=new THREE.Mesh(sphere,material);moon.scale.setScalar(info.size);moon.userData.id=info.id;parent.add(moon);objects[info.id]=moon;
   const map=makeLabel(info.name);textures.push(map);const label=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthWrite:false}));label.scale.set(1.5,.375,1);label.position.set(.45,info.size+.18,0);moon.add(label);label.scale.multiplyScalar(1/info.size);label.position.multiplyScalar(1/info.size);moon.userData.label=label;
   const line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x93b2c2,transparent:true,opacity:.35}));parent.add(line);moon.userData.orbit=line;
  }
  // Lazily load the selected Horizons track moon's mosaic; no fabricated offline position.
  function createSnapshotMoon(id){
   const info=LIVE_MOONS[id],body=allObjects.find(o=>o.id===id),parent=objects[info.parent];
   const material=new THREE.ShaderMaterial({uniforms:{dayMap:{value:texture(body.texture)},nightMap:{value:nightMap},specularMap:{value:specularMap},earth:{value:0},...noRingUniforms()},vertexShader:vertex,fragmentShader:planetFragment});
   const moon=new THREE.Mesh(currentSphere,material);moon.scale.setScalar(info.size);moon.userData.id=id;parent.add(moon);objects[id]=moon;return moon;
  }
  // Procedural points are illustrative, not a star catalogue.
  let seed=1827;const random=()=>((seed=(seed*16807)%2147483647)/2147483647);const positions=[],colors=[];
  for(let j=0;j<4000;j++){const r=300+random()*300,theta=random()*Math.PI*2,phi=Math.acos(2*random()-1);positions.push(r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));const brightness=.3+random()*.7;colors.push(brightness*(.82+random()*.18),brightness*(.89+random()*.11),brightness)}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));starGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({vertexColors:true,size:1.05,sizeAttenuation:false,transparent:true,opacity:.9,depthWrite:false})));
  // A sparse soft halo layer adds depth to the artificial starfield, not real sky locations.
  const flareCanvas=document.createElement('canvas');flareCanvas.width=flareCanvas.height=64;const flareContext=flareCanvas.getContext('2d'),flareGradient=flareContext.createRadialGradient(32,32,0,32,32,32);flareGradient.addColorStop(0,'rgba(255,255,255,0.95)');flareGradient.addColorStop(.12,'rgba(210,230,255,.65)');flareGradient.addColorStop(.4,'rgba(130,170,255,.1)');flareGradient.addColorStop(1,'rgba(0,0,0,0)');flareContext.fillStyle=flareGradient;flareContext.fillRect(0,0,64,64);const flareTexture=new THREE.CanvasTexture(flareCanvas);textures.push(flareTexture);
  const flareGeo=new THREE.BufferGeometry(),flarePositions=[],flareColors=[];for(let i=0;i<positions.length;i+=45){flarePositions.push(...positions.slice(i,i+3));flareColors.push(...colors.slice(i,i+3));}flareGeo.setAttribute('position',new THREE.Float32BufferAttribute(flarePositions,3));flareGeo.setAttribute('color',new THREE.Float32BufferAttribute(flareColors,3));scene.add(new THREE.Points(flareGeo,new THREE.PointsMaterial({map:flareTexture,vertexColors:true,size:6,sizeAttenuation:false,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false})));
  // Symbolic belts, not catalogue objects or measured individual asteroid positions.
  function makeBelt(count,minAU,maxAU,color){
   const coords=[];for(let j=0;j<count;j++){const a=minAU+(maxAU-minAU)*random(),theta=random()*Math.PI*2,r=3.4+Math.sqrt(a)*5;coords.push(Math.cos(theta)*r,(random()-.5)*.45,Math.sin(theta)*r)}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
   const points=new THREE.Points(geo,new THREE.PointsMaterial({color,size:1.3,sizeAttenuation:false,transparent:true,opacity:.5,depthWrite:false}));scene.add(points);return points;
  }
  const belts=[makeBelt(1400,2.2,3.2,0xb7a996),makeBelt(1900,30,50,0x869ba7)];
  // A conceptual shell, not measured density or observed individual objects. Its
  // spatial scale is deliberately independent of the planetary compression.
  const cloudGeometry=new THREE.BufferGeometry(),cloudPoints=[];
  for(let i=0;i<3500;i++){const u=random()*2-1,theta=random()*Math.PI*2,r=72+random()*26,xy=Math.sqrt(1-u*u);cloudPoints.push(r*xy*Math.cos(theta),r*u,r*xy*Math.sin(theta));}
  cloudGeometry.setAttribute('position',new THREE.Float32BufferAttribute(cloudPoints,3));
  const cloud=new THREE.Group();cloud.add(new THREE.Points(cloudGeometry,new THREE.PointsMaterial({color:0x9db7c2,size:1.4,sizeAttenuation:false,transparent:true,opacity:.42,depthWrite:false})));scene.add(cloud);objects['oort-cloud']=cloud;

  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down;
  function pointerDown(e){down=[e.clientX,e.clientY]}
  function click(e){if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects([sun,plutoSurface,...Object.keys(MINOR_BODIES).map(id=>objects[id].userData.mesh),...Object.keys(SATELLITES).map(id=>objects[id]),...Object.keys(LIVE_MOONS).map(id=>objects[id]).filter(Boolean),...planets.map(p=>objects[p.id].userData.mesh),...(objects['small-body']?[objects['small-body'].userData.mesh]:[])].filter(o=>o.visible&&o.parent?.visible!==false));if(hit.length)onSelect(hit[0].object.userData.id)}
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',click);
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)};window.addEventListener('resize',resize);const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(el);resize();
  let frame,lastSelected='',lastOverview=-1,lastQuality='',lastOrbitYear=null,lastSatUpdate=null,lastPlutoUpdate=null,lastGuideKey='',previousSmallBody=null,smallBodyOrbit=null,smallBodyLine=null,transition=0,offset=new THREE.Vector3(),target=new THREE.Vector3(),desired=new THREE.Vector3(),worldPos=new THREE.Vector3(),lastWorld=new THREE.Vector3(),lastFrame=performance.now();
  function animate(){
   frame=requestAnimationFrame(animate);const now=performance.now(),dt=Math.min(.25,(now-lastFrame)/1000);lastFrame=now;const s=state.current;if(!s.date)return;const contextual=s.settings.context||s.selected==='oort-cloud';const live=LIVE_MOONS[s.selected],snap=s.snapshot;const snapshotOk=!!(live&&snap?.id===s.selected&&snap?.day===s.date.toISOString().slice(0,10)&&Array.isArray(snap.samples));cloud.visible=s.selected==='oort-cloud';
   if(s.settings.quality!==lastQuality){lastQuality=s.settings.quality;const caps={LOW:.75,MEDIUM:1,HIGH:1.5,ULTRA:2,EXTREME:2.5};renderer.setPixelRatio(Math.min(devicePixelRatio,caps[lastQuality]||1.5));
    const seg={LOW:[24,16],MEDIUM:[40,28],HIGH:[64,44],ULTRA:[96,64],EXTREME:[128,80]}[lastQuality]||[64,44];
    if(!sphereGeometries[lastQuality])sphereGeometries[lastQuality]=new THREE.SphereGeometry(1,...seg);
    const nextSphere=sphereGeometries[lastQuality];scene.traverse(o=>{if(o.geometry===currentSphere)o.geometry=nextSphere});currentSphere=nextSphere;
    const fraction={LOW:.3,MEDIUM:.6,HIGH:1,ULTRA:1,EXTREME:1}[lastQuality]||1;starGeo.setDrawRange(0,Math.floor(4000*fraction));flareGeo.setDrawRange(0,Math.floor(flarePositions.length/3*fraction));belts.forEach(b=>b.geometry.setDrawRange(0,Math.floor(b.geometry.attributes.position.count*fraction)));cloudGeometry.setDrawRange(0,Math.floor(3500*fraction));resize()}
   scene.background=s.settings.artisticSky?skyMap:darkSky;detailController.update(s.selected,s.settings.quality);
   const days=(s.date.getTime()-EPOCH)/86400000;
   if(s.smallBody!==previousSmallBody){
    previousSmallBody=s.smallBody;
    if(objects['small-body']){const old=objects['small-body'];scene.remove(old);old.userData.mesh.geometry.dispose();old.userData.mesh.material.dispose();delete objects['small-body'];}
    if(smallBodyLine){scene.remove(smallBodyLine);smallBodyLine.geometry.dispose();smallBodyLine.material.dispose();smallBodyLine=null;}
    smallBodyOrbit=parseSmallBodyOrbit(s.smallBody);
    if(smallBodyOrbit){
     // Generic procedural shape: it is explicitly not an observed model of this object.
     const rockGeometry=new THREE.IcosahedronGeometry(.35,3),pos=rockGeometry.attributes.position;
     for(let j=0;j<pos.count;j++){const x=pos.getX(j),y=pos.getY(j),z=pos.getZ(j);const noise=1+.10*Math.sin(x*39+y*21+z*31)*Math.sin(x*13-z*27);pos.setXYZ(j,x*noise*1.12,y*noise*.80,z*noise)}rockGeometry.computeVertexNormals();
     const rock=new THREE.Mesh(rockGeometry,new THREE.MeshLambertMaterial({color:0x9c978b,flatShading:true}));rock.userData.id='small-body';
     const group=new THREE.Group();group.add(rock);group.userData.mesh=rock;scene.add(group);objects['small-body']=group;
     smallBodyLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(smallBodyPath(smallBodyOrbit).map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color:0x9bb3bd,transparent:true,opacity:.55}));scene.add(smallBodyLine);
    }
   }
   if(smallBodyOrbit&&objects['small-body']){const body=objects['small-body'];body.position.set(...renderPosition(smallBodyHeliocentricPosition(smallBodyOrbit,s.date)));body.visible=contextual||s.selected==='small-body'||s.selected==='overview';smallBodyLine.visible=s.settings.orbits&&body.visible;}
   if(s.date.getUTCFullYear()!==lastOrbitYear){lastOrbitYear=s.date.getUTCFullYear();planets.forEach(p=>{const line=objects[p.id].userData.orbit;line.geometry.dispose();line.geometry=new THREE.BufferGeometry().setFromPoints(orbitalPath(p,s.date).map(point=>new THREE.Vector3(...point)))})}
   // Isolation prevents exaggerated, compressed bodies from visually eclipsing the focused world.
   sun.visible=contextual||s.selected==='overview'||s.selected==='sun';glow.visible=sun.visible;belts.forEach(b=>{b.visible=(contextual||s.selected==='overview')&&s.settings.belts});
   planets.forEach(p=>{const obj=objects[p.id];obj.visible=contextual||s.selected==='overview'||s.selected===p.id||(SATELLITES[s.selected]?.parent===p.id)||(live?.parent===p.id)||(!objects[s.selected]&&!live&&p.id==='earth');obj.position.set(...orbitalPosition(p,s.date));if(p.id==='saturn'){obj.userData.mesh.material.uniforms.ringCenter.value.copy(obj.position);obj.userData.ring.material.uniforms.center.value.copy(obj.position)}obj.userData.mesh.rotation.y=(days*24/ROTATION_HOURS[p.id]*Math.PI*2)%(Math.PI*2);obj.userData.label.visible=s.settings.labels&&(s.selected==='overview'||(contextual&&s.selected!==p.id));obj.userData.orbit.visible=s.settings.orbits&&(contextual||s.selected==='overview'||s.selected===p.id);obj.userData.orbit.material.opacity=s.selected===p.id?.5:.18;if(obj.userData.atmos)obj.userData.atmos.visible=s.settings.atmosphere;if(obj.userData.clouds){obj.userData.clouds.rotation.y=obj.userData.mesh.rotation.y+days*.018;obj.userData.clouds.visible=s.settings.atmosphere;}});
   const second=Math.floor(s.date.getTime()/1000);if(second!==lastPlutoUpdate){lastPlutoUpdate=second;pluto.position.set(...renderPosition(plutoEclipticPosition(s.date)))}pluto.visible=contextual||s.selected==='overview'||s.selected==='pluto'||live?.parent==='pluto';plutoSurface.rotation.y=days*24/-153.2928*Math.PI*2;plutoLabel.visible=pluto.visible&&s.settings.labels&&(s.selected==='overview'||(contextual&&s.selected!=='pluto'));plutoLine.visible=s.settings.orbits&&(contextual||s.selected==='overview'||s.selected==='pluto');
   for(const [id,orbit] of Object.entries(MINOR_BODIES)){const obj=objects[id];obj.position.set(...renderPosition(smallBodyHeliocentricPosition(orbit,s.date)));obj.visible=contextual||s.selected==='overview'||s.selected===id;obj.userData.mesh.rotation.y=days*.15;obj.userData.label.visible=obj.visible&&s.settings.labels&&(s.selected==='overview'||(contextual&&s.selected!==id));obj.userData.orbit.visible=s.settings.orbits&&(contextual||s.selected==='overview'||s.selected===id);}
   const satelliteParent=SATELLITES[s.selected]?.parent||s.selected;
   const satelliteTime=Math.floor(s.date.getTime()/1000);
   if(satelliteTime!==lastSatUpdate){lastSatUpdate=satelliteTime;const physical=allSatelliteEclipticPositions(s.date);for(const info of Object.values(SATELLITES)){
    const moon=objects[info.id], position=satelliteDisplayPosition(info.id,s.date,physical[info.id]);moon.position.set(...position);
    // Tidal locking is approximate; surface prime meridians/libration are not modeled.
    moon.rotation.y=Math.atan2(-position[0],-position[2]);
   }}
   const guideKey=(contextual?'all':satelliteParent)+':'+s.date.getUTCFullYear()+':'+s.date.getUTCMonth();
   if(guideKey!==lastGuideKey){lastGuideKey=guideKey;for(const info of Object.values(SATELLITES))if(contextual||info.parent===satelliteParent){const line=objects[info.id].userData.orbit;line.geometry.dispose();line.geometry=new THREE.BufferGeometry().setFromPoints(satellitePath(info.id,s.date,64).map(v=>new THREE.Vector3(...v)));}}
   for(const info of Object.values(SATELLITES)){const moon=objects[info.id];moon.visible=(contextual||info.parent===satelliteParent)&&objects[info.parent].visible;moon.userData.orbit.visible=moon.visible&&s.settings.orbits;moon.userData.label.visible=moon.visible&&s.settings.labels&&!SATELLITES[s.selected];}
   for(const id of Object.keys(LIVE_MOONS)){if(objects[id])objects[id].visible=false;}
   if(snapshotOk){
    const position=interpolateTrack(snap.samples,s.date);if(position){const moon=objects[s.selected]||createSnapshotMoon(s.selected),[x,y,z]=position,r=Math.hypot(x,y,z),factor=live.displayDistance/r;
    moon.position.set(x*factor,z*factor,-y*factor);moon.visible=true;}
   }
   sun.rotation.y=(days/25.38*Math.PI*2)%(Math.PI*2);
   const focused=live?(snapshotOk?objects[s.selected]:objects[live.parent]):objects[s.selected]||objects.earth;
   const portraitFit=s.cinematic?Math.max(1,(s.selected==='saturn'?.9:.72)/(el.clientWidth/Math.max(el.clientHeight,1))):1;
   const focusKey=s.selected+(live?(snapshotOk?':snapshot':':parent'):'')+(s.cinematic?':cinema:'+portraitFit.toFixed(2):'');
   if(focusKey!==lastSelected||s.overview!==lastOverview){
    lastSelected=focusKey;lastOverview=s.overview;transition=1;
    if(s.selected==='overview'){offset.set(0,47,68)}else if(s.selected==='oort-cloud'){offset.set(0,85,165)}else{
     focused.getWorldPosition(worldPos);const size=s.selected==='sun'?2.5:SATELLITES[s.selected]?.size||(snapshotOk?live.size:0)|| (s.selected==='small-body'?.35:s.selected==='pluto'?.32:MINOR_BODIES[s.selected]?.a?allObjects.find(o=>o.id===s.selected).size:(planets.find(p=>p.id===s.selected)?.size||.82));
     const towardSun=new THREE.Vector3(-worldPos.x,0,-worldPos.z).normalize();if(towardSun.lengthSq()<.1)towardSun.set(1,0,0);
     const tangent=new THREE.Vector3(-towardSun.z,0,towardSun.x);
     const framing=(s.selected==='saturn'?1.24:1)*(s.cinematic?(s.selected==='saturn'?1.12:.85):1)*portraitFit;offset.copy(towardSun).multiplyScalar(size*5.6*framing).addScaledVector(tangent,size*2.8*framing);offset.y=size*1.35*framing;
    }
   }
   if(transition>.001){if(s.selected==='overview')target.set(0,0,0);else focused.getWorldPosition(target);desired.copy(target).add(offset);const blend=1-Math.exp(-5*dt);controls.target.lerp(target,blend);camera.position.lerp(desired,blend);lastWorld.copy(target);transition*=1-blend;}
   else if(s.selected!=='overview'&&s.selected!=='sun'){focused.getWorldPosition(worldPos);const delta=worldPos.clone().sub(lastWorld);camera.position.add(delta);controls.target.add(delta);lastWorld.copy(worldPos)}
   controls.update();renderer.render(scene,camera);
  }
  animate();
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);resizeObserver.disconnect();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',click);controls.dispose();detailController.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())});Object.values(sphereGeometries).forEach(g=>g.dispose());textures.forEach(t=>t.dispose());renderer.dispose();el.removeChild(renderer.domElement)};
 },[]);
 return <div className="scene" ref={mount} aria-label="Interactive three dimensional solar system. Drag to rotate and scroll to zoom."/>;
}
