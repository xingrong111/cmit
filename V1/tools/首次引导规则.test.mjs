import test from 'node:test';
import assert from 'node:assert/strict';
const saved=new Map();
globalThis.uni={getStorageSync:key=>saved.get(key),setStorageSync:(key,value)=>saved.set(key,value),removeStorageSync:key=>saved.delete(key)};
const fresh=()=>import('../frontend/src/lib/新手任务.js?test='+Math.random());
test('上手三步按真实行为逐项记录，重复触发不重复写入，且不影响阅读与学习数据',async()=>{
 saved.clear();saved.set('yingji:reading-v1',{existing:true});saved.set('learning-progress',{existing:true});
 const m=await fresh();assert.equal(m.doneCount.value,0);assert.equal(m.onboard.value.cardClosed,false);
 m.markTask('person');const first=m.onboard.value.tasks.person;m.markTask('person');assert.equal(m.onboard.value.tasks.person,first);
 m.markTask('unknown');assert.equal(m.doneCount.value,1);
 m.markTask('source');m.markTask('ask');assert.equal(m.allDone.value,true);
 assert.deepEqual(saved.get('yingji:reading-v1'),{existing:true});assert.deepEqual(saved.get('learning-progress'),{existing:true});
 assert.equal((await fresh()).doneCount.value,3);
});
test('页面小提示只记录一次；关闭任务卡与重置互不影响阅读数据',async()=>{
 saved.clear();const m=await fresh();
 assert.equal(m.tipSeen('people'),false);m.dismissTip('people');assert.equal(m.tipSeen('people'),true);
 m.closeTaskCard();assert.equal((await fresh()).onboard.value.cardClosed,true);
 m.resetOnboard();assert.equal(m.tipSeen('people'),false);assert.equal(m.onboard.value.cardClosed,false);assert.equal(m.doneCount.value,0);
});
test('看过旧版弹窗导览的用户不再被打扰；损坏状态可重新引导；存储不可用不阻塞阅读',async()=>{
 saved.clear();saved.set('shanhe:guide:v2',{version:2,status:'completed',at:1});
 assert.equal((await fresh()).onboard.value.cardClosed,true);
 saved.clear();saved.set('shanhe:guide:v2',{status:'unknown'});assert.equal((await fresh()).onboard.value.cardClosed,false);
 const getter=uni.getStorageSync,setter=uni.setStorageSync;
 uni.getStorageSync=()=>{throw Error('unavailable')};uni.setStorageSync=()=>{throw Error('unavailable')};
 const m=await fresh();assert.equal(m.onboard.value.cardClosed,false);m.markTask('person');assert.equal(m.doneCount.value,1);
 uni.getStorageSync=getter;uni.setStorageSync=setter;
});
