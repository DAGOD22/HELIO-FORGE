// Software-only orthographic rendering of an equirectangular visualization map.
// Orientation and shading are artistic; this is not a live planetary image.
export function projectGlobe(source,width,height,size=256){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||!Number.isInteger(size)||size<1||source.length<width*height*4)throw new Error('Invalid globe texture');
 const result=new Uint8ClampedArray(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const nx=(x+.5-size/2)/(size/2),ny=(y+.5-size/2)/(size/2),r2=nx*nx+ny*ny;if(r2>1)continue;
  const nz=Math.sqrt(1-r2),lon=Math.atan2(nx,nz),lat=Math.asin(-ny);
  const sx=Math.min(width-1,Math.floor((.5+lon/(2*Math.PI))*width)),sy=Math.min(height-1,Math.floor((.5-lat/Math.PI)*height)),a=(sy*width+sx)*4,b=(y*size+x)*4;
  result[b]=source[a];result[b+1]=source[a+1];result[b+2]=source[a+2];result[b+3]=255;
 }
 return result;
}
