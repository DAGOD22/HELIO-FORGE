const rad=Math.PI/180;
// Two-body Keplerian model, J2000 mean elements; not an ephemeris. Rendering distance is compressed.
export function orbitalPosition(p,date){
 const d=(date.getTime()-Date.UTC(2000,0,1,12))/86400000;
 let M=((p.L-p.peri+360*d/p.days)%360)*rad, E=M;
 for(let n=0;n<8;n++) E-=(E-p.e*Math.sin(E)-M)/(1-p.e*Math.cos(E));
 const x=p.a*(Math.cos(E)-p.e), y=p.a*Math.sqrt(1-p.e*p.e)*Math.sin(E);
 const w=(p.peri-p.node)*rad, O=p.node*rad, i=p.i*rad;
 const X=(Math.cos(O)*Math.cos(w)-Math.sin(O)*Math.sin(w)*Math.cos(i))*x+(-Math.cos(O)*Math.sin(w)-Math.sin(O)*Math.cos(w)*Math.cos(i))*y;
 const Y=(Math.sin(O)*Math.cos(w)+Math.cos(O)*Math.sin(w)*Math.cos(i))*x+(-Math.sin(O)*Math.sin(w)+Math.cos(O)*Math.cos(w)*Math.cos(i))*y;
 const Z=Math.sin(w)*Math.sin(i)*x+Math.cos(w)*Math.sin(i)*y;
 const r=Math.hypot(X,Y,Z), scale=(3.4+Math.sqrt(r)*5)/r;
 return [X*scale,Z*scale,Y*scale];
}

// Illustrative lunar phase: approximate sidereal period and ecliptic inclination,
// with an arbitrary epoch phase. Render distance is deliberately compressed.
export function illustrativeMoonPosition(date) {
 const days=(date.getTime()-Date.UTC(2000,0,1,12))/86400000;
 const a=days/27.321661*Math.PI*2, inclination=5.145*Math.PI/180, distance=2.2;
 return [Math.cos(a)*distance,Math.sin(a)*distance*Math.sin(inclination),Math.sin(a)*distance*Math.cos(inclination)];
}
