import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LIGHT_YEARS_PER_PARSEC,SUN_GALACTIC_RADIUS_LY,equatorialToGalactic,starPositionLy,schematicGalaxy} from '../src/galaxyModel.js';

test('J2000 equatorial-to-Galactic rotation preserves distance and points to galactic center',()=>{
 const v=equatorialToGalactic(266.4051/15,-28.936175,42);
 assert.ok(Math.abs(v[0]-42)<.0001);assert.ok(Math.abs(v[1])<.0001);assert.ok(Math.abs(v[2])<.0001);
 for(const [ra,dec] of [[0,0],[6,0],[18.5,38.7],[14.49,-62.68]])assert.ok(Math.abs(Math.hypot(...equatorialToGalactic(ra,dec,12.34))-12.34)<1e-8);
});
test('local catalogue stars use physical distances relative to the Sun',async()=>{
 const stars=JSON.parse(await readFile(new URL('../public/data/hyg-nearby-20pc.json',import.meta.url),'utf8'));
 assert.equal(stars.length,1900);assert.equal(new Set(stars.map(s=>s.id)).size,stars.length);
 assert.ok(stars.every(s=>s.dist>0&&s.dist<=20&&s.ra>=0&&s.ra<24&&s.dec>=-90&&s.dec<=90));
 const proxima=stars.find(s=>s.id===70666),sirius=stars.find(s=>s.id===32263);
 assert.equal(proxima.name,'Proxima Centauri');assert.equal(sirius.name,'Sirius');
 assert.ok(Math.abs(proxima.dist*LIGHT_YEARS_PER_PARSEC-4.226)<.01);
 const [x,y,z]=starPositionLy(sirius);
 assert.ok(Math.abs(Math.hypot(x-SUN_GALACTIC_RADIUS_LY,y,z)-sirius.dist*LIGHT_YEARS_PER_PARSEC)<1e-8);
});
test('schematic galaxy is deterministic and finite',()=>{
 const a=schematicGalaxy(500,123),b=schematicGalaxy(500,123);
 assert.equal(a.positions.length,1500);assert.deepEqual(a.positions,b.positions);assert.deepEqual(a.colors,b.colors);
 assert.ok(a.positions.every(Number.isFinite));assert.ok(a.colors.every(n=>n>=0&&n<=1));
});

test('curated deep-sky pointings retain source distances and map to the correct solar separation',async()=>{
 const {DEEP_SKY,DEEP_SKY_BY_ID,DEEP_SKY_IMAGES}=await import('../src/deepSky.js');
 const {positionFromEquatorialLy}=await import('../src/galaxyModel.js');
 assert.equal(DEEP_SKY.length,9);
 assert.equal(new Set(DEEP_SKY.map(o=>o.id)).size,DEEP_SKY.length);
 for(const object of DEEP_SKY){
  assert.equal(DEEP_SKY_BY_ID['dso:'+object.id],object);
  assert.ok(object.ra>=0&&object.ra<24&&object.dec>=-90&&object.dec<=90&&object.distanceLy>0);
  assert.ok(object.source.startsWith('https://science.nasa.gov/'));
  const [x,y,z]=positionFromEquatorialLy(object.ra,object.dec,object.distanceLy);
  assert.ok(Math.abs(Math.hypot(x-SUN_GALACTIC_RADIUS_LY,y,z)-object.distanceLy)<1e-5);
  const image=DEEP_SKY_IMAGES[object.id];
  if(image){assert.ok(image.credit&&image.source.startsWith('https://science.nasa.gov/'));const file=await readFile(new URL(`../public/deepsky/${image.file}`,import.meta.url));assert.equal(file[0],0xff);assert.equal(file[1],0xd8);}
 }
 assert.equal(DEEP_SKY_BY_ID['dso:orion'].distanceLy,1500);
 assert.equal(DEEP_SKY_BY_ID['dso:hercules'].distanceLy,25000);
 assert.equal(DEEP_SKY_IMAGES.pleiades,undefined);
});

