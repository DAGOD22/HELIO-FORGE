// Shared display-only coordinates; these are not physical scales or trajectories.
export function mapProjection(position,center,extent){
 return [500+(position[0]-center[0])*240/extent,300+(position[2]-center[2])*240/extent];
}
export function clampMapZoom(value){return Math.max(.55,Math.min(3,value));}
export function exoplanetPhase(row,index,count,days){
 return index*2*Math.PI/Math.max(1,count)+(Number.isFinite(row.pl_orbper)&&row.pl_orbper>0&&row.pl_orbperlim===0?days/row.pl_orbper*2*Math.PI:0);
}
