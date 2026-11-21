import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {lottieFrame,validateLottie,localFrame} from '../src/timing.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('../assets/paper-sheet.json',import.meta.url)));
test('fps conversion, offset, loop and end hold',()=>{const d={fr:60,ip:10,op:130};assert.equal(lottieFrame(15,30,d),40);assert.equal(lottieFrame(100,30,d),129);assert.equal(lottieFrame(65,30,d,1,true),20);assert.equal(lottieFrame(-5,30,d),10);assert.equal(lottieFrame(15,30,d,2),70);assert.equal(localFrame(10,20,30),0);});
test('reject external assets, fonts, expressions and non-shape layers',()=>{validateLottie(fixture);for(const patch of [{assets:[{p:'https://example.com/x.png'}]},{fonts:{}},{layers:[{ty:5}]},{layers:[{ty:4,ks:{r:{x:'time*30'}}}]}])assert.throws(()=>validateLottie({...fixture,...patch}));});
test('invalid timing fails closed',()=>{for(const rate of [0,-1,NaN])assert.throws(()=>lottieFrame(10,30,fixture,rate));assert.throws(()=>validateLottie({...fixture,fr:0}));});
