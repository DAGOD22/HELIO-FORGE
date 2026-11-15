// HYG coordinates are J2000 equatorial; rotate to IAU Galactic coordinates.
// x_g points to the Galactic centre, y_g to longitude 90°, z_g north.
export const LIGHT_YEARS_PER_PARSEC=3.261563777;
export const SUN_GALACTIC_RADIUS_LY=26000; // rounded, schematic placement
const EQUATORIAL_TO_GALACTIC=[
 [-0.0548755604,-0.8734370902,-0.4838350155],
 [0.4941094279,-0.4448296300,0.7469822445],
 [-0.8676661490,-0.1980763734,0.4559837762]
];
export function equatorialToGalactic(raHours,decDegrees,distanceLy){
 const ra=raHours*Math.PI/12, dec=decDegrees*Math.PI/180;
 const v=[Math.cos(dec)*Math.cos(ra),Math.cos(dec)*Math.sin(ra),Math.sin(dec)];
 return EQUATORIAL_TO_GALACTIC.map(row=>distanceLy*row.reduce((sum,n,i)=>sum+n*v[i],0));
}
export function positionFromEquatorialLy(ra,dec,distanceLy){
 const [x,y,z]=equatorialToGalactic(ra,dec,distanceLy);
 // Sun at +X; galactic north is +Y in Three.js.
 return [SUN_GALACTIC_RADIUS_LY-x,z,y];
}
export function starPositionLy(star){return positionFromEquatorialLy(star.ra,star.dec,star.dist*LIGHT_YEARS_PER_PARSEC);}
// Procedural illustration only; particles are not a stellar catalogue or a fitted map.
export function schematicGalaxy(count=38000,seed=81024){
 const positions=new Float32Array(count*3),colors=new Float32Array(count*3);
 let s=seed;const random=()=>((s=s*16807%2147483647)/2147483647);
 const normal=()=>Math.sqrt(-2*Math.log(Math.max(random(),1e-12)))*Math.cos(2*Math.PI*random());
 for(let i=0;i<count;i++){
  let x,y,z,r;const kind=random();
  if(kind<.22){ // broad, warm central bar / bulge
   x=normal()*5400;z=normal()*2100;y=normal()*1200;r=Math.hypot(x,z);
  }else{
   r=3500+Math.pow(random(),.75)*45000;
   if(kind<.79){
    const arm=Math.floor(random()*4),angle=arm*Math.PI/2+1.4*Math.log(r/5500)+normal()*.16;
    x=r*Math.cos(angle)+normal()*900;z=r*Math.sin(angle)+normal()*900;
   }else{const angle=random()*Math.PI*2;x=r*Math.cos(angle);z=r*Math.sin(angle);}
   y=normal()*(200+500*Math.exp(-r/9000));
  }
  const j=3*i;positions[j]=x;positions[j+1]=y;positions[j+2]=z;
  const cool=kind>.25&&random()<.57,bright=.55+random()*.45;
  colors[j]=(cool?.61:1)*bright;colors[j+1]=(cool?.78:.76)*bright;colors[j+2]=(cool?1:.53)*bright;
 }
 return {positions,colors};
}

// Straight-line separation between the catalogue's static J2000 positions.
// This is not a propagated trajectory, binary orbit, or uncertainty estimate.
export function closestCatalogStars(reference,stars,limit=5){
 if(!reference||!Array.isArray(stars)||!Number.isInteger(limit)||limit<=0)return [];
 const origin=starPositionLy(reference);
 return stars.filter(star=>star.id!==reference.id).map(star=>({star,distanceLy:Math.hypot(...starPositionLy(star).map((value,i)=>value-origin[i]))})).filter(item=>Number.isFinite(item.distanceLy)).sort((a,b)=>a.distanceLy-b.distanceLy||a.star.id-b.star.id).slice(0,limit);
}

// Display-only mapping of HYG apparent magnitude to a bounded symbolic sprite.
// This is not a stellar radius, luminosity calibration or distance-dependent view.
export function symbolicStarBrightness(magnitude){return Number.isFinite(magnitude)?Math.max(0,Math.min(1,(11-magnitude)/12)):.45;}

// Art-directed star-forming-looking knots sampled from the synthetic overview.
// These are luminous decoration, not a catalogue, measured nebulae or dust map.
export function illustrativeGalaxyKnots(schematic, count=1600){
 const available=Math.floor(schematic.positions.length/3),n=Math.max(0,Math.min(available,Math.floor(count)));
 const positions=new Float32Array(n*3),colors=new Float32Array(n*3);
 for(let i=0;i<n;i++){
  const source=Math.floor(i*available/n)*3,j=i*3;
  positions[j]=schematic.positions[source];positions[j+1]=schematic.positions[source+1];positions[j+2]=schematic.positions[source+2];
  // Blue, rose and warm accents remain deliberately symbolic.
  const palette=i%7===0?[1,.42,.55]:i%3===0?[.53,.72,1]:[.95,.68,.48];
  colors.set(palette,j);
 }
 return {positions,colors};
}
