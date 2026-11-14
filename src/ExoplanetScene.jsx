import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {hasDrawableOrbit,schematicOrbitRadius} from './exoplanets';

// Circular, co-planar orbits with compressed spacing and arbitrary phases. No
// orbital epoch, planet surface, size, illumination, or present position is inferred.
export default function ExoplanetScene({rows,days,selected,onSelect}){
 const mount=useRef(),state=useRef({rows,days,selected,onSelect});
 useEffect(()=>{state.current={rows,days,selected,onSelect}},[rows,days,selected,onSelect]);
 useEffect(()=>{
  const el=mount.current,scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,200),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
  camera.position.set(0,29,35);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=8;controls.maxDistance=90;
  const sphere=new THREE.SphereGeometry(1,24,16),star=new THREE.Mesh(sphere,new THREE.MeshBasicMaterial({color:0xffe1a3}));star.scale.setScalar(.65);scene.add(star);
  const glow=new THREE.Mesh(sphere,new THREE.MeshBasicMaterial({color:0xffc983,transparent:true,opacity:.09,depthWrite:false}));glow.scale.setScalar(1.05);scene.add(glow);
  const group=new THREE.Group();scene.add(group);let loaded=null,points=[],frame,lastPos;
  function clear(){group.traverse(o=>{if(o.geometry&&o.geometry!==sphere)o.geometry.dispose();o.material?.dispose()});group.clear();points=[];}
  function rebuild(rows){clear();const drawable=rows.filter(hasDrawableOrbit),values=drawable.map(x=>x.pl_orbsmax),min=Math.min(...values),max=Math.max(...values);
   drawable.forEach((row,i)=>{const radius=schematicOrbitRadius(row.pl_orbsmax,min,max),vertices=[];for(let k=0;k<=192;k++){const theta=k*Math.PI*2/192;vertices.push(new THREE.Vector3(radius*Math.cos(theta),0,radius*Math.sin(theta)))}const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(vertices),new THREE.LineBasicMaterial({color:0x7c9dac,transparent:true,opacity:.32}));group.add(line);
    const mesh=new THREE.Mesh(sphere,new THREE.MeshBasicMaterial({color:0xc3d9e2}));mesh.userData.name=row.pl_name;group.add(mesh);points.push({row,mesh,radius,phase:i*2*Math.PI/Math.max(1,drawable.length)});
   });
  }
  const resize=()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)};window.addEventListener('resize',resize);resize();
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();function down(e){lastPos=[e.clientX,e.clientY]}function up(e){if(!lastPos||Math.hypot(e.clientX-lastPos[0],e.clientY-lastPos[1])>5)return;const box=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(points.map(p=>p.mesh))[0];if(hit)state.current.onSelect(hit.object.userData.name)}renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
  function animate(){frame=requestAnimationFrame(animate);const s=state.current;if(loaded!==s.rows){loaded=s.rows;rebuild(loaded)}for(const p of points){const period=p.row.pl_orbper,phase=p.phase+(Number.isFinite(period)&&period>0&&p.row.pl_orbperlim===0?s.days/period*2*Math.PI:0);p.mesh.position.set(p.radius*Math.cos(phase),0,p.radius*Math.sin(phase));p.mesh.scale.setScalar(p.row.pl_name===s.selected ? .31 : .21);p.mesh.material.color.set(p.row.pl_name===s.selected?0x9ce3fa:0xc3d9e2);}controls.update();renderer.render(scene,camera);}
  animate();return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);controls.dispose();clear();sphere.dispose();star.material.dispose();glow.material.dispose();renderer.dispose();el.removeChild(renderer.domElement)};
 },[]);
 return <div ref={mount} className="exo-scene" aria-label="Interactive schematic planetary orbits. Drag to rotate and scroll to zoom."/>;
}
