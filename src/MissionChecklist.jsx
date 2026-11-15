import React from 'react';
import {AlertTriangle,CheckCircle2,OctagonAlert} from 'lucide-react';
import {preflightChecks} from './missionChecks.js';
import {REVIEW_TARGETS} from './missionGuidance.js';
export default function MissionChecklist({design,onReview}){
 const checks=preflightChecks(design);return <details className="mc-checklist"><summary>Preflight checklist <span>{checks.filter(c=>c.status!=='ready').length} NEED ATTENTION</span></summary><p>Illustrative checks only. Warnings do not block launch; mass and cost do. Events may change margins later.</p><ul>{checks.map(item=><li key={item.id} className={item.status}>{item.status==='ready'?<CheckCircle2 size={15}/>:item.status==='hold'?<OctagonAlert size={15}/>:<AlertTriangle size={15}/>}<div><b>{item.label} <small>{item.status==='ready'?'READY':item.status==='hold'?'HOLD':'CAUTION'}</small></b><span>{item.detail}</span>{onReview&&item.status!=='ready'&&<div className="mc-check-links">{REVIEW_TARGETS[item.id].map(([key,label])=><button key={key} onClick={()=>onReview(key)}>Review {label} →</button>)}</div>}</div></li>)}</ul></details>
}
