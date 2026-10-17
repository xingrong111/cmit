import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MapCache} from '../src/map-cache.js';
import {poiCandidates} from '../src/poi.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/content.json',import.meta.url)));
test('POI合并并发、命中缓存，结果不能批准入口',async()=>{
 let calls=0;const cache=new MapCache();const fetcher=async()=>{calls++;await new Promise(r=>setTimeout(r,10));return{ok:true,json:async()=>({status:0,data:[{id:'test',title:'测试候选',location:{lat:31.5,lng:120.3}}]})};};
 const query=()=>poiCandidates({placeId:data.places[0].id},data,{mapKey:'mock'},undefined,fetcher,cache);
 const values=await Promise.all([query(),query(),query()]);assert.equal(calls,1);assert.equal(values[1].coalesced,true);assert.equal(values[0].items[0].entranceVerified,false);assert.equal((await query()).cacheHit,true);
});
test('单个订阅者取消不终止其他订阅者；全部取消则中止上游',async()=>{
 const c=new MapCache(),a=new AbortController();let upstream;
 const producer=signal=>{upstream=signal;return new Promise(resolve=>setTimeout(()=>resolve({ok:true}),15));};
 const one=c.run('x',producer,a.signal),two=c.run('x',producer);a.abort();await assert.rejects(one);assert.equal((await two).ok,true);assert.equal(upstream.aborted,false);
 const b=new AbortController();let stopped=false;const cancelled=c.run('y',signal=>new Promise((_,reject)=>{signal.addEventListener('abort',()=>{stopped=true;reject(Error('aborted'));});}),b.signal);await Promise.resolve();b.abort();await assert.rejects(cancelled);assert.equal(stopped,true);assert.equal(c.get('y'),null);
});
test('POI错误不缓存；相同失败请求清理后可重试',async()=>{
 const c=new MapCache();let calls=0;const call=()=>poiCandidates({placeId:data.places[0].id},data,{mapKey:'mock'},undefined,async()=>{calls++;return{ok:true,json:async()=>({status:121})};},c);
 await assert.rejects(call(),{code:'MAP_QUOTA_EXCEEDED'});await assert.rejects(call());assert.equal(calls,2);assert.equal(c.pending.size,0);
});
import {createApp} from '../src/server.js';
import {once} from 'node:events';
test('本机候选工具HTTP并发共用一次上游，公开模式禁用',async()=>{
 let calls=0;const server=createApp({data,config:{mapKey:'mock',publicMode:false},fetcher:async()=>{calls++;await new Promise(r=>setTimeout(r,20));return{ok:true,json:async()=>({status:0,data:[]})};}});server.listen(0,'127.0.0.1');await once(server,'listening');
 try{const url=`http://127.0.0.1:${server.address().port}/api/poi-candidates`;const responses=await Promise.all(Array.from({length:4},()=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({placeId:data.places[0].id})})));assert(responses.every(r=>r.status===200));assert.equal(calls,1);}
 finally{await new Promise(r=>server.close(r));}
 const publicServer=createApp({data,config:{mapKey:'mock',publicMode:true}});publicServer.listen(0,'127.0.0.1');await once(publicServer,'listening');try{const response=await fetch(`http://127.0.0.1:${publicServer.address().port}/api/poi-candidates`,{method:'POST',body:'{}'});assert.equal(response.status,403);}finally{await new Promise(r=>publicServer.close(r));}
});
