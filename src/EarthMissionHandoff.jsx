import React from 'react';
import {ArrowRight} from 'lucide-react';
import {OBJECTIVES} from './missionModel';

// A deliberate handoff, not a claim that the explorer generates science data.
export default function EarthMissionHandoff({onChoose}){
 return <section className="earth-mission-handoff" aria-label="Design an Earth observation mission"><span>TURN EXPLORATION INTO A MISSION</span><h3>What would you study?</h3><p>Choose a question to carry into Mission Lab. The game is an educational model, not data collected in this view.</p>{Object.entries(OBJECTIVES).map(([id,objective])=><button key={id} onClick={()=>onChoose(id)}>{objective.name}<ArrowRight size={14}/></button>)}</section>
}
