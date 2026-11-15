import {calculate} from './missionModel.js';
// Educational checks: only budget/mass prevent a launch in this model.
export function preflightChecks(design){
 const c=calculate(design),{bus,instrument,duration}=c.parts;
 return [
  {id:'launch',label:'Launch mass & cost',status:c.canLaunch?'ready':'hold',detail:c.canLaunch?'Within modeled launch and budget limits.':'Exceeds the launch mass or mission budget limit.'},
  {id:'science',label:'Science instrument',status:design.instrument===c.objective.instrument?'ready':'caution',detail:design.instrument===c.objective.instrument?'Matches the chosen question.':'Instrument mismatch makes the science score zero.'},
  {id:'orbit',label:'Orbit suitability',status:design.orbit===c.objective.orbit?'ready':'caution',detail:design.orbit===c.objective.orbit?'Recommended for this game objective.':'Non-recommended orbit applies a 0.7 score factor.'},
  {id:'power',label:'Power & eclipse',status:c.averagePower>=c.load&&c.eclipseWh<=bus.battery?'ready':'caution',detail:c.averagePower>=c.load&&c.eclipseWh<=bus.battery?'Initial average load and eclipse energy fit.':'Initial power or eclipse energy is insufficient; science may be reduced.'},
  {id:'data',label:'Daily downlink',status:c.downlink>=instrument.data?'ready':'caution',detail:c.downlink>=instrument.data?'Capacity meets full-rate data generation before events.':'Full-rate data can accumulate and may overflow storage.'},
  {id:'lifetime',label:'Mission lifetime',status:duration.months<=bus.life?'ready':'caution',detail:duration.months<=bus.life?'Campaign fits the bus design life.':'The bus retires before the planned campaign ends.'},
 ];
}
