import {GAIA_COUNT,GAIA_STRIDE,gaiaColor,gaiaPosition,gaiaRecord,gaiaRenderIndex,validateGaia} from './gaiaCatalog';
let data=null,view=null;
self.onmessage=async e=>{
 const msg=e.data;
 if(msg.type==='load'){
  try{
   const response=await fetch('/data/gaia-dr3-1m.bin');if(!response.ok)throw Error('Catalogue download failed');
   data=await response.arrayBuffer();view=validateGaia(data);
   const positions=new Float32Array(GAIA_COUNT*3),colors=new Float32Array(GAIA_COUNT*3),brightness=new Float32Array(GAIA_COUNT);
   for(let i=0;i<GAIA_COUNT;i++){
    const off=16+gaiaRenderIndex(i)*GAIA_STRIDE,xyz=[view.getFloat32(off,true),view.getFloat32(off+4,true),view.getFloat32(off+8,true)];
    if(!xyz.every(Number.isFinite))throw Error('Invalid catalogue coordinates');
    const color=view.getUint8(off+21),pos=gaiaPosition(xyz),rgb=gaiaColor(color===255?null:color/40-1);positions.set(pos,i*3);colors.set(rgb,i*3);const mag=view.getUint8(off+20);brightness[i]=mag===255?0.5:Math.max(0,Math.min(1,(18-mag/10)/14));
   }
   self.postMessage({type:'ready',count:GAIA_COUNT,positions,colors,brightness},[positions.buffer,colors.buffer,brightness.buffer]);
  }catch{data=null;view=null;self.postMessage({type:'error'});}
 }else if(msg.type==='inspect'&&view){self.postMessage({type:'inspect',star:gaiaRecord(view,gaiaRenderIndex(msg.index))});}
 else if(msg.type==='find'&&view){
  const query=msg.query;
  try{const id=BigInt(query);let found=null;for(let i=0;i<GAIA_COUNT;i++)if(view.getBigUint64(16+i*GAIA_STRIDE+12,true)===id){found=gaiaRecord(view,i);break;}self.postMessage({type:'search',query,star:found});}catch{self.postMessage({type:'search',query,star:null});}
 }
};
