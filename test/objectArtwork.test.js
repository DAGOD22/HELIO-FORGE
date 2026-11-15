import test from 'node:test';
import assert from 'node:assert/strict';
import {artworkSeed,planetPalette,starPalette,planetPattern} from '../src/objectArtwork.js';
test('procedural object artwork is deterministic and identity dependent',()=>{
 assert.equal(artworkSeed('Proxima Cen b'),artworkSeed('Proxima Cen b'));
 assert.notEqual(artworkSeed('Proxima Cen b'),artworkSeed('Proxima Cen d'));
 assert.deepEqual(planetPalette('Proxima Cen b'),planetPalette('Proxima Cen b'));
});
test('stellar colors use available broad catalogue color, with an honest neutral fallback',()=>{
 assert.notEqual(starPalette({ci:0}).middle,starPalette({ci:2}).middle);
 assert.equal(starPalette({ci:null,bpRp:null}).basis,'neutral color (index unavailable)');
 assert.equal(starPalette({bpRp:2}).basis,'broad catalogue color band');
});

test('planet illustration patterns vary by identity and remain reproducible',()=>{
 const names=['Proxima Cen b','Proxima Cen d','55 Cnc b','55 Cnc c','55 Cnc e','GJ 876 b'];
 assert.ok(new Set(names.map(planetPattern)).size>=2);
 for(const name of names)assert.equal(planetPattern(name),planetPattern(name));
});
