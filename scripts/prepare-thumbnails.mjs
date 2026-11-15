// Regenerate lightweight catalogue previews with ImageMagick installed.
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {allObjects} from '../src/data.js';
mkdirSync('public/thumbs',{recursive:true});
for(const file of new Set(allObjects.map(object=>object.texture).filter(Boolean))){
 execFileSync('convert',[`public/textures/${file}`,'-resize','256x128!','-strip','-quality','76',`public/thumbs/${file}`]);
}
