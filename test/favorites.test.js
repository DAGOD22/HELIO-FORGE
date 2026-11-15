import test from 'node:test';
import assert from 'node:assert/strict';
import {readFavorites,saveFavorites} from '../src/favorites.js';
test('favorites tolerate invalid and inaccessible storage',()=>{
 const storage={getItem:()=>'{bad',setItem:()=>{throw Error('blocked')}};
 assert.deepEqual(readFavorites(storage),[]);assert.equal(saveFavorites(storage,['earth']),false);
 assert.deepEqual(readFavorites({getItem:()=>'{"unexpected":true}'}),[]);
 assert.deepEqual(readFavorites({getItem:()=>JSON.stringify(['earth',1,'mars','earth',null])}),['earth','mars']);
 assert.deepEqual(readFavorites({getItem:()=>{throw Error('blocked')}}),[]);
 let saved;assert.equal(saveFavorites({setItem:(_key,v)=>{saved=v}},['earth']),true);assert.equal(saved,'["earth"]');
});
