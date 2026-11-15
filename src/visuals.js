import * as THREE from 'three';

// Artwork, not a measured sky. Three wraps it on a camera-centered environment.
export function makeArtisticSky(loader, textures){
 const sky=loader.load('/graphics/artistic-deep-space.jpg');sky.colorSpace=THREE.SRGBColorSpace;sky.mapping=THREE.EquirectangularReflectionMapping;textures.push(sky);return sky;
}

// NASA's catalogue-based celestial panorama. It is used as a visual backdrop,
// not an aligned sky for the current date, position, or camera direction.
export function makeCatalogSky(loader,textures,maxTextureSize){
 const sky=loader.load('/graphics/nasa-deep-star-map-'+(maxTextureSize>=4096?'4k':'2k')+'.jpg');
 sky.colorSpace=THREE.SRGBColorSpace;sky.mapping=THREE.EquirectangularReflectionMapping;textures.push(sky);return sky;
}

// Swap only the focused body's optional 4K map into memory on high presets.
// A generation counter prevents stale downloads from replacing the current focus.
export function createDetailTextureController(renderer,targets,loader=new THREE.TextureLoader()){let generation=0,current=null,key='',disposed=false;
 function restore(){if(!current)return;const {material,base,detail}=current;if(material.uniforms?.dayMap)material.uniforms.dayMap.value=base;else{material.map=base;material.needsUpdate=true}detail.dispose();current=null;}
 return {
  update(id,quality){const next=['HIGH','ULTRA','EXTREME'].includes(quality)&&renderer.capabilities.maxTextureSize>=4096&&targets[id]?id:'';if(next===key)return;key=next;const request=++generation;restore();if(!next)return;const {material,base,file}=targets[next];
   loader.load('/textures/'+file,texture=>{if(disposed||request!==generation){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(material.uniforms?.dayMap)material.uniforms.dayMap.value=texture;else{material.map=texture;material.needsUpdate=true}current={material,base,detail:texture};},undefined,()=>{});
  },
  dispose(){disposed=true;generation++;restore();}
 };
}

// The ring pattern and partial shadow are an illustrative optical model. They
// depend on the actual rendered Sun direction, not a measured ring density map.
export const ringVertex=`#include <common>
 #include <logdepthbuf_pars_vertex>
 varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormalWorld;
 void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xyz;vNormalWorld=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;
 #include <logdepthbuf_vertex>
 }`;
export const ringFragment=`
 #include <logdepthbuf_pars_fragment>
 uniform vec3 center; uniform vec3 sunPosition; uniform float planetRadius; uniform float ringInner; uniform float ringGap; uniform float ringEdge;
 varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormalWorld;
 void main(){
  #include <logdepthbuf_fragment>
  float r=length(vUv-vec2(.5))*2.0;
  float edge=smoothstep(ringInner,ringInner+.03,r)*(1.0-smoothstep(ringEdge-.025,ringEdge,r));
  float gap=1.0-smoothstep(.006,.014,abs(r-ringGap));
  float bands=.72+.13*sin(r*110.0)+.075*sin(r*314.0)+.035*sin(r*710.0);
  vec3 lightDir=normalize(sunPosition-vWorld);vec3 toCenter=center-vWorld;
  float along=dot(toCenter,lightDir);float closest=length(toCenter-lightDir*along);
  float planetShadow=step(0.0,along)*(1.0-smoothstep(planetRadius*.97,planetRadius*1.04,closest));
  float illumination=(.32+.78*abs(dot(normalize(vNormalWorld),lightDir)))*(1.0-.85*planetShadow);
  vec3 color=mix(vec3(.32,.285,.24),vec3(.88,.79,.64),bands)*illumination;
  gl_FragColor=vec4(color,edge*(1.0-gap*.95)*(.58+.27*bands));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`;
export function makeRingMaterial(radius,inner=.46,gap=.82,edge=.985){return new THREE.ShaderMaterial({uniforms:{center:{value:new THREE.Vector3()},sunPosition:{value:new THREE.Vector3()},planetRadius:{value:radius},ringInner:{value:inner},ringGap:{value:gap},ringEdge:{value:edge}},vertexShader:ringVertex,fragmentShader:ringFragment,transparent:true,side:THREE.DoubleSide,depthWrite:false});}

// Soft point sprite used for symbolic particles; this is not a particle image or
// an observation. Reuse one texture per scene and dispose it at scene teardown.
export function makeSoftParticleTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
 const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);
 gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.12,'rgba(255,255,255,.88)');gradient.addColorStop(.38,'rgba(255,255,255,.21)');gradient.addColorStop(1,'rgba(255,255,255,0)');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(canvas);
}

