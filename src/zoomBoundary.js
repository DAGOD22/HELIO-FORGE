// Bridges different renderers only on a deliberate outward/inward zoom gesture
// at their boundary. A rotate/pan or a programmatic camera flight cannot trigger it.
export function attachZoomBoundary(element,controls,{direction,canEnter,onEnter}){
 let fired=false;const pointers=new Map();let previousPinch=null;
 const distance=()=>controls.object.position.distanceTo(controls.target);
 function check(gesture){
  if(fired||gesture!==direction||!canEnter())return;
  const d=distance(),atBoundary=direction==='out'?d>=controls.maxDistance*.98:d<=controls.minDistance*1.35;
  if(atBoundary){fired=true;onEnter();}
 }
 const wheel=e=>{if(e.deltaY!==0)check(e.deltaY>0?'out':'in')};
 const pinchDistance=()=>{const [a,b]=[...pointers.values()];return Math.hypot(a[0]-b[0],a[1]-b[1])};
 const down=e=>{if(e.pointerType!=='touch')return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2)previousPinch=pinchDistance()};
 const move=e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size!==2)return;const next=pinchDistance();if(previousPinch!==null&&Math.abs(next-previousPinch)>1)check(next<previousPinch?'out':'in');previousPinch=next};
 const up=e=>{pointers.delete(e.pointerId);previousPinch=null};
 element.addEventListener('wheel',wheel,{passive:true});element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);element.addEventListener('pointerup',up);element.addEventListener('pointercancel',up);
 return ()=>{element.removeEventListener('wheel',wheel);element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',up);element.removeEventListener('pointercancel',up)};
}
