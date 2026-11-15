import React from 'react';
import {MIN_DATE,MAX_DATE} from './orbits';

export default function SimulationTimeFields({speed,onSpeed,date,onDate}){
 return <><div className="speed"><small>TIME SPEED</small><select aria-label="Time speed" value={speed} onChange={e=>onSpeed(Number(e.target.value))}>
  <option value={-365}>−1 year/sec</option><option value={-30}>−30 days/sec</option><option value={-1/86400}>−1× real time</option><option value={-1}>−1 day/sec</option><option value={1/86400}>1× real time</option><option value={1}>1 day/sec</option><option value={30}>30 days/sec</option><option value={365}>1 year/sec</option>
 </select></div><div className="date-control"><small>JUMP TO DATE</small><input type="date" aria-label="Simulation date" min="1800-01-01" max="2050-12-31" value={date.toISOString().slice(0,10)} onChange={e=>{if(!e.target.value)return;const next=new Date(e.target.value+'T12:00:00Z');if(Number.isFinite(next.getTime())&&next.getTime()>=MIN_DATE&&next.getTime()<=MAX_DATE)onDate(next)}}/></div></>
}
