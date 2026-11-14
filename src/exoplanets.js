// These explicitly curated HYG identifiers refer to the same named NASA host stars.
// A host mapping is not inferred from approximate positions or string similarity.
export const EXOPLANET_HOSTS=[
 {id:'proxima',hygId:70666,hip:'70890',host:'Proxima Cen',display:'Proxima Centauri'},
 {id:'eps-eri',hygId:16496,hip:'16537',host:'eps Eri',display:'Ran · Epsilon Eridani'},
 {id:'gj-876',hygId:112660,hip:'113020',host:'GJ 876',display:'Gliese 876'},
 {id:'gj-581',hygId:74766,hip:'74995',host:'GJ 581',display:'Gliese 581'},
 {id:'55-cnc',hygId:43464,hip:'43587',host:'55 Cnc',display:'Copernicus · 55 Cancri'},
 {id:'51-peg',hygId:112997,hip:'113357',host:'51 Peg',display:'Helvetios · 51 Pegasi'}
];
export const HOST_BY_ID=Object.fromEntries(EXOPLANET_HOSTS.map(h=>[h.id,h]));
export const HOST_BY_HYG=Object.fromEntries(EXOPLANET_HOSTS.map(h=>[String(h.hygId),h]));
export const EXOPLANET_COLUMNS=['pl_name','hostname','pl_orbper','pl_orbpererr1','pl_orbpererr2','pl_orbperlim','pl_orbsmax','pl_orbsmaxerr1','pl_orbsmaxerr2','pl_orbsmaxlim','pl_rade','pl_radeerr1','pl_radeerr2','pl_radelim','pl_bmasse','pl_bmasseerr1','pl_bmasseerr2','pl_bmasselim','pl_bmassprov','discoverymethod','disc_year','ra','dec','sy_dist','pl_refname','pl_controv_flag','soltype'];
export function exoplanetQuery(hostId){
 const host=Object.hasOwn(HOST_BY_ID,hostId)?HOST_BY_ID[hostId]:null;if(!host)throw new Error('Unsupported host');
 return `select ${EXOPLANET_COLUMNS.join(',')} from ps where default_flag=1 and hostname='${host.host}' order by pl_orbper`;
}
export function validateExoplanetRows(rows,hostId){
 const host=Object.hasOwn(HOST_BY_ID,hostId)?HOST_BY_ID[hostId]:null;if(!host||!Array.isArray(rows)||rows.length>50)throw new Error('Unexpected exoplanet response');
 const names=new Set();
 for(const row of rows){
  if(!row||typeof row!=='object'||row.hostname!==host.host||typeof row.pl_name!=='string'||!row.pl_name||names.has(row.pl_name))throw new Error('Invalid planet record');
  names.add(row.pl_name);
  if(row.pl_controv_flag!=null&&row.pl_controv_flag!==0&&row.pl_controv_flag!==1)throw new Error('Invalid controversy flag');
  for(const key of ['pl_orbperlim','pl_orbsmaxlim','pl_radelim','pl_bmasselim'])if(row[key]!=null&&![-1,0,1].includes(row[key]))throw new Error('Invalid limit flag');
  for(const key of EXOPLANET_COLUMNS){if(!Object.hasOwn(row,key))throw new Error('Incomplete planet record');if(['pl_name','hostname','pl_bmassprov','discoverymethod','pl_refname','soltype'].includes(key)){if(row[key]!=null&&typeof row[key]!=='string')throw new Error('Invalid text field');}else if(row[key]!=null&&(typeof row[key]!=='number'||!Number.isFinite(row[key])))throw new Error('Invalid numeric field');}
 }
 return rows;
}
// Numeric limit flags follow NASA archive conventions: 0=measurement, 1=upper,
// -1=lower. Unspecified and limit values are not used to draw an orbit.
export function hasDrawableOrbit(row){return Number.isFinite(row.pl_orbsmax)&&row.pl_orbsmax>0&&row.pl_orbsmaxlim===0;}
export function schematicOrbitRadius(a,min,max){
 if(![a,min,max].every(Number.isFinite)||a<=0||min<=0||max<min||a<min||a>max)return null;
 return 2+12*Math.log1p(a/min)/Math.log1p(max/min);
}
export function measurement(row,key){
 const value=row[key],flag=row[key+'lim'];if(!Number.isFinite(value))return 'Unavailable';
 const fmt=n=>n.toLocaleString('en-US',{maximumSignificantDigits:12});
 const prefix=flag===1?'≤ ':flag===-1?'≥ ':'';
 const hi=row[key+'err1'],lo=row[key+'err2'];
 if(flag===0&&(Number.isFinite(hi)||Number.isFinite(lo))){const upper=Number.isFinite(hi)?'+'+fmt(Math.abs(hi)):'unknown',lower=Number.isFinite(lo)?'−'+fmt(Math.abs(lo)):'unknown';return `${fmt(value)} (${upper} / ${lower})`;}
 return prefix+fmt(value)+(flag==null?' (limit status unavailable)':'');
}
