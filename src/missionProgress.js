import {calculate,simulate,DEFAULT_DESIGN} from './missionModel.js';

// A versioned, local-only checkpoint. Numerical results are recalculated rather
// than trusted from storage. Bump MODEL_REVISION when simulation rules change.
export const PROGRESS_KEY='cosmos-mission-progress-v1';
export const MODEL_REVISION='2026-11-campaign-1';
const designKeys=Object.keys(DEFAULT_DESIGN),decisionKeys=['solar','contacts','strategy'];
const validChoice=v=>v===null||v==='push'||v==='conserve';
function cleanDesign(value){
 calculate(value);
 return Object.fromEntries(designKeys.map(k=>[k,k==='scenario'?(value[k]??'nominal'):value[k]]));
}
export function createCheckpoint(design,phase,decisions,completed=false){
 const clean=cleanDesign(design),state=calculate(clean);
 if(!state.canLaunch||!Number.isInteger(phase)||phase<1||phase>3||typeof completed!=='boolean'||!decisions||decisionKeys.some(key=>!validChoice(decisions[key])))throw Error('Invalid mission checkpoint');
 const choice=Object.fromEntries(decisionKeys.map(key=>[key,decisions[key]]));
 if((phase>=2&&!choice.solar)||(phase>=3&&!choice.contacts)||(completed&&(phase!==3||!choice.strategy)))throw Error('Incomplete mission checkpoint');
 if((phase===1&&(choice.contacts!==null||choice.strategy!==null))||(phase===2&&choice.strategy!==null))throw Error('Unexpected future decision');
 return {v:1,model:MODEL_REVISION,design:clean,phase,decisions:choice,completed};
}
export function restoreCheckpoint(value,currentDesign){
 try{
  if(!value||value.v!==1||value.model!==MODEL_REVISION)return null;
  const saved=createCheckpoint(value.design,value.phase,value.decisions,value.completed),current=cleanDesign(currentDesign);
  if(designKeys.some(k=>saved.design[k]!==current[k]))return null;
  return {...saved,result:saved.completed?simulate(current,saved.decisions):null};
 }catch{return null}
}
export function readCheckpoint(storage,currentDesign){try{return restoreCheckpoint(JSON.parse(storage.getItem(PROGRESS_KEY)),currentDesign)}catch{return null}}
