// Move the camera relative to its current target; explicit buttons stop at the
// scene limits rather than silently switching to a different renderer.
export function zoomCamera(controls, factor){
 if(!controls||!Number.isFinite(factor)||factor<=0)return false;
 const delta=controls.object.position.clone().sub(controls.target),distance=delta.length();
 if(!Number.isFinite(distance)||distance<=0)return false;
 const next=Math.max(controls.minDistance,Math.min(controls.maxDistance,distance*factor));
 controls.object.position.copy(controls.target).add(delta.multiplyScalar(next/distance));
 controls.update();return true;
}
export function isEditableTarget(target){
 return !!target&&(target.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(target.tagName));
}
