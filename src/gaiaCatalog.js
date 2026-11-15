import {LIGHT_YEARS_PER_PARSEC,SUN_GALACTIC_RADIUS_LY} from './galaxyModel.js';
export const GAIA_COUNT=1000000, GAIA_STRIDE=24, GAIA_STEP=104729;
export function validateGaia(buffer){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<16)throw Error('Invalid Gaia catalogue header');
 const v=new DataView(buffer);if(v.getUint32(0,true)!==0x314e3347||v.getUint32(4,true)!==1||v.getUint32(8,true)!==GAIA_COUNT||v.getUint32(12,true)!==GAIA_STRIDE||buffer.byteLength!==16+GAIA_COUNT*GAIA_STRIDE)throw Error('Invalid Gaia catalogue length or version');
 return v;
}
export function gaiaRecord(view,index){
 if(!Number.isInteger(index)||index<0||index>=GAIA_COUNT)throw Error('Invalid Gaia index');
 const off=16+index*GAIA_STRIDE,xyz=[view.getFloat32(off,true),view.getFloat32(off+4,true),view.getFloat32(off+8,true)],id=view.getBigUint64(off+12,true).toString(),g=view.getUint8(off+20),color=view.getUint8(off+21);
 if(!xyz.every(Number.isFinite)||id==='0')throw Error('Invalid Gaia record');
 return {id,xyz,distancePc:Math.hypot(...xyz),g:g===255?null:g/10,bpRp:color===255?null:color/40-1};
}
export function gaiaPosition(xyz){return [SUN_GALACTIC_RADIUS_LY-xyz[0]*LIGHT_YEARS_PER_PARSEC,xyz[2]*LIGHT_YEARS_PER_PARSEC,xyz[1]*LIGHT_YEARS_PER_PARSEC];}
// A symbolic colour ramp from BP-RP. No extinction correction or photometric calibration.
export function gaiaColor(bpRp){
 if(bpRp==null)return [.82,.87,1];
 const t=Math.max(0,Math.min(1,(bpRp+.3)/3.3));
 return [Math.min(1,.68+t*.55),Math.max(.55,.82-t*.22),Math.max(.36,1-t*.64)];
}
export function gaiaRenderIndex(i){return (i*GAIA_STEP)%GAIA_COUNT;}
