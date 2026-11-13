import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {planets} from './data';
import {orbitalPosition} from './orbits';

export default function Scene({selected,onSelect,date,settings,overview}){
 const mount=useRef(), state=useRef({});
 useEffect(()=>{state.current.selected=selected;state.current.date=date;state.current.settings=settings;state.current.overview=overview},[selected,date,settings,overview]);
 useEffect(()=>{
  const el=mount.current, scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(40,1,.01,2000); camera.position.set(0,5,18);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;el.appendChild(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=2;controls.maxDistance=170;controls.enablePan=true;
  scene.add(new THREE.AmbientLight(0x8ba7c3,.35));const sunLight=new THREE.PointLight(0xfff3d9,120,0,0);scene.add(sunLight);
  const loader=new THREE.TextureLoader(), objects={}, disposables=[];
  function texture(file){const t=loader.load('/textures/'+file);t.colorSpace=THREE.SRGBColorSpace;disposables.push(t);return t}
  const sphere=new THREE.SphereGeometry(1,64,48);disposables.push(sphere);
  const sun=new THREE.Mesh(sphere,new THREE.MeshBasicMaterial({map:texture('Sun.jpg'),color:0xffe8bd}));sun.scale.setScalar(2.5);sun.userData.id='sun';scene.add(sun);objects.sun=sun;
  const glow=new THREE.Mesh(new THREE.SphereGeometry(2.72,32,24),new THREE.MeshBasicMaterial({color:0xffb55c,transparent:true,opacity:.07,side:THREE.BackSide}));scene.add(glow);
  planets.forEach(p=>{const group=new THREE.Group();scene.add(group);const mesh=new THREE.Mesh(sphere,new THREE.MeshStandardMaterial({map:texture(p.texture),roughness:1}));mesh.scale.setScalar(p.size);mesh.rotation.z=p.tilt?parseFloat(p.tilt)*Math.PI/180:0;mesh.userData.id=p.id;group.add(mesh);objects[p.id]=group;group.userData.mesh=mesh;
   if(p.id==='earth'){const atmos=new THREE.Mesh(sphere,new THREE.ShaderMaterial({uniforms:{},vertexShader:'varying vec3 vNormal; varying vec3 vPosition; void main(){vNormal=normalize(normalMatrix*normal); vec4 p=modelViewMatrix*vec4(position,1.); vPosition=normalize(-p.xyz); gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vNormal; varying vec3 vPosition; void main(){float intensity=pow(1.0-abs(dot(vNormal,vPosition)),3.0); gl_FragColor=vec4(0.20,0.53,1.0,intensity*0.55);}',transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));atmos.scale.setScalar(p.size*1.12);group.add(atmos);group.userData.atmos=atmos;}
   if(p.id==='saturn'){const ring=new THREE.Mesh(new THREE.RingGeometry(p.size*1.3,p.size*2.15,96),new THREE.MeshBasicMaterial({color:0xc7b798,side:THREE.DoubleSide,transparent:true,opacity:.68}));ring.rotation.x=Math.PI/2;ring.rotation.y=.3;group.add(ring)}
   const points=[];for(let j=0;j<=240;j++){const dt=new Date(Date.UTC(2000,0,1,12)+p.days*86400000*j/240);points.push(new THREE.Vector3(...orbitalPosition(p,dt)))}const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x496578,transparent:true,opacity:.28}));scene.add(line);group.userData.orbit=line;
  });
  // Procedural star field, fixed seed for stable visual appearance.
  let seed=1827;const random=()=>((seed=(seed*16807)%2147483647)/2147483647);const stars=[];for(let j=0;j<2500;j++){const r=250+random()*450,theta=random()*Math.PI*2,phi=Math.acos(2*random()-1);stars.push(r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta))}const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xc3d9ec,size:.7,sizeAttenuation:true,transparent:true,opacity:.8})));
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down;function pointerDown(e){down=[e.clientX,e.clientY]}function click(e){if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects([sun,...planets.map(p=>objects[p.id].userData.mesh)]);if(hit.length)onSelect(hit[0].object.userData.id)}renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',click);
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)};window.addEventListener('resize',resize);resize();
  let frame, lastSelected='',lastOverview=-1, target=new THREE.Vector3(), desired=new THREE.Vector3(), transition=0;
  function animate(){frame=requestAnimationFrame(animate);const s=state.current;if(!s.date)return;planets.forEach(p=>{const obj=objects[p.id];obj.position.set(...orbitalPosition(p,s.date));const rotationHours={mercury:1407.6,venus:-5832.5,earth:23.9345,mars:24.6229,jupiter:9.925,saturn:10.656,uranus:-17.24,neptune:16.11}; obj.userData.mesh.rotation.y=((s.date.getTime()-Date.UTC(2000,0,1,12))/3600000/rotationHours[p.id]*Math.PI*2)%(Math.PI*2);obj.userData.orbit.visible=s.settings.orbits;if(obj.userData.atmos)obj.userData.atmos.visible=s.settings.atmosphere});sun.rotation.y=((s.date.getTime()-Date.UTC(2000,0,1,12))/86400000/25.38*Math.PI*2)%(Math.PI*2);
   if(s.selected!==lastSelected||s.overview!==lastOverview){lastSelected=s.selected;lastOverview=s.overview;const obj=objects[s.selected]||objects.earth;target.copy(obj.position);const size=s.selected==='sun'?2.5:(planets.find(p=>p.id===s.selected)?.size||.82);if(s.overview>0&&s.selected==='overview'){target.set(0,0,0);desired.set(0,45,65)}else{desired.copy(target).add(new THREE.Vector3(size*1.2,size*.65,size*5.4))}transition=1;}
   if(transition>.001){controls.target.lerp(target,.055);camera.position.lerp(desired,.055);transition*=.94}else if(objects[s.selected]&&s.selected!=='sun'){const obj=objects[s.selected];const delta=obj.position.clone().sub(controls.target);camera.position.add(delta);controls.target.copy(obj.position)}controls.update();renderer.render(scene,camera)}animate();
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',click);controls.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}});disposables.forEach(d=>d.dispose());renderer.dispose();el.removeChild(renderer.domElement)};
 },[]);
 return <div className="scene" ref={mount} aria-label="Interactive three dimensional solar system. Drag to rotate and scroll to zoom."/>;
}
