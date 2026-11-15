import {calculate} from './missionModel.js';

// Compact versioned link format; results and personal data are never included.
const KEYS=['objective','orbit','bus','instrument','solar','radio','ground','launch','duration','scenario'];
export function encodeDesign(design){
 calculate(design);
 return JSON.stringify({v:2,d:KEYS.map(key=>key==='scenario'?(design.scenario??'nominal'):design[key])});
}
export function decodeDesign(text){
 if(typeof text!=='string'||text.length>500)throw new Error('Invalid mission link');
 let data;try{data=JSON.parse(text)}catch{throw new Error('Invalid mission link')}
 if(!data||![1,2].includes(data.v)||!Array.isArray(data.d)||data.d.length!==(data.v===1?KEYS.length-1:KEYS.length)||data.d.some(v=>typeof v!=='string'))throw new Error('Invalid mission link');
 const design=Object.fromEntries(KEYS.map((key,i)=>[key,key==='scenario'&&data.v===1?'nominal':data.d[i]]));
 calculate(design);
 return design;
}
export function makeMissionUrl(currentUrl,design){
 const url=new URL(currentUrl);url.search='';url.hash='';url.searchParams.set('mission',encodeDesign(design));
 return url.toString();
}
export function inspectMissionUrl(currentUrl){
 const url=new URL(currentUrl);
 if(!url.searchParams.has('mission'))return {status:'none'};
 if(url.searchParams.getAll('mission').length!==1)return {status:'invalid'};
 try{return {status:'valid',design:decodeDesign(url.searchParams.get('mission'))}}catch{return {status:'invalid'}}
}
