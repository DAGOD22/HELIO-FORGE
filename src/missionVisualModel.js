// Visual symbolism only: none of these proportions or colors are engineering data.
const COLORS={thermal:0xf6b180,multispectral:0x83d9d0,spectrometer:0xafb0ee};
const INSTRUMENTS={thermal:'thermal imager',multispectral:'multispectral camera',spectrometer:'atmospheric spectrometer'};
export function visualConfiguration(design){
 if(!design||!['compact','extended'].includes(design.bus)||!['body','deploy'].includes(design.solar)||!['low','high'].includes(design.radio)||!Object.hasOwn(COLORS,design.instrument)||!['polar','mid'].includes(design.orbit))throw new Error('Invalid visual design');
 return {
  busHeight:design.bus==='extended'?1.35:1,
  deploy:design.solar==='deploy',
  highRate:design.radio==='high',
  sensorColor:COLORS[design.instrument],
  orbitTilt:design.orbit==='polar'?.9:.22,
  description:`${design.bus==='extended'?'Extended':'Compact'} bus, ${design.solar==='deploy'?'deployable solar arrays':'body-mounted panels'}, ${design.radio==='high'?'high-rate':'low-rate'} radio. ${INSTRUMENTS[design.instrument]} illustrated.`,
 };
}
