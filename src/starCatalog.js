export const CHART_BOUNDS={minColor:-.5,maxColor:3,minMagnitude:-5,maxMagnitude:20};
export function chartable(star){const {minColor,maxColor,minMagnitude,maxMagnitude}=CHART_BOUNDS;return Number.isFinite(star.ci)&&Number.isFinite(star.absmag)&&star.ci>=minColor&&star.ci<=maxColor&&star.absmag>=minMagnitude&&star.absmag<=maxMagnitude;}
export function chartPosition(star){if(!chartable(star))return null;const b=CHART_BOUNDS;return [(star.ci-b.minColor)/(b.maxColor-b.minColor),(star.absmag-b.minMagnitude)/(b.maxMagnitude-b.minMagnitude)];}
export function spectralGroup(star){const first=(star.spect||'').trim().toUpperCase()[0];return 'OBAFGKM'.includes(first)&&first?first:'other';}
export function matchesStar(star,query,group='all'){
 const q=query.trim().toLowerCase().replace(/\s+/g,' ');if(group!=='all'&&spectralGroup(star)!==group)return false;
 return !q||[star.name,`HYG ${star.id}`,String(star.id),star.hip&&`HIP ${star.hip}`,star.hd&&`HD ${star.hd}`,star.gl,star.bf].some(v=>v&&String(v).toLowerCase().replace(/\s+/g,' ').includes(q));
}
export function validStarShell(data,inner){
 if(!Array.isArray(data)||!data.length)return false;
 const ids=new Set(inner.map(star=>star.id));let distance=20;
 for(const s of data){
  if(!s||!Number.isInteger(s.id)||ids.has(s.id)||typeof s.name!=='string'||!s.name||!Number.isFinite(s.dist)||s.dist<=20||s.dist>50||s.dist<distance||!Number.isFinite(s.ra)||s.ra<0||s.ra>=24||!Number.isFinite(s.dec)||s.dec< -90||s.dec>90)return false;
  if(['mag','absmag','ci'].some(key=>s[key]!=null&&!Number.isFinite(s[key])))return false;
  ids.add(s.id);distance=s.dist;
 }
 return true;
}
