import React,{useMemo} from 'react';
import {compareCampaigns} from './campaignComparison';
const format=n=>Number(n.toFixed(1)).toLocaleString();
export default function CampaignComparison({design,decisions,onTry}){
 const rows=useMemo(()=>compareCampaigns(design,decisions),[design,decisions]);
 return <section className="mc-campaign-comparison" aria-labelledby="campaign-compare-title"><span className="mc-eyebrow">SAME SPACECRAFT / SAME DECISIONS</span><h3 id="campaign-compare-title">What if conditions changed?</h3><p>Compare this flight with two alternative fictional campaigns. These are model calculations, not forecasts or observed conditions.</p><div className="mc-campaign-table-wrap"><table><thead><tr><th scope="col">Campaign</th><th scope="col">Score</th><th scope="col">Returned</th><th scope="col">Lost</th><th scope="col">Action</th></tr></thead><tbody>{rows.map(({id,name,result})=><tr key={id}><th scope="row">{name}{id===(design.scenario??'nominal')&&<small>THIS FLIGHT</small>}</th><td>{result.score}/100</td><td>{format(result.returned)} GB</td><td>{format(result.lost)} GB</td><td>{id!==(design.scenario??'nominal')&&<button onClick={()=>onTry(id)}>TRY THIS</button>}</td></tr>)}</tbody></table></div></section>
}
