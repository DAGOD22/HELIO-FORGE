import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {planets} from './data';
import {orbitalPosition, orbitalPath, illustrativeMoonPosition, parseSmallBodyOrbit, smallBodyHeliocentricPosition, smallBodyPath, renderPosition} from './orbits';

const ROTATION_HOURS = {mercury:1407.6, venus:-5832.5, earth:23.9345, mars:24.6229, jupiter:9.925, saturn:10.656, uranus:-17.24, neptune:16.11};
const EPOCH = Date.UTC(2000,0,1,12);
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
   vec3 color = surface * (0.025 + 1.22 * max(sun, 0.0));
   if (earth > 0.5) {
     vec3 night = texture2D(nightMap, vUv).rgb;
     color += night * (1.0 - daylight) * 1.3;
     vec3 viewDir = normalize(cameraPosition - vWorldPosition);
     vec3 halfDir = normalize(lightDir + viewDir);
     float ocean = texture2D(specularMap, vUv).r;
     color += vec3(0.55, 0.69, 0.77) * pow(max(dot(normal, halfDir), 0.0), 55.0) * ocean * daylight * 0.55;
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
 void main() {
   float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.5);
   float sunlit = smoothstep(-0.35, 0.55, dot(normalize(vNormal), normalize(-vWorld)));
   gl_FragColor = vec4(vec3(0.18, 0.46, 0.85), rim * (0.05 + 0.24 * sunlit));
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

export default function Scene({selected,onSelect,date,settings,overview,smallBody}) {
 const mount=useRef(), state=useRef({});
 useEffect(()=>{state.current={selected,date,settings,overview,smallBody}},[selected,date,settings,overview,smallBody]);
 useEffect(()=>{
  const el=mount.current, scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(36,1,.01,2000);
  camera.position.set(0,5,18);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;el.appendChild(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=.35;controls.maxDistance=170;controls.enablePan=true;
  scene.add(new THREE.AmbientLight(0x8197af,.42));scene.add(new THREE.PointLight(0xfff3df,1.4,0,0));
  const loader=new THREE.TextureLoader(), objects={}, textures=[];
  function texture(file, color=true){const t=loader.load('/textures/'+file);if(color)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.push(t);return t}
  const sphere=new THREE.SphereGeometry(1,96,64);
  const sun=new THREE.Mesh(sphere,new THREE.MeshBasicMaterial({map:texture('Sun.jpg'),color:0xfff2d6,toneMapped:false}));sun.scale.setScalar(2.5);sun.userData.id='sun';scene.add(sun);objects.sun=sun;
  const glowTexture=makeGlowTexture();textures.push(glowTexture);const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));glow.scale.set(15,15,1);scene.add(glow);
  const nightMap=texture('earth_night_4096.jpg'), specularMap=texture('earth_specular_2048.jpg',false);
  planets.forEach(p=>{
   const group=new THREE.Group();scene.add(group);objects[p.id]=group;
   const surface=texture(p.id==='earth'?'earth_day_4096.jpg':p.texture);
   const material=new THREE.ShaderMaterial({uniforms:{dayMap:{value:surface},nightMap:{value:nightMap},specularMap:{value:specularMap},earth:{value:p.id==='earth'?1:0}},vertexShader:vertex,fragmentShader:planetFragment});
   const labelTexture=makeLabel(p.name);textures.push(labelTexture);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture,transparent:true,depthWrite:false}));label.scale.set(3.0,.75,1);label.position.set(1.0,p.size+.55,0);group.add(label);group.userData.label=label;
   const tilted=new THREE.Group();tilted.rotation.z=parseFloat(p.tilt||'0')*Math.PI/180;group.add(tilted);
   const mesh=new THREE.Mesh(sphere,material);mesh.scale.setScalar(p.size);mesh.userData.id=p.id;tilted.add(mesh);group.userData.mesh=mesh;
   if(p.id==='earth'){
    const cloudMat=new THREE.MeshLambertMaterial({map:texture('earth_clouds_1024.png'),transparent:true,opacity:.75,depthWrite:false});
    const clouds=new THREE.Mesh(sphere,cloudMat);clouds.scale.setScalar(p.size*1.012);tilted.add(clouds);group.userData.clouds=clouds;
    const atmos=new THREE.Mesh(sphere,new THREE.ShaderMaterial({vertexShader:atmosphereVertex,fragmentShader:atmosphereFragment,transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));atmos.scale.setScalar(p.size*1.045);group.add(atmos);group.userData.atmos=atmos;
    const moon=new THREE.Mesh(sphere,new THREE.ShaderMaterial({uniforms:{dayMap:{value:texture('moon.jpg')},nightMap:{value:nightMap},specularMap:{value:specularMap},earth:{value:0}},vertexShader:vertex,fragmentShader:planetFragment}));moon.scale.setScalar(.223);moon.userData.id='moon';group.add(moon);objects.moon=moon;
    const moonPoints=[];for(let i=0;i<=120;i++){const a=i/120*Math.PI*2;moonPoints.push(new THREE.Vector3(Math.cos(a)*2.2,Math.sin(a)*2.2*Math.sin(5.145*Math.PI/180),Math.sin(a)*2.2*Math.cos(5.145*Math.PI/180)))}const moonOrbit=new THREE.Line(new THREE.BufferGeometry().setFromPoints(moonPoints),new THREE.LineBasicMaterial({color:0x7b9dac,transparent:true,opacity:.28}));group.add(moonOrbit);group.userData.moonOrbit=moonOrbit;
   }
   if(p.id==='saturn'){
    // Procedural rings are an illustrative rendering, not a measured optical-depth profile.
    const ring=new THREE.Mesh(new THREE.PlaneGeometry(p.size*5.0,p.size*5.0),new THREE.ShaderMaterial({vertexShader:'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 vUv;
    void main(){
      float r=length(vUv-vec2(0.5))*2.0;
      float edge=smoothstep(0.46,0.48,r)*(1.0-smoothstep(0.96,0.98,r));
      float gap=1.0-smoothstep(0.008,0.017,abs(r-0.82));
      float bands=0.76+0.12*sin(r*100.0)+0.07*sin(r*341.0)+0.04*sin(r*803.0);
      vec3 color=mix(vec3(0.35,0.32,0.27),vec3(0.76,0.71,0.61),bands);
      gl_FragColor=vec4(color,edge*(1.0-gap*0.94)*0.9);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,transparent:true,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;tilted.add(ring);
   }
   const points=orbitalPath(p,state.current.date||new Date()).map(point=>new THREE.Vector3(...point));
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x6f91a4,transparent:true,opacity:.24}));scene.add(line);group.userData.orbit=line;
  });
  // Procedural points are illustrative, not a star catalogue.
  let seed=1827;const random=()=>((seed=(seed*16807)%2147483647)/2147483647);const positions=[],colors=[];
  for(let j=0;j<4000;j++){const r=300+random()*300,theta=random()*Math.PI*2,phi=Math.acos(2*random()-1);positions.push(r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));const brightness=.3+random()*.7;colors.push(brightness*(.82+random()*.18),brightness*(.89+random()*.11),brightness)}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));starGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({vertexColors:true,size:1.05,sizeAttenuation:false,transparent:true,opacity:.9,depthWrite:false})));
  // Symbolic belts, not catalogue objects or measured individual asteroid positions.
  function makeBelt(count,minAU,maxAU,color){
   const coords=[];for(let j=0;j<count;j++){const a=minAU+(maxAU-minAU)*random(),theta=random()*Math.PI*2,r=3.4+Math.sqrt(a)*5;coords.push(Math.cos(theta)*r,(random()-.5)*.45,Math.sin(theta)*r)}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
   const points=new THREE.Points(geo,new THREE.PointsMaterial({color,size:1.3,sizeAttenuation:false,transparent:true,opacity:.5,depthWrite:false}));scene.add(points);return points;
  }
  const belts=[makeBelt(1400,2.2,3.2,0xb7a996),makeBelt(1900,30,50,0x869ba7)];
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down;
  function pointerDown(e){down=[e.clientX,e.clientY]}
  function click(e){if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects([sun,objects.moon,...planets.map(p=>objects[p.id].userData.mesh),...(objects['small-body']?[objects['small-body'].userData.mesh]:[])].filter(o=>o.visible&&o.parent?.visible!==false));if(hit.length)onSelect(hit[0].object.userData.id)}
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',click);
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)};window.addEventListener('resize',resize);resize();
  let frame,lastSelected='',lastOverview=-1,lastQuality='',lastOrbitYear=null,previousSmallBody=null,smallBodyOrbit=null,smallBodyLine=null,transition=0,offset=new THREE.Vector3(),target=new THREE.Vector3(),desired=new THREE.Vector3(),worldPos=new THREE.Vector3(),lastWorld=new THREE.Vector3(),lastFrame=performance.now();
  function animate(){
   frame=requestAnimationFrame(animate);const now=performance.now(),dt=Math.min(.25,(now-lastFrame)/1000);lastFrame=now;const s=state.current;if(!s.date)return;
   if(s.settings.quality!==lastQuality){lastQuality=s.settings.quality;const caps={LOW:.75,MEDIUM:1,HIGH:1.5,ULTRA:2,EXTREME:2.5};renderer.setPixelRatio(Math.min(devicePixelRatio,caps[lastQuality]||1.5));resize()}
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
   if(smallBodyOrbit&&objects['small-body']){const body=objects['small-body'];body.position.set(...renderPosition(smallBodyHeliocentricPosition(smallBodyOrbit,s.date)));body.visible=s.selected==='small-body'||s.selected==='overview';smallBodyLine.visible=s.settings.orbits&&body.visible;}
   if(s.date.getUTCFullYear()!==lastOrbitYear){lastOrbitYear=s.date.getUTCFullYear();planets.forEach(p=>{const line=objects[p.id].userData.orbit;line.geometry.dispose();line.geometry=new THREE.BufferGeometry().setFromPoints(orbitalPath(p,s.date).map(point=>new THREE.Vector3(...point)))})}
   // Isolation prevents exaggerated, compressed bodies from visually eclipsing the focused world.
   sun.visible=s.selected==='overview'||s.selected==='sun';glow.visible=sun.visible;belts.forEach(b=>{b.visible=s.selected==='overview'&&s.settings.belts});
   planets.forEach(p=>{const obj=objects[p.id];obj.visible=s.selected==='overview'||s.selected===p.id||(s.selected==='moon'&&p.id==='earth')||(!objects[s.selected]&&p.id==='earth');obj.position.set(...orbitalPosition(p,s.date));obj.userData.mesh.rotation.y=(days*24/ROTATION_HOURS[p.id]*Math.PI*2)%(Math.PI*2);obj.userData.label.visible=s.settings.labels&&s.selected==='overview';obj.userData.orbit.visible=s.settings.orbits&&(s.selected==='overview'||s.selected===p.id);obj.userData.orbit.material.opacity=s.selected===p.id?.5:.18;if(obj.userData.atmos)obj.userData.atmos.visible=s.settings.atmosphere;if(obj.userData.clouds){obj.userData.clouds.rotation.y=obj.userData.mesh.rotation.y+days*.018;obj.userData.clouds.visible=s.settings.atmosphere;obj.userData.moonOrbit.visible=s.settings.orbits&&(s.selected==='earth'||s.selected==='moon');}});
   // The Moon's period and inclination are approximate; phase is illustrative, not an ephemeris.
   const ma=days/27.321661*Math.PI*2;objects.moon.position.set(...illustrativeMoonPosition(s.date));objects.moon.rotation.y=-ma;sun.rotation.y=(days/25.38*Math.PI*2)%(Math.PI*2);
   const focused=objects[s.selected]||objects.earth;
   if(s.selected!==lastSelected||s.overview!==lastOverview){
    lastSelected=s.selected;lastOverview=s.overview;transition=1;
    if(s.selected==='overview'){offset.set(0,47,68)}else{
     focused.getWorldPosition(worldPos);const size=s.selected==='sun'?2.5:s.selected==='moon'?.223:s.selected==='small-body'?.35:(planets.find(p=>p.id===s.selected)?.size||.82);
     const towardSun=new THREE.Vector3(-worldPos.x,0,-worldPos.z).normalize();if(towardSun.lengthSq()<.1)towardSun.set(1,0,0);
     const tangent=new THREE.Vector3(-towardSun.z,0,towardSun.x);
     offset.copy(towardSun).multiplyScalar(size*5.6).addScaledVector(tangent,size*2.8);offset.y=size*1.35;
    }
   }
   if(transition>.001){if(s.selected==='overview')target.set(0,0,0);else focused.getWorldPosition(target);desired.copy(target).add(offset);const blend=1-Math.exp(-5*dt);controls.target.lerp(target,blend);camera.position.lerp(desired,blend);lastWorld.copy(target);transition*=1-blend;}
   else if(s.selected!=='overview'&&s.selected!=='sun'){focused.getWorldPosition(worldPos);const delta=worldPos.clone().sub(lastWorld);camera.position.add(delta);controls.target.add(delta);lastWorld.copy(worldPos)}
   controls.update();renderer.render(scene,camera);
  }
  animate();
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',click);controls.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())});textures.forEach(t=>t.dispose());renderer.dispose();el.removeChild(renderer.domElement)};
 },[]);
 return <div className="scene" ref={mount} aria-label="Interactive three dimensional solar system. Drag to rotate and scroll to zoom."/>;
}
