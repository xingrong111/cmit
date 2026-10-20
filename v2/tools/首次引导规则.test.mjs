import test from 'node:test';
import assert from 'node:assert/strict';
const saved=new Map();
globalThis.uni={getStorageSync:key=>saved.get(key),setStorageSync:(key,value)=>saved.set(key,value),removeStorageSync:key=>saved.delete(key),$emit(){}};
const fresh=()=>import('../frontend/src/lib/首次使用引导.js?test='+Math.random());
test('初次仅提示一次；跳过与完成分开，不覆盖阅读和学习数据',async()=>{
 saved.clear();saved.set('yingji:reading-v1',{existing:true});saved.set('learning-progress',{existing:true});
 const m=await fresh();assert.equal(m.shouldOfferGuide(),true);assert.equal(m.shouldOfferGuide(),false);
 m.saveGuide('skipped');assert.equal(m.guideState().status,'skipped');assert.equal((await fresh()).shouldOfferGuide(),false);
 m.saveGuide('completed');assert.equal(m.guideState().status,'completed');assert.deepEqual(saved.get('yingji:reading-v1'),{existing:true});assert.deepEqual(saved.get('learning-progress'),{existing:true});
});
test('旧版完成状态不强迫重新引导；手动重看请求只消费一次',async()=>{
 saved.clear();saved.set('shanhe:guide:v1','done');const m=await fresh();assert.equal(m.shouldOfferGuide(),false);
 m.requestQuickGuide();assert.equal(m.takeGuideRequest(),true);assert.equal(m.takeGuideRequest(),false);
});
test('损坏状态允许重新引导；存储不可用不阻塞公开阅读',async()=>{
 saved.clear();saved.set('shanhe:guide:v2',{status:'unknown'});const m=await fresh();assert.equal(m.shouldOfferGuide(),true);
 const getter=uni.getStorageSync;uni.getStorageSync=()=>{throw Error('unavailable');};assert.equal((await fresh()).shouldOfferGuide(),false);uni.getStorageSync=getter;
 assert.equal(m.saveGuide('invalid'),false);
});
