import {calculate} from './missionModel.js';

// This explicit helper never changes the objective, budget, or other subsystems.
export function recommendedScienceDesign(design){
 const {objective}=calculate(design);
 return {...design,instrument:objective.instrument,orbit:objective.orbit};
}
// First month is displayed only for launchable designs. It is the existing
// deterministic model result, not a separate prediction or new assumption.
export function initialMonthEstimate(result){
 return result?.launched&&Array.isArray(result.timeline)&&result.timeline.length?result.timeline[0]:null;
}
export const REVIEW_TARGETS={
 launch:[['bus','Bus'],['launch','Launch'],['ground','Ground']],science:[['instrument','Instrument']],orbit:[['orbit','Orbit']],power:[['solar','Power'],['bus','Bus']],data:[['radio','Radio'],['ground','Ground']],lifetime:[['bus','Bus'],['duration','Duration']],
};
