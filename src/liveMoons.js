// Real geometric, parent-relative hourly position/velocity samples are fetched from JPL Horizons.
// displayDistance and size are visualization-only, not physical dimensions.
export const LIVE_MOONS={
 phobos:{parent:'mars',size:.17,displayDistance:1.4},deimos:{parent:'mars',size:.14,displayDistance:2.2},
 enceladus:{parent:'saturn',size:.19,displayDistance:3.3},rhea:{parent:'saturn',size:.23,displayDistance:4.6},
 titan:{parent:'saturn',size:.32,displayDistance:6.1},iapetus:{parent:'saturn',size:.23,displayDistance:8},
 triton:{parent:'neptune',size:.31,displayDistance:2.8},charon:{parent:'pluto',size:.22,displayDistance:1.5}
};

// Cubic Hermite interpolation between hourly position/velocity samples. Velocities
// are AU/day. Returns null outside the supplied interval; never extrapolates.
export function interpolateTrack(samples,date){
 const jd=date.getTime()/86400000+2440587.5;
 if(!Array.isArray(samples)||samples.length<2||jd<samples[0].jd||jd>samples.at(-1).jd)return null;
 let i=0;while(i<samples.length-2&&samples[i+1].jd<jd)i++;
 const a=samples[i],b=samples[i+1],h=b.jd-a.jd;if(!(h>0))return null;
 const t=Math.max(0,Math.min(1,(jd-a.jd)/h)),t2=t*t,t3=t2*t;
 return a.positionAU.map((p,j)=>(2*t3-3*t2+1)*p+(t3-2*t2+t)*h*a.velocityAUPerDay[j]+(-2*t3+3*t2)*b.positionAU[j]+(t3-t2)*h*b.velocityAUPerDay[j]);
}
