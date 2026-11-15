import {calculate} from './missionModel.js';

export const LIBRARY_KEY='cosmos-mission-library-v1';
export const MAX_DESIGNS=5;
const DESIGN_KEYS=['objective','orbit','bus','instrument','solar','radio','ground','launch','duration'];
export function cleanLibrary(value){
 if(!Array.isArray(value))return [];
 const seen=new Set(),out=[];
 for(const entry of value){
  if(out.length===MAX_DESIGNS)break;
  if(!entry||typeof entry.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(entry.id)||seen.has(entry.id)||typeof entry.name!=='string'||!entry.name.trim()||entry.name.length>48||typeof entry.savedAt!=='string'||!Number.isFinite(Date.parse(entry.savedAt)))continue;
  try{calculate(entry.design);const design=Object.fromEntries(DESIGN_KEYS.map(key=>[key,entry.design[key]]));out.push({id:entry.id,name:entry.name.trim(),savedAt:entry.savedAt,design});seen.add(entry.id)}catch{/* Ignore corrupted or outdated entries. */}
 }
 return out;
}
export function addLibraryDesign(library,name,design,id,savedAt){
 const entries=cleanLibrary(library);
 if(entries.length>=MAX_DESIGNS)throw new Error(`You can save up to ${MAX_DESIGNS} designs. Delete one to make space.`);
 if(typeof name!=='string'||!name.trim()||name.trim().length>48)throw new Error('Enter a name of 1–48 characters.');
 calculate(design);
 const next=cleanLibrary([...entries,{id,name:name.trim(),design,savedAt}]);
 if(next.length!==entries.length+1)throw new Error('Could not create this saved design.');
 return next;
}
