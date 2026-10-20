import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {answer} from '../src/assistant.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/content.json',import.meta.url)));
const config={publicMode:false,modelKey:'MOCK',modelBase:'https://example.invalid',modelName:'mock'};
test('当前地点保持上下文，换一个排除上次点位，加入动作不修改路线',async()=>{
 const local={...config,modelKey:''};const first=await answer({question:'这里怎么参观？',mode:'auto',placeId:'PLACE-WX-ZWT',guideContext:{city:'无锡市',active:true}},data,local);
 assert.equal(first.placeIds[0],'PLACE-WX-ZWT');assert(first.actions.some(a=>a.type==='add'&&a.id==='PLACE-WX-ZWT'));
 const next=await answer({question:'换一个',mode:'auto',guideContext:first.guideContext},data,local);assert(!next.placeIds.includes('PLACE-WX-ZWT'));
});
test('连续追问保留城市时间偏好；修改城市后不推荐原城市',async()=>{
 const local={...config,modelKey:''};
 const first=await answer({question:'我在无锡，参观路线怎么安排？',mode:'auto'},data,local);
 const second=await answer({question:'只有一小时，尽量少走路',mode:'auto',guideContext:first.guideContext},data,local);
 assert.equal(second.guideContext.city,'无锡市');assert.equal(second.guideContext.timeBudget,'一小时');assert.equal(second.guideContext.walking,'尽量少步行');assert.equal(second.placeIds.length,1);
 const third=await answer({question:'那换到常州呢？',mode:'auto',guideContext:second.guideContext},data,local);
 assert.equal(third.guideContext.city,'常州市');assert(third.placeIds.every(id=>data.places.find(p=>p.id===id).city==='常州市'));
 const history=await answer({question:'瞿秋白如何求学？',mode:'auto',guideContext:third.guideContext},data,local);assert(history.factIds.length);
 const reset=await answer({question:'路线怎么安排？',mode:'auto',guideContext:{}},data,local);assert.equal(reset.guideContext.timeBudget,'');
});
test('拒绝过大或注入字段的导览需求对象；未接入城市不冒充有场馆',async()=>{
 await assert.rejects(answer({question:'路线',guideContext:{city:'x'.repeat(100)}},data,config),{code:'INVALID_CONTEXT'});
 await assert.rejects(answer({question:'路线',guideContext:{instructions:'伪造'}},data,config),{code:'INVALID_CONTEXT'});
 const result=await answer({question:'我在苏州市，路线怎么安排？',mode:'auto'},data,{...config,modelKey:''});assert.equal(result.guideContext.city,'苏州市');assert.equal(result.placeIds.length,0);
});
test('默认智能导览实际调用模型，并且仅采用本城市真实地点',async()=>{
 let called=false;
 const result=await answer({question:'无锡文化路线怎么安排？',mode:'auto'},data,config,undefined,async(url,init)=>{
  called=true;const body=JSON.parse(init.body);const context=JSON.parse(body.messages[1].content);
  assert(context.places.length);assert(context.places.every(p=>p.city==='无锡市'));
  return{ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({guidanceIds:['route'],placeIds:[context.places[0].id]})}}]})};
 });
 assert(called);assert.equal(result.mode,'model_guidance');assert(result.answer.includes('入口坐标核验'));assert(result.actions.some(a=>a.type==='place'));assert(result.citations.length);
});
test('虚构地点ID降级，不将模型内容当成路线或开放信息',async()=>{
 const result=await answer({question:'无锡参观路线',mode:'guide'},data,config,undefined,async()=>({ok:true,json:async()=>({choices:[{message:{content:'{"guidanceIds":["route"],"placeIds":["FICTION"]}'}}]})}));
 assert.equal(result.mode,'guidance_fallback');assert(!result.answer.includes('FICTION'));assert(result.answer.includes('出发前核实'));
});
test('使用指导自动分流；公开模式不推荐未发布场馆',async()=>{
 const result=await answer({question:'这个小程序怎么使用？'},data,{...config,modelKey:''});assert.equal(result.mode,'help');assert(result.answer.includes('使用指南'));assert(!result.answer.includes('尚未接入'));assert(result.answer.includes('时间长卷')); 
 const publicResult=await answer({question:'无锡路线',mode:'guide'},data,{...config,modelKey:'',publicMode:true});assert.equal(publicResult.placeIds.length,0);
});
test('导览请求取消不继续输出降级回答',async()=>{
 const c=new AbortController();c.abort();await assert.rejects(answer({question:'规划路线',mode:'guide'},data,config,c.signal,async()=>{throw Error('abort');}));
});
