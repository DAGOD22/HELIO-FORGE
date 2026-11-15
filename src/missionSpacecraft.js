import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {visualConfiguration} from './missionVisualModel.js';

// Procedural concept art only: proportions, finishes and instruments are not CAD.
// A small deterministic texture adds folds to the thermal blanket without an
// external image, and belongs to this particular model for safe disposal.
export function makeThermalBlanketTexture(size=128){
 const pixels=new Uint8Array(size*size*4);let seed=7219;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  seed=(seed*1664525+1013904223)>>>0;
  const seam=x%32<2||y%32<2,crease=Math.sin(x*.31+y*.11)*5+Math.sin(y*.39-x*.08)*5,noise=(seed>>>24)/255*12-6;
  const light=seam?-25:crease+noise,i=(y*size+x)*4;
  pixels[i]=Math.max(0,Math.min(255,190+light));pixels[i+1]=Math.max(0,Math.min(255,143+light));pixels[i+2]=Math.max(0,Math.min(255,86+light));pixels[i+3]=255;
 }
 const texture=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;return texture;
}
export function makeConceptSpacecraft(design){
 const visual=visualConfiguration(design),group=new THREE.Group();group.name='concept-spacecraft';
 const material=(color,metalness=0,roughness=.55,emissive=0)=>new THREE.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:.35});
 const body=material(0xc4d1d2,.68,.34),dark=material(0x263c49,.52,.47),black=material(0x091a29,.25,.36),gold=material(0xd5a957,.65,.37),panelFrame=material(0xa4bac1,.7,.38),cell=material(0x8ebdff,.18,.4),glass=material(visual.sensorColor,.35,.19,0x143c49),lamp=material(0x9fffe0,.2,.25,0x3dc9aa);
 const foilTexture=makeThermalBlanketTexture(),foil=new THREE.MeshStandardMaterial({map:foilTexture,metalness:.48,roughness:.58});
 const box=(w,h,d,x,y,z,mat,name,rounded=false)=>{const geometry=rounded?new RoundedBoxGeometry(w,h,d,2,Math.min(.045,w/5,h/5,d/5)):new THREE.BoxGeometry(w,h,d);const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);if(name)m.name=name;group.add(m);return m};
 const cylinder=(r1,r2,h,x,y,z,mat,rot=0)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,24),mat);m.position.set(x,y,z);m.rotation.x=rot;group.add(m);return m};
 const h=visual.busHeight;
 box(.90,h,.72,0,0,0,body,'bus',true);
 // Layered insulation, corner rails, radiator and equipment panels.
 box(.79,h*.82,.025,0,0,.375,dark,'front-radiator');
 box(.78,h*.72,.025,0,0,-.375,foil,'thermal-blanket');
 for(const x of [-.45,.45])for(const z of [-.36,.36])box(.035,h+.09,.035,x,0,z,gold);
 for(const y of [-h*.48,-h*.26,h*.26,h*.48])box(.92,.025,.74,0,y,0,panelFrame);
 for(let i=-3;i<=3;i++)box(.58,.014,.014,0,i*h*.105,.397,panelFrame);
 for(const side of [-1,1]){
  box(.025,h*.5,.52,side*.465,.03,0,dark);
  for(const y of [-h*.16,0,h*.16])box(.027,.015,.46,side*.48,y,0,body);
  if(visual.deploy){
   box(.30,.07,.07,side*.61,0,0,gold);cylinder(.075,.075,.13,side*.67,0,0,panelFrame,Math.PI/2);
   const cx=side*1.46;
   box(1.4,.86,.065,cx,0,0,panelFrame,side<0?'left-array':'right-array',true);
   box(1.34,.8,.018,cx,0,.04,black);
   // Two-sided cell tiles remain visible when the spacecraft rotates.
   for(const face of [-1,1]){
    const cells=new THREE.InstancedMesh(new THREE.BoxGeometry(.195,.17,.012),cell,24);cells.name=side<0?(face===1?'left-cells':'left-cells-back'):(face===1?'right-cells':'right-cells-back');
    const matrix=new THREE.Matrix4();let n=0;
    for(let row=0;row<4;row++)for(let col=0;col<6;col++){matrix.makeTranslation(cx+(col-2.5)*.213,(row-1.5)*.19,face*.054);cells.setMatrixAt(n,matrix);cells.setColorAt(n,new THREE.Color().setHSL(.60,.65,.46+((row+col)%3)*.045));n++}
    cells.instanceMatrix.needsUpdate=true;if(cells.instanceColor)cells.instanceColor.needsUpdate=true;group.add(cells);
   }
   for(const y of [-.42,.42])box(1.42,.025,.07,cx,y,0,gold);
   for(const x of [-.68,.68])box(.025,.86,.07,cx+x,0,0,gold);
  }else{
   box(.035,h*.82,.56,side*.478,0,0,cell,side<0?'left-body-panel':'right-body-panel');
   for(let i=-2;i<=2;i++)box(.042,.014,.56,side*.50,i*h*.13,0,panelFrame);
  }
 }
 // The three stylised payloads have distinct silhouettes as well as colours.
 const lens=(x,y,r)=>{
  cylinder(r*1.35,r*1.5,.10,x,y,.45,body,Math.PI/2);
  cylinder(r*1.04,r*1.2,.16,x,y,.55,black,Math.PI/2);
  const aperture=new THREE.Mesh(new THREE.CircleGeometry(r,32),glass);aperture.position.set(x,y,.64);group.add(aperture);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(r,.012,8,32),gold);rim.position.set(x,y,.645);group.add(rim);return aperture;
 };
 if(design.instrument==='thermal')lens(0,.07,.13).name='sensor-aperture';
 if(design.instrument==='multispectral'){
  box(.52,.32,.10,0,.08,.43,dark,'multispectral-housing',true);
  for(const x of [-.16,0,.16]){const aperture=lens(x,.08,.055);if(x===0)aperture.name='sensor-aperture';}
 }
 if(design.instrument==='spectrometer'){
  box(.50,.34,.15,0,.08,.45,body,'spectrometer-housing',true);
  box(.32,.055,.018,0,.08,.54,glass,'sensor-aperture',true);
  for(const x of [-.13,-.065,0,.065,.13])box(.01,.075,.015,x,.08,.555,gold);
 }
 for(const x of [-.31,.31])for(const y of [-h*.36,h*.36]){const fastener=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),body);fastener.position.set(x,y,.405);group.add(fastener)}
 const indicator=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),lamp);indicator.position.set(.27,-h*.34,.41);group.add(indicator);
 // Rear electronics, attitude-control nozzles and small symbolic fittings.
 box(.36,.28,.10,0,-h*.13,-.44,dark,'equipment-box',true);
 for(const x of [-.29,.29]){const nozzle=cylinder(.045,.075,.13,x,-h*.51,-.19,dark);nozzle.name='control-nozzle';}
 for(const x of [-.26,.26])box(.10,.045,.04,x,h*.43,.39,gold);
 if(visual.highRate){
  const mast=cylinder(.025,.028,.40,.24,h/2+.19,0,gold);mast.rotation.z=-.1;
  // Open parabolic reflector with a feed at its focus, all illustrative.
  const curve=[];for(let i=0;i<=16;i++){const r=.30*i/16;curve.push(new THREE.Vector2(r,.8*r*r))}
  const dishMat=new THREE.MeshStandardMaterial({color:0xc7d6d7,metalness:.6,roughness:.38,side:THREE.DoubleSide});
  const dish=new THREE.Mesh(new THREE.LatheGeometry(curve,32),dishMat);dish.name='high-rate-reflector';dish.position.set(.28,h/2+.44,.02);dish.rotation.x=.65;group.add(dish);
  const dishRim=new THREE.Mesh(new THREE.TorusGeometry(.30,.012,8,32),gold);dishRim.position.set(.28,h/2+.5,.06);dishRim.rotation.x=Math.PI/2+.65;group.add(dishRim);
  const feed=cylinder(.014,.014,.22,.28,h/2+.56,.1,gold);feed.rotation.x=.65;
 }else{
  const antenna=cylinder(.012,.017,.55,.25,h/2+.26,0,gold);antenna.rotation.z=-.18;antenna.name='low-rate-antenna';
 }
 return group;
}
