import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {zoomCamera} from './cameraNavigation';
import {createCinematicEffects} from './cinematicEffects';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {hasDrawableOrbit,schematicOrbitRadius} from './exoplanets';
import {makeSoftParticleTexture,makeCoronaTexture} from './visuals';
import {makePlanetTexture} from './artworkTexture';
import {starPalette,artworkSeed} from './objectArtwork';

// Circular, co-planar orbits with compressed spacing and arbitrary phases. No
// orbital epoch, planet surface, physical size, illumination, or present position is inferred.
function glowMap(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.12,'rgba(255,255,255,.8)');g.addColorStop(.38,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}
function textMap(text){const c=document.createElement('canvas');c.width=320;c.height=80;const x=c.getContext('2d');x.fillStyle='rgba(5,20,29,.82)';x.fillRect(0,5,320,70);x.font='500 30px sans-serif';x.fillStyle='#d8f1f3';x.fillText(text,12,52,296);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture}
export default function ExoplanetScene({hostStar,rows,days,selected,onSelect,view,navigationRef,effects}){
 const mount=useRef(),state=useRef({hostStar,rows,days,selected,onSelect,view,effects});
 useEffect(()=>{state.current={hostStar,rows,days,selected,onSelect,view,effects}},[hostStar,rows,days,selected,onSelect,view,effects]);
 useEffect(()=>{
  const el=mount.current,scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,250),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  scene.background=new THREE.Color('#0a1620');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
  const post=createCinematicEffects(renderer,scene,camera,{strength:.55,threshold:.65,radius:.5});
  camera.position.set(0,29,35);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=8;controls.maxDistance=90;
  const sphere=new THREE.SphereGeometry(1,40,28),glowTexture=glowMap(),particleTexture=makeSoftParticleTexture(),coronaTexture=makeCoronaTexture(),star=new THREE.Mesh(sphere,new THREE.ShaderMaterial({
   // Procedural stellar texture is a generic symbol, not the host's observed surface.
   uniforms:{edge:{value:new THREE.Color(starPalette(hostStar).edge)},middle:{value:new THREE.Color(starPalette(hostStar).middle)},seed:{value:artworkSeed(hostStar?.id)%100}},
   vertexShader:`varying vec3 vNormal;void main(){vNormal=normalize(normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
   fragmentShader:`uniform vec3 edge;uniform vec3 middle;uniform float seed;varying vec3 vNormal;void main(){vec3 n=normalize(vNormal);float bands=sin(n.x*21.0+sin(n.y*17.0+seed))*sin(n.z*19.0-n.y*13.0+seed);float t=clamp(.65+bands*.16,0.0,1.0);gl_FragColor=vec4(mix(edge,middle,t),1.0);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }`}));star.scale.setScalar(.65);scene.add(star);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:coronaTexture,color:0xffca84,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false}));glow.scale.set(5.5,5.5,1);scene.add(glow);scene.add(new THREE.AmbientLight(0x99b3c7,.5));scene.add(new THREE.PointLight(0xffe5bd,2,0,0));
  // Faint artificial background points are not a sky map.
  let seed=4063;const random=()=>((seed=seed*16807%2147483647)/2147483647),background=[];for(let i=0;i<450;i++){const y=random()*2-1,a=random()*Math.PI*2,r=120,q=Math.sqrt(1-y*y);background.push(r*q*Math.cos(a),r*y,r*q*Math.sin(a))}const bgGeo=new THREE.BufferGeometry();bgGeo.setAttribute('position',new THREE.Float32BufferAttribute(background,3));const bgMat=new THREE.PointsMaterial({map:particleTexture,color:0xb3cde1,size:2.8,sizeAttenuation:false,transparent:true,opacity:.6,depthWrite:false});scene.add(new THREE.Points(bgGeo,bgMat));
  const group=new THREE.Group();scene.add(group);let loaded=null,points=[],frame,lastPos,lastView=0,lastHost=null;
  // Shared glowTexture is disposed once at teardown, not during group rebuild.
  function clearSafe(){group.traverse(o=>{if(o.geometry&&o.geometry!==sphere)o.geometry.dispose();if(o.material){if(o.material.map&&o.material.map!==glowTexture)o.material.map.dispose();o.material.dispose()}});group.clear();points=[];}
  // Rebuild keeps the shared glow texture alive while disposing old labels.
  function updateRows(rows){clearSafe();const drawable=rows.filter(hasDrawableOrbit),values=drawable.map(x=>x.pl_orbsmax),min=Math.min(...values),max=Math.max(...values);
   drawable.forEach((row,i)=>{const radius=schematicOrbitRadius(row.pl_orbsmax,min,max),vertices=[];for(let k=0;k<=192;k++){const theta=k*Math.PI*2/192;vertices.push(new THREE.Vector3(radius*Math.cos(theta),0,radius*Math.sin(theta)))}const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(vertices),new THREE.LineBasicMaterial({color:0x7699a9,transparent:true,opacity:.28}));group.add(line);const mesh=new THREE.Mesh(sphere,new THREE.MeshPhongMaterial({map:makePlanetTexture(row.pl_name),color:0xffffff,specular:0x34434a,shininess:12}));mesh.userData.name=row.pl_name;group.add(mesh);const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0x8cd5e6,transparent:true,opacity:.38,blending:THREE.AdditiveBlending,depthWrite:false}));halo.scale.set(1.35,1.35,1);group.add(halo);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:textMap(row.pl_name),transparent:true,depthWrite:false}));label.scale.set(4.5,1.125,1);group.add(label);points.push({row,mesh,halo,label,line,radius,phase:i*2*Math.PI/Math.max(1,drawable.length)});});
  }
  const resize=()=>{if(!el.clientWidth||!el.clientHeight)return;camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight);post.resize(el.clientWidth,el.clientHeight)};window.addEventListener('resize',resize);const observer=new ResizeObserver(resize);observer.observe(el);resize();
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();function down(e){lastPos=[e.clientX,e.clientY]}function up(e){if(!lastPos||Math.hypot(e.clientX-lastPos[0],e.clientY-lastPos[1])>5)return;const box=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(points.map(p=>p.mesh))[0];if(hit)state.current.onSelect(hit.object.userData.name)}renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
  const navigation={zoom:factor=>zoomCamera(controls,factor)};navigationRef.current=navigation;
  function animate(){frame=requestAnimationFrame(animate);const s=state.current;if(lastHost!==s.hostStar){lastHost=s.hostStar;const color=starPalette(lastHost);star.material.uniforms.edge.value.set(color.edge);star.material.uniforms.middle.value.set(color.middle);star.material.uniforms.seed.value=artworkSeed(lastHost?.id)%100;glow.material.color.set(color.middle)}if(loaded!==s.rows){loaded=s.rows;updateRows(loaded)}if(s.view&&s.view.request!==lastView){lastView=s.view.request;controls.target.set(0,0,0);if(s.view.mode==='top')camera.position.set(.01,48,.01);else camera.position.set(0,29,35);controls.update()}
   for(const p of points){const period=p.row.pl_orbper,phase=p.phase+(Number.isFinite(period)&&period>0&&p.row.pl_orbperlim===0?s.days/period*2*Math.PI:0),isSelected=p.row.pl_name===s.selected;p.mesh.position.set(p.radius*Math.cos(phase),0,p.radius*Math.sin(phase));p.mesh.scale.setScalar(isSelected ? .31 : .21);p.mesh.material.color.set(isSelected?0xffffff:0xd3dce0);p.halo.position.copy(p.mesh.position);p.halo.visible=isSelected;p.label.position.copy(p.mesh.position).add(new THREE.Vector3(0,1.15,0));p.label.visible=isSelected;p.line.material.opacity=isSelected ? .72 : .28;p.line.material.color.set(isSelected?0x9ed5df:0x7699a9)}controls.update();post.render(s.effects);}
  animate();return()=>{if(navigationRef.current===navigation)navigationRef.current=null;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);observer.disconnect();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);controls.dispose();post.dispose();clearSafe();sphere.dispose();star.material.dispose();glow.material.dispose();glowTexture.dispose();particleTexture.dispose();coronaTexture.dispose();bgGeo.dispose();bgMat.dispose();renderer.dispose();el.removeChild(renderer.domElement)};
 },[]);
 return <div ref={mount} className="exo-scene" aria-label="Interactive schematic planetary orbits. Drag to rotate and scroll to zoom."/>;
}
