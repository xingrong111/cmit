import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createApp} from '../src/server.js';
import {publicPlace,validateData} from '../src/domain.js';
import {walking} from '../src/routes.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/content.json',import.meta.url),'utf8'));
const sources=Object.fromEntries(data.sources.map(s=>[s.id,s]));
test('五馆附近导航独立放行，不提升游客入口，正式模式隐藏候选',async()=>{
 for(const p of data.places){assert(p.mapCandidate?.displayApproved);const preview=publicPlace(p,sources);assert.equal(preview.candidateMapReady,true);assert.equal(preview.navigationReady,false);assert.equal(preview.coordinate,null);assert.equal(preview.routeReady,true);assert.equal(preview.destinationKind,'venue_area');assert.equal(preview.distanceMeters,null);assert.equal(publicPlace(p,sources,undefined,true).mapCandidate,null);}
 const unapproved=structuredClone(data);unapproved.places[0].mapCandidate.nearbyNavigationApproved=false;await assert.rejects(walking({origin:{latitude:31.5,longitude:120.3,type:'gcj02'},placeIds:['PLACE-WX-LDY']},unapproved,{publicMode:false,mapKey:'MOCK'}),{code:'COORDINATE_PENDING'});
});
test('地图候选必须保留来源与未核入口状态',()=>{
 const broken=structuredClone(data);broken.places[0].mapCandidate.entranceVerified=true;assert(validateData(broken).some(e=>e.includes('地图候选依据无效')));
});
test('五场馆服务逐项有来源，旧公告不升级当前营业，未知设施不补写',()=>{
 assert.deepEqual(validateData(data),[]);
 for(const p of data.places){
  const result=publicPlace(p,sources);
  assert.equal(result.opening.status,'unknown');assert.equal(result.navigationReady,false);
  for(const row of result.visitorService.entries){if(row.status==='source_record')assert(row.sourceIds.length);}
  for(const key of ['accessibility','photography'])assert.equal(result.visitorService.entries.find(r=>r.key===key).status,'unknown');
 }
 const qqb=publicPlace(data.places.find(p=>p.id==='PLACE-CZ-QQB'),sources);
 assert.equal(qqb.visitorService.contacts[0].number,'0519-86636909');assert(qqb.visitorService.contacts[0].sourceIds.includes('L-S03'));
 const ldy=publicPlace(data.places.find(p=>p.id==='PLACE-WX-LDY'),sources);
 assert.equal(ldy.visitorService.contacts.length,0); // Platform phone must not enter official contacts.
});
test('服务引用不得丢失或串到未关联来源，不能采用网站技术电话',()=>{
 const broken=structuredClone(data);broken.places[0].visitorInfo.contacts=[{label:'电话',number:'0510-11111111',sourceIds:['NO-SOURCE']}];assert(validateData(broken).some(e=>e.includes('联系电话依据无效')));
 const broken2=structuredClone(data);broken2.places[0].visitorInfo.hours={text:'每日开放',sourceIds:['SRC-QQB-XH2018']};assert(validateData(broken2).some(e=>e.includes('参观信息来源无效')));
});
test('待复核照片只用于试读，正式模式不能随场馆状态自动放行',async()=>{
 const p=data.places.find(p=>p.id==='PLACE-CZ-QQB');assert(publicPlace(p,sources).photo);assert.equal(publicPlace(p,sources,undefined,true).photo,null);
 const cloned=structuredClone(data);
 const q=cloned.places.find(p=>p.id==='PLACE-CZ-QQB');q.reviewStatus='verified';q.published=true;
 const server=createApp({data:cloned,config:{publicMode:true}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const resp=await fetch('http://127.0.0.1:'+server.address().port+'/media/venues/qqb-2017.jpg');assert.equal(resp.status,404);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});


test('附近步行路线以明确批准的地图点为终点，保留来源且不写成入口',async()=>{
 const p=data.places[0];const result=await walking({origin:{latitude:31.64,longitude:120.29,type:'gcj02'},placeIds:[p.id]},data,{publicMode:false,mapKey:'MOCK'},undefined,async url=>{assert.equal(new URL(url).searchParams.get('to'),p.mapCandidate.coordinate.latitude+','+p.mapCandidate.coordinate.longitude);return {ok:true,json:async()=>({status:0,result:{routes:[{distance:400,duration:6,polyline:[31.64,120.29,2796,3782],steps:[]}]}})};});assert.equal(result.destinationScope,'venue_area');assert.equal(result.legs[0].sourceId,p.mapCandidate.sourceId);assert(result.notice.includes('实际游客入口'));assert.equal(p.coordinate,null);
});
