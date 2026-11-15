import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {visualConfiguration} from './missionVisualModel';
import {makeConceptSpacecraft} from './missionSpacecraft';
import {surfaceVertex,surfaceFragment} from './visuals';
import {Crosshair,Pause,Play,RotateCcw,RotateCw,Satellite,ZoomIn,ZoomOut,ArrowUp,ArrowDown} from 'lucide-react';

// This is an artistic concept visualization: spacecraft proportions, orbit,
// apparent speed, orientation and sunlight are not simulated flight dynamics.
function disposeTree(root){const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(object=>{if(object.isInstancedMesh)object.dispose();if(object.geometry)geometries.add(object.geometry);if(object.material)for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material)});for(const material of materials){for(const value of Object.values(material)){if(value?.isTexture)textures.add(value)}for(const uniform of Object.values(material.uniforms||{})){if(uniform.value?.isTexture)textures.add(uniform.value)}}geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}
function createScene(container,mode,initialDesign,onUnavailable){
 let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});}catch{return null}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.className='mission-visual-canvas';container.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x06131e);
 const camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(0,1.0,12.8);camera.lookAt(0,0,0);
 scene.add(new THREE.HemisphereLight(0xa5d9ec,0x19202c,1.6));const sun=new THREE.DirectionalLight(0xffe4bb,3.2);sun.position.set(-4,4,7);scene.add(sun);const rimLight=new THREE.DirectionalLight(0x75c9ef,1.5);rimLight.position.set(5,-2,-6);scene.add(rimLight);
 let seed=12873;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const positions=[];for(let i=0;i<450;i++){positions.push((rand()-.5)*35,(rand()-.5)*22,-8-rand()*10)}
 const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xb2d7e0,size:.027,transparent:true,opacity:.7,depthWrite:false}));scene.add(stars);
 const planetRoot=new THREE.Group();scene.add(planetRoot);planetRoot.position.set(mode==='assembly'?0:-.35,mode==='assembly'?-4.2:-.1,mode==='assembly'?-4:0);
 const earthRadius=mode==='assembly'?3.8:2;
 // Static Earth imagery with a stylised day/night terminator; not live Earth.
 const solid=(r,g,b)=>{const t=new THREE.DataTexture(new Uint8Array([r,g,b,255]),1,1,THREE.RGBAFormat);t.needsUpdate=true;return t};
 const earthUniforms={dayMap:{value:solid(70,120,138)},nightMap:{value:solid(0,0,0)},specularMap:{value:solid(0,0,0)},earth:{value:1},sunPosition:{value:new THREE.Vector3(-80,80,140)},hasRings:{value:0},ringCenter:{value:new THREE.Vector3()},ringNormal:{value:new THREE.Vector3(0,1,0)},ringOuter:{value:1}};
 const globe=new THREE.Mesh(new THREE.SphereGeometry(earthRadius,64,48),new THREE.ShaderMaterial({uniforms:earthUniforms,vertexShader:surfaceVertex,fragmentShader:surfaceFragment}));planetRoot.add(globe);
 const atmo=new THREE.Mesh(new THREE.SphereGeometry(mode==='assembly'?3.88:2.08,48,32),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{},vertexShader:'varying vec3 vN; varying vec3 vV; void main(){vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec3 vN; varying vec3 vV; void main(){float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),2.5); gl_FragColor=vec4(0.20,0.68,0.83,f*0.7);}' }));planetRoot.add(atmo);
 const cloudMat=new THREE.MeshLambertMaterial({transparent:true,opacity:.38,depthWrite:false});
 const clouds=new THREE.Mesh(new THREE.SphereGeometry(earthRadius*1.012,48,32),cloudMat);clouds.visible=false;planetRoot.add(clouds);
 let disposed=false,dirty=true;
 const source=renderer.capabilities.maxTextureSize>=4096?'/textures/earth_blue_marble_4k.jpg':'/textures/earth.jpg';
 const loader=new THREE.TextureLoader();
 function loadEarthMap(url,key,color){loader.load(url,tex=>{if(disposed){tex.dispose();return}if(color)tex.colorSpace=THREE.SRGBColorSpace;earthUniforms[key].value.dispose();earthUniforms[key].value=tex;dirty=true;requestFrame()},undefined,()=>{})}
 loadEarthMap(source,'dayMap',true);if(renderer.capabilities.maxTextureSize>=4096)loadEarthMap('/textures/earth_night_4096.jpg','nightMap',true);if(renderer.capabilities.maxTextureSize>=2048)loadEarthMap('/textures/earth_specular_2048.jpg','specularMap',false);
 loader.load('/textures/earth_clouds_1024.png',tex=>{if(disposed){tex.dispose();return}tex.colorSpace=THREE.SRGBColorSpace;cloudMat.map=tex;cloudMat.needsUpdate=true;clouds.visible=true;dirty=true;requestFrame()},undefined,()=>{});
 // A soft procedural sun glow and stars are decorative, not an aligned sky.
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const gc=glowCanvas.getContext('2d');const grad=gc.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(255,231,193,.85)');grad.addColorStop(.15,'rgba(255,189,119,.28)');grad.addColorStop(1,'rgba(255,172,103,0)');gc.fillStyle=grad;gc.fillRect(0,0,128,128);const glowTexture=new THREE.CanvasTexture(glowCanvas);const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.55}));glow.position.set(5,4,-6);glow.scale.set(5,5,1);scene.add(glow);
 const craftAnchor=new THREE.Group();scene.add(craftAnchor);
 const orbitRoot=new THREE.Group();scene.add(orbitRoot);orbitRoot.position.x=mode==='flight'?-.35:0;orbitRoot.rotation.x=.42;orbitRoot.rotation.z=visualConfiguration(initialDesign).orbitTilt;
 let trail=null;
 if(mode==='flight'){
  const points=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*2.9,Math.sin(a)*2.9,0))}
  const ring=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x6cbdb3,transparent:true,opacity:.6}));orbitRoot.add(ring);
  const trailGeo=new THREE.BufferGeometry();trailGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(48*3),3));const colors=new Float32Array(48*3);for(let i=0;i<48;i++){const t=i/47;colors[i*3]=.08+t*.43;colors[i*3+1]=.18+t*.68;colors[i*3+2]=.22+t*.56}trailGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));trail=new THREE.Line(trailGeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.9,depthWrite:false}));scene.add(trail);
  // Sparse guide points are decorative, not ground tracks or sampled telemetry.
  const dots=[];for(let i=0;i<48;i++){const a=i/48*Math.PI*2;dots.push(Math.cos(a)*2.9,Math.sin(a)*2.9,0)}const dotGeo=new THREE.BufferGeometry();dotGeo.setAttribute('position',new THREE.Float32BufferAttribute(dots,3));orbitRoot.add(new THREE.Points(dotGeo,new THREE.PointsMaterial({color:0xa4e6dd,size:.035,transparent:true,opacity:.55,depthWrite:false})));
 }
 let craft=null,angle=.45,turn=0,pitch=0,playing=true,visible=true,raf=0,last=0,zoom=1,transition=false,transitionTime=0,viewMode='orbit',focusField='',highlights=[];
 const orbitPoint=new THREE.Vector3(),trailPoint=new THREE.Vector3(),radial=new THREE.Vector3(),entryPoint=new THREE.Vector3(4,-4,1);
 function clearHighlights(){for(const line of highlights){line.parent?.remove(line);line.geometry.dispose();line.material.dispose()}highlights=[]}
 function highlightSystem(){
  clearHighlights();if(!craft||mode!=='assembly')return;
  const names={bus:['bus'],instrument:['sensor-aperture','multispectral-housing','spectrometer-housing'],solar:['left-array','right-array','left-body-panel','right-body-panel'],radio:['high-rate-reflector','low-rate-antenna']}[focusField]||[];
  for(const name of names){const part=craft.getObjectByName(name);if(!part?.geometry)continue;const outline=new THREE.LineSegments(new THREE.EdgesGeometry(part.geometry,30),new THREE.LineBasicMaterial({color:0x9ffff0,transparent:true,opacity:.9,depthWrite:false}));outline.renderOrder=2;part.add(outline);highlights.push(outline)}
 }
 function updateDesign(design){clearHighlights();if(craft){craftAnchor.remove(craft);disposeTree(craft)}craft=makeConceptSpacecraft(design);craftAnchor.add(craft);orbitRoot.rotation.z=visualConfiguration(design).orbitTilt;highlightSystem();dirty=true;requestFrame();}
 updateDesign(initialDesign);
 function resize(){const w=container.clientWidth||1,h=container.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=Math.max(mode==='assembly'?9.5:11.2,(mode==='assembly'?7.3:8.8)/Math.max(.5,camera.aspect))*zoom;camera.updateProjectionMatrix();dirty=true;requestFrame()}
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;if(observer)observer.observe(container);else window.addEventListener('resize',resize);resize();
 function requestFrame(){if(!disposed&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(render)}
 function render(time){raf=0;if(!visible||document.hidden){last=0;return}const dt=Math.min(.05,(time-(last||time))/1000);last=time;if(!playing&&!dirty)return;if(playing){angle+=dt*.085;globe.rotation.y+=dt*.018;clouds.rotation.y+=dt*.019;turn+=dt*.075;if(transition)transitionTime+=dt}
  if(mode==='flight'){const p=orbitPoint.set(Math.cos(angle)*2.9,Math.sin(angle)*2.9,0).applyEuler(orbitRoot.rotation);p.x-=.35;if(transition){const t=THREE.MathUtils.smoothstep(transitionTime/2,0,1);p.lerpVectors(entryPoint,p,t)}craftAnchor.position.copy(p);craft.scale.setScalar(.62);craft.rotation.set(.32+pitch,turn+.5,-.2);const attr=trail.geometry.attributes.position;for(let i=0;i<48;i++){const a=angle-(47-i)*.012;const q=trailPoint.set(Math.cos(a)*2.9,Math.sin(a)*2.9,0).applyEuler(orbitRoot.rotation);attr.setXYZ(i,q.x-.35,q.y,q.z)}attr.needsUpdate=true;trail.visible=!transition}else{craftAnchor.position.set(0,.22,0);const visibleWidth=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*Math.max(9.5,7.3/Math.max(.5,camera.aspect))*camera.aspect;craft.scale.setScalar(Math.min(2.05,visibleWidth*.86/4.4));craft.rotation.set(.22+pitch,turn+.35,-.08)}
  if(mode==='flight'&&viewMode==='craft'){
   // Follow the concept from the outward side of its illustrated orbit; this is
   // a camera composition, not spacecraft pointing or an observation geometry.
   radial.copy(craftAnchor.position).sub(planetRoot.position).normalize();camera.position.copy(craftAnchor.position).addScaledVector(radial,5.2*zoom);camera.up.set(0,0,1).applyEuler(orbitRoot.rotation);camera.lookAt(craftAnchor.position);
  }else{camera.up.set(0,1,0);camera.position.set(0,1.0,Math.max(mode==='assembly'?9.5:11.2,(mode==='assembly'?7.3:8.8)/Math.max(.5,camera.aspect))*zoom);camera.lookAt(0,0,0)}
  renderer.render(scene,camera);dirty=false;if(playing)requestFrame();
 }
 const lost=e=>{e.preventDefault();onUnavailable()};renderer.domElement.addEventListener('webglcontextlost',lost);
 const onVisibility=()=>{last=0;dirty=true;requestFrame()};document.addEventListener('visibilitychange',onVisibility);requestFrame();
 return {updateDesign,setFocus:value=>{focusField=value;highlightSystem();dirty=true;requestFrame()},setView:value=>{viewMode=value;dirty=true;requestFrame()},rotate:(delta,tilt=0)=>{turn+=delta;pitch=THREE.MathUtils.clamp(pitch+tilt,-.8,.8);dirty=true;requestFrame()},zoom:factor=>{zoom=THREE.MathUtils.clamp(zoom*factor,.72,1.5);resize()},resetView:()=>{zoom=1;turn=0;pitch=0;resize()},setTransition:value=>{transition=value;transitionTime=0;dirty=true;requestFrame()},setPlaying:value=>{playing=value;dirty=true;last=0;requestFrame()},setVisible:value=>{visible=value;dirty=true;last=0;requestFrame()},dispose(){disposed=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',onVisibility);observer?.disconnect();if(!observer)window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('webglcontextlost',lost);disposeTree(scene);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}};
}
export default function MissionVisual({design,mode='flight',launching=false,focusField=''}){
 const container=useRef(null),controller=useRef(null),latestDesign=useRef(design),drag=useRef(null);
 const [available,setAvailable]=useState(true),[retry,setRetry]=useState(0),[cameraView,setCameraView]=useState('orbit'),[playing,setPlaying]=useState(()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 latestDesign.current=design;
 useEffect(()=>{const node=container.current;let instance;try{instance=createScene(node,mode,latestDesign.current,()=>{controller.current?.setVisible(false);setAvailable(false)})}catch{setAvailable(false);return}if(!instance){setAvailable(false);return}controller.current=instance;setAvailable(true);instance.setPlaying(playing);const visibility=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>instance.setVisible(entries[0].isIntersecting),{threshold:0}):null;visibility?.observe(node);return()=>{visibility?.disconnect();controller.current=null;instance.dispose()}},[mode,retry]);
 useEffect(()=>{controller.current?.updateDesign(design)},[design.bus,design.instrument,design.radio,design.solar,design.orbit]);
 useEffect(()=>{controller.current?.setPlaying(playing)},[playing]);
 useEffect(()=>{controller.current?.setView(cameraView)},[cameraView,mode,retry]);
 useEffect(()=>{controller.current?.setFocus(focusField)},[focusField,mode,retry]);
 useEffect(()=>{controller.current?.setTransition(launching)},[launching,mode,retry]);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setPlaying(!media.matches);media.addEventListener?.('change',change);return()=>media.removeEventListener?.('change',change)},[]);
 return <div className={'mission-visual '+mode}>
  <div ref={container} className="mission-visual-stage" onPointerDown={e=>{if(!available||e.button!==0)return;drag.current={x:e.clientX,y:e.clientY,id:e.pointerId};e.currentTarget.setPointerCapture?.(e.pointerId)}} onPointerMove={e=>{if(drag.current?.id!==e.pointerId)return;controller.current?.rotate((e.clientX-drag.current.x)*.012,(e.clientY-drag.current.y)*.008);drag.current.x=e.clientX;drag.current.y=e.clientY}} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} role="img" aria-label={`Illustrative ${mode==='assembly'?'spacecraft concept':'Earth orbit concept'}, not to scale. ${visualConfiguration(design).description} ${mode==='assembly'&&['bus','instrument','solar','radio'].includes(focusField)?'Selected subsystem is highlighted. ':''}${available?'3D illustration.':'Schematic fallback.'}`}>
   {!available&&<div className="mission-visual-fallback"><div className="mc-orbit-grid"/><div className="mc-orbit-ring one"/><div className="mc-earth"/><div className="mc-spacecraft"><Satellite size={24}/></div></div>}
   <div className="mv-top"><span><i/> {available?(mode==='assembly'?'INTERACTIVE CONCEPT':cameraView==='craft'?'SPACECRAFT VISUALIZATION':'ORBIT VISUALIZATION'):'SCHEMATIC FALLBACK'}</span><span>NOT TO SCALE</span></div>
   {available&&mode==='assembly'&&['bus','instrument','solar','radio'].includes(focusField)&&<div className="mv-highlight-label" aria-hidden="true"><i/> {({bus:'BUS',instrument:'INSTRUMENT',solar:'SOLAR PANELS',radio:'RADIO'})[focusField]} HIGHLIGHTED</div>}
   <div className="mv-bottom"><span>{mode==='assembly'?'DRAG TO ROTATE · TILT':launching?'CONCEPT TRANSITION / NOT A TRAJECTORY':cameraView==='craft'?'SPACECRAFT VIEW / CONCEPT':'EARTH / 500 KM CONCEPT'}</span><span>ILLUSTRATIVE · NOT LIVE</span></div>
  </div>
  {mode==='flight'&&<div className="mv-view-select" role="group" aria-label="Mission camera"><span>CONCEPT CAMERA</span><div><button type="button" aria-pressed={cameraView==='orbit'} onClick={()=>setCameraView('orbit')} disabled={!available}>ORBIT VIEW</button><button type="button" aria-pressed={cameraView==='craft'} onClick={()=>setCameraView('craft')} disabled={!available}>SPACECRAFT VIEW</button></div></div>}
  <div className="mv-controls"><div><Satellite size={15}/><span>{mode==='assembly'?'SPACECRAFT CONCEPT':'MISSION VIEW'} <small className={!available?'mv-fallback-label':undefined}> / {available?'3D ILLUSTRATION':'SCHEMATIC FALLBACK'}</small></span></div><div className={"mv-buttons "+(!available?"unavailable":"")}><button onClick={()=>controller.current?.rotate(-.5)} disabled={!available} aria-label="Rotate spacecraft left" title="Rotate spacecraft left"><RotateCcw size={15}/></button><button onClick={()=>controller.current?.rotate(.5)} disabled={!available} aria-label="Rotate spacecraft right" title="Rotate spacecraft right"><RotateCw size={15}/></button><button onClick={()=>controller.current?.rotate(0,-.25)} disabled={!available} aria-label="Tilt spacecraft up" title="Tilt spacecraft up"><ArrowUp size={15}/></button><button onClick={()=>controller.current?.rotate(0,.25)} disabled={!available} aria-label="Tilt spacecraft down" title="Tilt spacecraft down"><ArrowDown size={15}/></button><button onClick={()=>controller.current?.zoom(.85)} disabled={!available} aria-label="Zoom in on concept" title="Zoom in"><ZoomIn size={15}/></button><button onClick={()=>controller.current?.zoom(1.18)} disabled={!available} aria-label="Zoom out on concept" title="Zoom out"><ZoomOut size={15}/></button><button onClick={()=>controller.current?.resetView()} disabled={!available} aria-label="Reset concept view" title="Reset concept view"><Crosshair size={15}/></button><button onClick={()=>setPlaying(p=>!p)} disabled={!available} aria-label={playing?'Pause visualization motion':'Play visualization motion'} title={playing?'Pause visualization motion':'Play visualization motion'}>{playing?<Pause size={15}/>:<Play size={15}/>}</button>{!available&&<button className="mv-retry" onClick={()=>setRetry(n=>n+1)} aria-label="Retry 3D visualization">RETRY</button>}</div></div>
 </div>
}
