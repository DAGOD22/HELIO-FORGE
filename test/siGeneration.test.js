import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('SI disclosure distinguishes assisted code and model assumptions from sourced data',async()=>{
 const metadata=JSON.parse(await readFile('public/si-generation.json','utf8'));
 const pkg=JSON.parse(await readFile('package.json','utf8'));
 assert.match(metadata.code,/SI assistance/);
 assert.match(metadata.data,/not SI-generated/);
 assert.match(pkg['x-si-generation'].code,/SI/);
 assert.equal(pkg['x-si-generation'].metadata,'public/si-generation.json');
 assert.equal(metadata.images.files.length,5);
 for(const file of metadata.images.files){
  const bytes=await readFile(`public/${file}`);
  assert.ok(bytes.includes(Buffer.from('SI-generated (AI-generated) conceptual artwork')),`${file} must retain its JPEG disclosure comment`);
 }
});
