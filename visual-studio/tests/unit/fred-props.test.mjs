import test from 'node:test';import assert from 'node:assert/strict';
import {validateFredProps,fredDefaults} from '../../src/references/fred-props.mjs';
test('FredTalk custom content and timing parameters survive validation',()=>{const p=validateFredProps({...fredDefaults,steps:['甲','乙','丙'],highlight:2,speed:2});assert.deepEqual(p.steps,['甲','乙','丙']);assert.equal(p.speed,2);});
test('FredTalk refuses incomplete/oversized steps, colors and out-of-range clocks',()=>{for(const patch of [{steps:['a','b']},{steps:Array(10).fill('a')},{steps:['','b','c']},{steps:['a'.repeat(17),'b','c']},{speed:0},{speed:NaN},{accent:'red'},{highlight:99},{title:'a'.repeat(31)}])assert.throws(()=>validateFredProps({...fredDefaults,...patch}));});
