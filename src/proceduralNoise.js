// Deterministic smooth noise for illustrative artwork. This does not encode data.
function hash(x,y,seed){let n=(Math.imul(x,374761393)+Math.imul(y,668265263)+seed)|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
const lerp=(a,b,t)=>a+(b-a)*t;
export function valueNoise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return lerp(lerp(hash(ix,iy,seed),hash(ix+1,iy,seed),u),lerp(hash(ix,iy+1,seed),hash(ix+1,iy+1,seed),u),v)}
export function fractalNoise(x,y,seed){return .57*valueNoise(x,y,seed)+.28*valueNoise(x*2,y*2,seed+37)+.15*valueNoise(x*4,y*4,seed+89)}
