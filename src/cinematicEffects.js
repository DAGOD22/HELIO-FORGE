import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';

// Bloom is a photographic/stylized effect, not measured intensity. It is created
// on demand and its blur chain is half-resolution; the scene itself remains sharp.
export function bloomDimensions(width,height,pixelRatio){return [Math.max(1,Math.round(width*pixelRatio*.5)),Math.max(1,Math.round(height*pixelRatio*.5))];}
export function createCinematicEffects(renderer,scene,camera,{strength=.5,threshold=.72,radius=.42}={}){
 let composer=null,bloom=null,output=null,failed=false,width=1,height=1;
 function resize(w,h){width=Math.max(1,w);height=Math.max(1,h);if(!composer)return;const ratio=renderer.getPixelRatio();composer.setPixelRatio(ratio);composer.setSize(width,height);bloom.setSize(...bloomDimensions(width,height,ratio));}
 function create(){
  try{composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));bloom=new UnrealBloomPass(new THREE.Vector2(1,1),strength,radius,threshold);composer.addPass(bloom);output=new OutputPass();composer.addPass(output);resize(width,height);}
  catch(error){failed=true;dispose();console.warn('Cinematic glow unavailable; using standard rendering.',error);}
 }
 function render(enabled){if(!enabled&&composer)dispose();if(enabled&&!failed&&!composer)create();if(enabled&&composer)composer.render();else renderer.render(scene,camera);}
 function dispose(){if(bloom)bloom.dispose();if(output)output.dispose();if(composer)composer.dispose();bloom=null;output=null;composer=null;}
 return {resize,render,dispose};
}