test('optional HYG shell has expected count, range, identities and ordering',async()=>{
 const inner=JSON.parse(await readFile(new URL('../public/data/hyg-nearby-20pc.json',import.meta.url)));
 const outer=JSON.parse(await readFile(new URL('../public/data/hyg-shell-20-50pc.json',import.meta.url)));
 assert.equal(outer.length,6849);const all=[...inner,...outer];assert.equal(new Set(all.map(s=>s.id)).size,8749);
 assert.ok(outer.every(s=>s.dist>20&&s.dist<=50&&s.ra>=0&&s.ra<24&&s.dec>=-90&&s.dec<=90));
 assert.ok(all.every((s,i)=>!i||s.dist>=all[i-1].dist));
 const aldebaran=outer.find(s=>s.name==='Aldebaran'),regulus=outer.find(s=>s.name==='Regulus');
 assert.equal(aldebaran.id,21368);assert.equal(aldebaran.hip,'21421');assert.equal(aldebaran.dist,20.4332);assert.equal(aldebaran.absmag,-.682);assert.equal(aldebaran.ci,1.538);assert.equal(regulus.hip,'49669');
});
test('color magnitude coordinates and catalogue filtering preserve missing values',async()=>{
 const {chartable,chartPosition,matchesStar,spectralGroup,validStarShell}=await import('../src/starCatalog.js');
 const inner=JSON.parse(await readFile(new URL('../public/data/hyg-nearby-20pc.json',import.meta.url)));
 const outer=JSON.parse(await readFile(new URL('../public/data/hyg-shell-20-50pc.json',import.meta.url)));
 const stars=[...inner,...outer],s=stars.find(x=>x.name==='Aldebaran');
 assert.equal(validStarShell(outer,inner),true);assert.equal(validStarShell([],inner),false);assert.equal(validStarShell([inner[0]],inner),false);assert.equal(validStarShell([{...outer[0],ra:Infinity}],inner),false);assert.equal(validStarShell([outer[0],outer[0]],inner),false);
 assert.equal(stars.filter(chartable).length,7874);assert.equal(chartable({ci:null,absmag:1}),false);assert.equal(chartable({ci:1,absmag:NaN}),false);assert.equal(chartPosition({ci:1,absmag:21}),null);
 assert.deepEqual(chartPosition({ci:-.5,absmag:-5}),[0,0]);assert.deepEqual(chartPosition({ci:3,absmag:20}),[1,1]);
 assert.equal(spectralGroup(s),'K');assert.equal(spectralGroup({spect:null}),'other');assert.equal(spectralGroup({spect:'sdM'}),'other');
 for(const query of ['aldebaran','HIP 21421','HD 29139','Gl 171.1A','87Alp Tau','HYG 21368'])assert.equal(matchesStar(s,query),true,query);
 assert.equal(matchesStar(s,'aldebaran','M'),false);assert.equal(matchesStar(s,'aldebaran','K'),true);
});

test('nearest-neighbor guides use static HYG 3D separations and the loaded subset only',async()=>{
 const {closestCatalogStars}=await import('../src/galaxyModel.js');
 const stars=JSON.parse(await readFile(new URL('../public/data/hyg-nearby-20pc.json',import.meta.url))),proxima=stars.find(s=>s.id===70666);
 const close=closestCatalogStars(proxima,stars,5);assert.equal(close.length,5);assert.deepEqual(close.slice(0,2).map(a=>a.star.id),[71453,71456]);assert.ok(Math.abs(close[0].distanceLy-.1878927978)<1e-7);
 assert.ok(close.every((v,i)=>v.star.id!==proxima.id&&Number.isFinite(v.distanceLy)&&(i===0||v.distanceLy>=close[i-1].distanceLy)));
 assert.deepEqual(closestCatalogStars(proxima,[proxima],5),[]);assert.deepEqual(closestCatalogStars(null,stars),[]);assert.deepEqual(closestCatalogStars(proxima,stars,0),[]);
 const identical={...proxima,id:999999};assert.equal(closestCatalogStars(proxima,[identical],1)[0].distanceLy,0);
});

test('dense illustrative galaxy supports a million-point budget without invalid coordinates',()=>{
 const data=schematicGalaxy(1200000,81024);
 assert.equal(data.positions.length,3600000);assert.equal(data.colors.length,3600000);
 for(let i=0;i<data.positions.length;i+=1379){assert.ok(Number.isFinite(data.positions[i]));assert.ok(data.colors[i]>=0&&data.colors[i]<=1)}
});
