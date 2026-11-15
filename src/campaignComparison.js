import {SCENARIOS,simulate} from './missionModel.js';
// Same design and decisions; the only changed variable is the fictional scenario.
export function compareCampaigns(design,decisions){
 return Object.entries(SCENARIOS).map(([id,scenario])=>({id,name:scenario.name,result:simulate({...design,scenario:id},decisions)}));
}