// Shared atmosphere: a symbolic sunlit limb, with its light position in the
// same scene-relative coordinates as worldPosition (important in physical view).
export const atmosphereVertex=`#include <common>
 #include <logdepthbuf_pars_vertex>
 varying vec3 vNormal;varying vec3 vView;varying vec3 vWorld;
 void main(){vNormal=normalize(mat3(modelMatrix)*normal);vWorld=(modelMatrix*vec4(position,1.0)).xyz;vView=normalize(cameraPosition-vWorld);gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.0);
 #include <logdepthbuf_vertex>
 }`;
export const atmosphereFragment=`#include <logdepthbuf_pars_fragment>
 varying vec3 vNormal;varying vec3 vView;varying vec3 vWorld;uniform vec3 hazeColor;uniform vec3 sunPosition;uniform float hazeStrength;
 void main(){
 #include <logdepthbuf_fragment>
 float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),2.5);float sunlit=smoothstep(-.5,.35,dot(normalize(vNormal),normalize(sunPosition-vWorld)));vec3 twilight=mix(hazeColor*.45,hazeColor,sunlit)+vec3(.12,.045,.015)*(1.0-sunlit)*sunlit;gl_FragColor=vec4(twilight,rim*(.08+hazeStrength*sunlit));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
export const ATMOSPHERES={earth:['#468fd6',.62,1.055],venus:['#d9a75e',.27,1.035],mars:['#d7a37b',.16,1.025],jupiter:['#c9a687',.15,1.025],saturn:['#d7bb89',.15,1.025],uranus:['#70c0c5',.2,1.035],neptune:['#648ddf',.2,1.035]};
export function makeAtmosphereMaterial(id,sunPosition=new THREE.Vector3()){
 const [color,strength]=ATMOSPHERES[id];return new THREE.ShaderMaterial({uniforms:{hazeColor:{value:new THREE.Color(color)},hazeStrength:{value:strength},sunPosition:{value:sunPosition}},vertexShader:atmosphereVertex,fragmentShader:atmosphereFragment,transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false});
}

// Shared textured surface shader. Scene-relative Sun position avoids broken lighting
// when physical-scale rendering moves the world origin to the focused object.
export const surfaceVertex = `
 #include <common>
 #include <logdepthbuf_pars_vertex>
 varying vec2 vUv;
 varying vec3 vWorldNormal;
 varying vec3 vWorldPosition;
 void main() {
   vUv = uv;
   vWorldNormal = normalize(mat3(modelMatrix) * normal);
   vec4 world = modelMatrix * vec4(position, 1.0);
   vWorldPosition = world.xyz;
   gl_Position = projectionMatrix * viewMatrix * world;
   #include <logdepthbuf_vertex>
 }`;
export const surfaceFragment = `
 #include <logdepthbuf_pars_fragment>
 uniform vec3 sunPosition;
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
   #include <logdepthbuf_fragment>
   vec3 normal = normalize(vWorldNormal);
   vec3 lightDir = normalize(sunPosition-vWorldPosition);
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
   float diffuse = max(sun,0.0);
   vec3 viewDirection = normalize(cameraPosition-vWorldPosition);
   float limb=pow(1.0-max(dot(normal,viewDirection),0.0),3.0);
   vec3 color = surface * (0.025 + 1.22 * diffuse*(1.0-ringShade));
   color += surface * limb * daylight * .055;
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


// A static, illustrative corona; rays are artistic and not solar observations.
export function makeCoronaTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');
 const g=ctx.createRadialGradient(128,128,4,128,128,128);g.addColorStop(0,'rgba(255,241,208,.9)');g.addColorStop(.14,'rgba(255,194,116,.45)');g.addColorStop(.38,'rgba(246,139,57,.11)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
 let seed=23191;const rnd=()=>((seed=seed*16807%2147483647)/2147483647);ctx.globalCompositeOperation='lighter';
 for(let i=0;i<48;i++){const angle=i*Math.PI*2/48+(rnd()-.5)*.06,length=38+rnd()*79,width=.4+rnd()*2;const x=128+Math.cos(angle)*length,y=128+Math.sin(angle)*length;const ray=ctx.createLinearGradient(128,128,x,y);ray.addColorStop(0,'rgba(255,211,149,.07)');ray.addColorStop(.35,'rgba(255,181,96,.045)');ray.addColorStop(1,'rgba(255,160,75,0)');ctx.strokeStyle=ray;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(128,128);ctx.lineTo(x,y);ctx.stroke();}
 return new THREE.CanvasTexture(canvas);
}
