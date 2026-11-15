import React,{useEffect,useRef,useState} from 'react';
import {clampMapZoom} from './map2d';
// 2D map pan and zoom do not represent physical travel. A deliberate wheel or
// pinch at a boundary can open the next view; button zoom stays in this view.
export function useMapZoom(navigationRef,resetKey,onBoundary){
 const [zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0}),pointers=useRef(new Map()),lastPinch=useRef(null),current=useRef(1),containerRef=useRef(null),dragged=useRef(false);
 current.current=zoom;
 useEffect(()=>{const nav={zoom:factor=>{if(!Number.isFinite(factor)||factor<=0)return false;setZoom(z=>clampMapZoom(z/factor));return true}};navigationRef.current=nav;return()=>{if(navigationRef.current===nav)navigationRef.current=null}},[navigationRef]);
 useEffect(()=>{setZoom(1);setPan({x:0,y:0})},[resetKey]);
 const change=(factor,gesture)=>{const z=current.current;if((gesture==='out'&&z<=.56)||(gesture==='in'&&z>=2.99))onBoundary?.(gesture);setZoom(v=>clampMapZoom(v*factor))};
 const wheel=e=>{e.preventDefault();if(e.deltaY)change(e.deltaY<0?1.12:1/1.12,e.deltaY<0?'in':'out')};
 useEffect(()=>{const node=containerRef.current;if(!node)return;node.addEventListener('wheel',wheel,{passive:false});return()=>node.removeEventListener('wheel',wheel)},[wheel]);
 const pinch=()=>{const [a,b]=[...pointers.current.values()];return Math.hypot(a.x-b.x,a.y-b.y)};
 const pointer={
  onPointerDown:e=>{if(e.pointerType!=='touch'&&e.button!==0)return;dragged.current=false;pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});if(pointers.current.size===2){lastPinch.current=pinch();dragged.current=true}},
  onPointerMove:e=>{const old=pointers.current.get(e.pointerId);if(!old)return;const next={...old,x:e.clientX,y:e.clientY};pointers.current.set(e.pointerId,next);if(pointers.current.size===2){const distance=pinch();if(lastPinch.current&&distance>0){const factor=distance/lastPinch.current;if(Math.abs(factor-1)>.005)change(factor,factor>1?'in':'out')}lastPinch.current=distance;dragged.current=true}
   else if(pointers.current.size===1){if(Math.hypot(next.x-next.startX,next.y-next.startY)>4)dragged.current=true;if(dragged.current){const rect=containerRef.current.getBoundingClientRect(),scale=Math.max(rect.width/1000,rect.height/600)||1;setPan(p=>({x:Math.max(-500,Math.min(500,p.x+(next.x-old.x)/scale)),y:Math.max(-350,Math.min(350,p.y+(next.y-old.y)/scale))}));e.currentTarget.setPointerCapture?.(e.pointerId)}}},
  onPointerUp:e=>{pointers.current.delete(e.pointerId);lastPinch.current=null;for(const point of pointers.current.values()){point.startX=point.x;point.startY=point.y}},
  onPointerCancel:e=>{pointers.current.delete(e.pointerId);lastPinch.current=null},
  onClickCapture:e=>{if(dragged.current){e.preventDefault();e.stopPropagation();dragged.current=false}}
 };
 return [zoom,pointer,containerRef,pan];
}
export function MapStatus({retry}){return <div className="map2d-status" role="status"><span>2D MODE · NO WEBGL</span><button type="button" onClick={retry}>TRY 3D</button></div>}
