import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MapCache} from '../src/map-cache.js';
import {walking} from '../src/routes.js';
import {managementErrors} from '../scripts/manage-data.js';
const seed=JSON.parse(fs.readFileSync(new URL('../data/content.json',import.meta.url)));
test('缓存过期、容量限制与隔离副本',()=>{
 let now=0;const c=new MapCache({ttl:10,max:2,now:()=>now});c.set('a',{v:1});const copy=c.get('a');copy.v=99;assert.equal(c.get('a').v,1);c.set('b',{});c.set('c',{});assert.equal(c.get('a'),null);now=11;assert.equal(c.get('c'),null);c.clear();assert.equal(c.items.size,0);
});
test('相同有效路线命中缓存；入口改成待核和暂停开放不能借缓存绕过',async()=>{
 const data=structuredClone(seed),p=data.places[0],origin={latitude:31.5,longitude:120.3,type:'gcj02'};
 p.coordinate={...origin,latitude:31.501,verified:true,sourceId:data.sources[0].id};const c=new MapCache();let calls=0;
 const fake=async()=>{calls++;return{ok:true,json:async()=>({status:0,result:{routes:[{distance:100,duration:2,polyline:[31.5,120.3,1000,0],steps:[]}]}})}};
 const input={origin,placeIds:[p.id]},config={mapKey:'MOCK',publicMode:false};
 assert.equal((await walking(input,data,config,undefined,fake,c)).cacheHit,false);assert.equal((await walking(input,data,config,undefined,fake,c)).cacheHit,true);assert.equal(calls,1);
 p.coordinate.verified=false;p.mapCandidate.nearbyNavigationApproved=false;await assert.rejects(walking(input,data,config,undefined,fake,c),{code:'COORDINATE_PENDING'});
 p.coordinate.verified=true;p.opening={sourceId:data.sources[0].id,checkedAt:new Date().toISOString(),status:'closed'};await assert.rejects(walking(input,data,config,undefined,fake,c),{code:'PLACE_CLOSED'});
});
test('错误地图响应不入缓存且区分配额和授权',async()=>{
 const data=structuredClone(seed),origin={latitude:31.5,longitude:120.3,type:'gcj02'};data.places[0].coordinate={...origin,latitude:31.501,verified:true,sourceId:data.sources[0].id};const cache=new MapCache();
 for(const [status,code] of [[121,'MAP_QUOTA_EXCEEDED'],[112,'MAP_IP_DENIED']])await assert.rejects(walking({origin,placeIds:[data.places[0].id]},data,{mapKey:'mock'},undefined,async()=>({ok:true,json:async()=>({status})}),cache),{code});assert.equal(cache.items.size,0);
});
test('资料管理拒绝仅把地图POI标记为已核入口；证据坐标须匹配',()=>{
 const d=structuredClone(seed),p=d.places[0];assert.equal(managementErrors(d).length,0);p.coordinate={type:'gcj02',latitude:31.6,longitude:120.3,verified:true,sourceId:d.sources[0].id};assert(managementErrors(d).some(e=>e.includes('入口核验记录')));
 p.entranceEvidence={method:'onsite_record',reviewer:'测试审核者',checkedAt:'2026-01-01',position:'测试入口位置',record:'测试记录，仅用于测试，不是真实证据',sourceIds:[d.sources[0].id],coordinate:{latitude:31.6,longitude:120.3,type:'gcj02'}};assert.equal(managementErrors(d).length,0);p.entranceEvidence.coordinate.latitude=31.7;assert(managementErrors(d).some(e=>e.includes('不一致')));
});
