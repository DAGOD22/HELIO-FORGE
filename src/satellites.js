// Astronomy Engine (MIT): lunar Improved Lunar Ephemeris and Jupiter's four Galilean moons.
// Earth-centred and Jupiter-centred geometric vectors are rotated from EQJ to J2000 ecliptic.
import {GeoMoon, JupiterMoons, RotateVector, Rotation_EQJ_ECL, Body, HelioVector} from 'astronomy-engine';
const EQJ_TO_ECL=Rotation_EQJ_ECL();
export const SATELLITES = {
 moon:{id:'moon',name:'Moon',parent:'earth',size:.223,periodDays:27.321661},
 io:{id:'io',name:'Io',parent:'jupiter',size:.24,periodDays:1.769138},
 europa:{id:'europa',name:'Europa',parent:'jupiter',size:.205,periodDays:3.551181},
 ganymede:{id:'ganymede',name:'Ganymede',parent:'jupiter',size:.32,periodDays:7.154553},
 callisto:{id:'callisto',name:'Callisto',parent:'jupiter',size:.29,periodDays:16.689017}
};
export function satelliteEclipticPosition(id,date){
 if(!SATELLITES[id])throw new Error(`Unsupported satellite: ${id}`);
 const raw=id==='moon'?GeoMoon(date):JupiterMoons(date)[id];
 const v=RotateVector(EQJ_TO_ECL,raw);return [v.x,v.y,v.z];
}
export function allSatelliteEclipticPositions(date) {
 const jupiter=JupiterMoons(date),result={};
 for(const id of Object.keys(SATELLITES)){const v=RotateVector(EQJ_TO_ECL,id==='moon'?GeoMoon(date):jupiter[id]);result[id]=[v.x,v.y,v.z];}
 return result;
}
// Display distances are compressed/enlarged independently of planet and moon radii.
// Direction and relative change of distance come from the physical vector.
export function satelliteDisplayPosition(id,date,vector=satelliteEclipticPosition(id,date)) {
 const [x,y,z]=vector,r=Math.hypot(x,y,z);
 const visualRadius=id==='moon'?2.2*r/.0025696:2.3+2.4*Math.log(r/.00282);
 const factor=visualRadius/r;
 return [x*factor,z*factor,-y*factor];
}
export function satellitePath(id,date,segments=96) {
 const period=SATELLITES[id].periodDays*86400000;
 return Array.from({length:segments+1},(_,i)=>satelliteDisplayPosition(id,new Date(date.getTime()+period*i/segments)));
}

// Astronomy Engine numerically interpolates Pluto's heliocentric trajectory.
// Its Pluto model represents the Pluto system barycenter.
export function plutoEclipticPosition(date) {
 const v=RotateVector(EQJ_TO_ECL,HelioVector(Body.Pluto,date));return [v.x,v.y,v.z];
}
