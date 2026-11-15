import test from 'node:test';
import assert from 'node:assert/strict';
import {valueNoise,fractalNoise} from '../src/proceduralNoise.js';
test('illustrative noise is repeatable, bounded and varies with seed',()=>{
 for(const [x,y] of [[0,0],[.5,-1.2],[42.3,17.9]]){for(const fn of [valueNoise,fractalNoise]){const v=fn(x,y,123);assert.equal(v,fn(x,y,123));assert.ok(v>=0&&v<=1);assert.notEqual(v,fn(x,y,456))}}
});
