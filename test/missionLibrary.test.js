import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_DESIGN} from '../src/missionModel.js';
import {addLibraryDesign,cleanLibrary,MAX_DESIGNS} from '../src/missionLibrary.js';
const time='2026-11-14T00:00:00.000Z';
test('save and sanitize named local designs without other fields',()=>{
 const design={...DEFAULT_DESIGN,private:'not included'};
 const list=addLibraryDesign([], '  Earth study  ',design,'a-1',time);
 assert.equal(list[0].name,'Earth study');assert.equal(list[0].design.private,undefined);assert.deepEqual(list[0].design,DEFAULT_DESIGN);
 assert.deepEqual(cleanLibrary([null,{},...list,list[0],{...list[0],id:'bad!'}]),list);
});
test('validates corrupted, invalid and over-limit data',()=>{
 assert.deepEqual(cleanLibrary(null),[]);assert.throws(()=>addLibraryDesign([],'  ',DEFAULT_DESIGN,'a',time));
 assert.throws(()=>addLibraryDesign([],'x'.repeat(49),DEFAULT_DESIGN,'a',time));
 assert.throws(()=>addLibraryDesign([],'x',{...DEFAULT_DESIGN,radio:'constructor'},'a',time));
 let entries=[];for(let i=0;i<MAX_DESIGNS;i++)entries=addLibraryDesign(entries,`Design ${i}`,DEFAULT_DESIGN,`item-${i}`,time);
 assert.throws(()=>addLibraryDesign(entries,'One more',DEFAULT_DESIGN,'extra',time),/up to 5/);
 assert.throws(()=>addLibraryDesign(entries.slice(0,1),'duplicate id',DEFAULT_DESIGN,'item-0',time));
});
test('saved designs without campaign conditions migrate to standard campaign',()=>{
 const {scenario,...old}=DEFAULT_DESIGN;
 const entries=cleanLibrary([{id:'old',name:'Legacy',savedAt:time,design:old}]);
 assert.deepEqual(entries[0].design,DEFAULT_DESIGN);
});
