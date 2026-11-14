// NASA/JPL approximate planetary elements, table 1 (1800–2050).
// Units: AU, eccentricity, degrees; rates are per Julian century.
// Earth is the Earth–Moon barycenter; outer-planet entries are approximations.
// https://ssd.jpl.nasa.gov/planets/approx_pos.html
const ELEMENTS = {
 mercury: [[.38709927,.20563593,7.00497902,252.25032350,77.45779628,48.33076593],[.00000037,.00001906,-.00594749,149472.67411175,.16047689,-.12534081]],
 venus: [[.72333566,.00677672,3.39467605,181.97909950,131.60246718,76.67984255],[.00000390,-.00004107,-.00078890,58517.81538729,.00268329,-.27769418]],
 earth: [[1.00000261,.01671123,-.00001531,100.46457166,102.93768193,0],[.00000562,-.00004392,-.01294668,35999.37244981,.32327364,0]],
 mars: [[1.52371034,.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],[.00001847,.00007882,-.00813131,19140.30268499,.44441088,-.29257343]],
 jupiter: [[5.20288700,.04838624,1.30439695,34.39644051,14.72847983,100.47390909],[-.00011607,-.00013253,-.00183714,3034.74612775,.21252668,.20469106]],
 saturn: [[9.53667594,.05386179,2.48599187,49.95424423,92.59887831,113.66242448],[-.00125060,-.00050991,.00193609,1222.49362201,-.41897216,-.28867794]],
 uranus: [[19.18916464,.04725744,.77263783,313.23810451,170.95427630,74.01692503],[-.00196176,-.00004397,-.00242939,428.48202785,.40805281,.04240589]],
 neptune: [[30.06992276,.00859048,1.77004347,-55.12002969,44.96476227,131.78422574],[.00026291,.00005105,.00035372,218.45945325,-.32241464,-.00508664]]
};
const RAD=Math.PI/180, EPOCH=Date.UTC(2000,0,1,12), DAY=86400000;
export const MIN_DATE=Date.UTC(1800,0,1), MAX_DATE=Date.UTC(2051,0,1)-1;
function elements(id,date) {
 const row=ELEMENTS[id];if(!row)throw new Error(`No JPL elements for ${id}`);
 // JS Date is UTC, not TDB. The offset (roughly a minute in modern times) is neglected.
 const t=(date.getTime()-EPOCH)/DAY/36525;
 return row[0].map((v,j)=>v+row[1][j]*t);
}
function positionFromAnomaly([a,e,i,,peri,node], meanAnomaly) {
 let M=((meanAnomaly+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI,E=M;
 for(let n=0;n<12;n++){const correction=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));E-=correction;if(Math.abs(correction)<1e-12)break;}
 const x=a*(Math.cos(E)-e),y=a*Math.sqrt(1-e*e)*Math.sin(E);
 const w=(peri-node)*RAD,O=node*RAD,inc=i*RAD;
 return [(Math.cos(O)*Math.cos(w)-Math.sin(O)*Math.sin(w)*Math.cos(inc))*x+(-Math.cos(O)*Math.sin(w)-Math.sin(O)*Math.cos(w)*Math.cos(inc))*y,
 (Math.sin(O)*Math.cos(w)+Math.cos(O)*Math.sin(w)*Math.cos(inc))*x+(-Math.sin(O)*Math.sin(w)+Math.cos(O)*Math.cos(w)*Math.cos(inc))*y,
 Math.sin(w)*Math.sin(inc)*x+Math.cos(w)*Math.sin(inc)*y];
}
// Heliocentric J2000 ecliptic coordinates in AU, before visualization scaling.
export function heliocentricPosition(p,date) {
 const values=elements(p.id,date);return positionFromAnomaly(values,(values[3]-values[4])*RAD);
}
export function renderPosition([x,y,z]) {
 const r=Math.hypot(x,y,z);if(!r)return [0,0,0];const scale=(3.4+Math.sqrt(r)*5)/r;
 // Map ecliptic north to +Y while preserving a right-handed frame.
 return [x*scale,z*scale,-y*scale];
}
export function orbitalPosition(p,date){return renderPosition(heliocentricPosition(p,date));}
// Freeze elements at the chosen date to draw a closed osculating-style guide;
// the guide is not the precise future trajectory when the fitted elements change.
export function orbitalPath(p,date,segments=256){
 const values=elements(p.id,date);return Array.from({length:segments+1},(_,j)=>renderPosition(positionFromAnomaly(values,j/segments*Math.PI*2)));
}
// JPL SBDB osculating elliptical elements propagated as an unperturbed two-body orbit.
// The epoch and element names are those supplied by SBDB; accuracy degrades away from epoch.
export function parseSmallBodyOrbit(data) {
 const orbit=data?.orbit, entries=orbit?.elements;
 if(!Array.isArray(entries)) return null;
 const values=Object.fromEntries(entries.filter(e=>e.value!==null&&e.value!==undefined&&e.value!=='').map(e=>[e.name,Number(e.value)]));
 const {a,e,i,om,w,ma,n}=values,epoch=Number(orbit.epoch);
 if(![a,e,i,om,w,ma,n,epoch].every(Number.isFinite)||a<=0||e<0||e>=1||n<=0)return null;
 return {a,e,i,om,w,ma,n,epoch};
}
export function smallBodyHeliocentricPosition(orbit,date) {
 const jd=date.getTime()/DAY+2440587.5;
 const values=[orbit.a,orbit.e,orbit.i,0,orbit.w+orbit.om,orbit.om];
 return positionFromAnomaly(values,(orbit.ma+orbit.n*(jd-orbit.epoch))*RAD);
}
export function smallBodyPath(orbit,segments=256) {
 const values=[orbit.a,orbit.e,orbit.i,0,orbit.w+orbit.om,orbit.om];
 return Array.from({length:segments+1},(_,j)=>renderPosition(positionFromAnomaly(values,j/segments*Math.PI*2)));
}
