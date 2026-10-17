import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {guide} from '../src/guide.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/content.json',import.meta.url),'utf8'));
const context={module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(new URL('../../miniprogram/utils/itinerary.js',import.meta.url),'utf8'),context);
const summary=context.module.exports.summary;
test('停留预算与实际步行分开；没有地图响应时不编造总时长',()=>{
 const v=summary([{id:'a'},{id:'b'}],{a:15,b:45},null,60);
 assert.equal(v.visitMinutes,60);assert.equal(v.walkMinutes,null);assert.equal(v.totalMinutes,null);assert.equal(v.overBudget,false);
 const actual=summary([{id:'a'},{id:'b'}],{a:15,b:45},{durationMinutes:12.2},60);
 assert.equal(actual.totalMinutes,73);assert.equal(actual.overBudget,true);
});
test('损坏本机停留预算不能造成负时长或错误总时长',()=>{
 assert.equal(summary([{id:'a'},{id:'b'}],{a:-999,b:'伪造'},null,60).visitMinutes,60);
});
test('地点导览卡仅取知识库地点，待核入口不能变成可导航',async()=>{
 const result=await guide({question:'无锡文化路线怎么安排？',guideContext:{city:'无锡市'}},data,{publicMode:false,modelKey:''});
 assert(result.placeCards.length>0);
 for(const card of result.placeCards){const original=data.places.find(p=>p.id===card.id);assert(original);assert.equal(card.summary,original.summary);assert.equal(card.navigationReady,false);}
 assert(result.followUps.length>0);
 const published=await guide({question:'无锡文化路线怎么安排？',guideContext:{city:'无锡市'}},data,{publicMode:true,modelKey:''});assert.equal(published.placeCards.length,0);
});
test('地点页追问看点沿用当前场馆，不串场或编造参观内容',async()=>{
 const place=data.places.find(p=>p.id==='PLACE-WX-LDY');
 const result=await guide({question:'这里有哪些参观看点？',placeId:place.id,guideContext:{city:place.city}},data,{publicMode:false,modelKey:''});
 assert.equal(result.placeCards.length,1);assert.equal(result.placeCards[0].id,place.id);
 for(const focus of place.visitFocus)assert(result.answer.includes(focus));
});
