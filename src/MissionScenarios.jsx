import React from 'react';
import {SCENARIOS} from './missionModel';

export default function MissionScenarios({value,onChange}){
 return <section className="mc-scenarios" aria-labelledby="scenario-title">
  <div className="mc-scenarios-heading"><span className="mc-eyebrow">CAMPAIGN CONDITIONS / FICTIONAL</span><h3 id="scenario-title">Choose what to test.</h3><p>Run the same design in different invented conditions and compare the trade-offs. These are not weather predictions or real mission risks.</p></div>
  <div className="mc-scenario-options">{Object.entries(SCENARIOS).map(([id,item])=><button key={id} className={value===id?'selected':''} aria-pressed={value===id} onClick={()=>onChange(id)}><b>{item.name}</b><span>{item.detail}</span></button>)}</div>
 </section>
}
