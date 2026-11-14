// Radii in kilometres; planets, Sun and satellites from NASA NSSDCA fact sheets.
// Irregular moons use volume-equivalent sphere radii computed from published axes.
// Haumea is an equatorial estimate; Eris and Makemake use diameter estimates
// from NASA Science; generic spheres do not represent their actual shapes.
export const AU_KM=149597870.7;
export const RADII_KM={sun:696340,mercury:2439.7,venus:6051.8,earth:6371,mars:3389.5,jupiter:69911,saturn:58232,uranus:25362,neptune:24622,
 moon:1737.4,io:1821.5,europa:1560.8,ganymede:2631.2,callisto:2410.3,pluto:1188,ceres:469.7,
 haumea:870,makemake:715,eris:1200,eros:8.42,halley:5.5,
 phobos:Math.cbrt(13*11.4*9.1),deimos:Math.cbrt(7.8*6*5.1),
 enceladus:Math.cbrt(257*251*248),rhea:Math.cbrt(765*763*762),titan:2575,iapetus:Math.cbrt(746*746*712),triton:1353.4,charon:606};
export function radiusAU(id){const km=RADII_KM[id];return Number.isFinite(km)&&km>0?km/AU_KM:null;}
