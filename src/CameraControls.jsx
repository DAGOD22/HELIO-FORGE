import React from 'react';
import {Plus,Minus,Scan} from 'lucide-react';

// Camera controls stay independent of cross-scale navigation: zooming with these
// buttons does not enter another renderer or claim a continuous physical flight.
export default function CameraControls({onZoom,onReset,disabled=false}){
 return <div className="camera-controls" role="group" aria-label="View controls">
  <button type="button" disabled={disabled} title="Zoom in" aria-label="Zoom in" onClick={()=>onZoom(.7)}><Plus size={17}/></button>
  <button type="button" disabled={disabled} title="Zoom out" aria-label="Zoom out" onClick={()=>onZoom(1.43)}><Minus size={17}/></button>
  <button type="button" disabled={disabled} title="Reset view" aria-label="Reset view" onClick={onReset}><Scan size={17}/></button>
 </div>;
}
