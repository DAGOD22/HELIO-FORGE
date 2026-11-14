import * as THREE from 'three';

// Artwork, not a measured sky. Three wraps it on a camera-centered environment.
export function makeArtisticSky(loader, textures){
 const sky=loader.load('/graphics/artistic-deep-space.jpg');sky.colorSpace=THREE.SRGBColorSpace;sky.mapping=THREE.EquirectangularReflectionMapping;textures.push(sky);return sky;
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
export const ringVertex=`varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormalWorld;
 void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xyz;vNormalWorld=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`;
export const ringFragment=`
 uniform vec3 center; uniform vec3 sunPosition; uniform float planetRadius; uniform float ringInner; uniform float ringGap; uniform float ringEdge;
 varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormalWorld;
 void main(){
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
