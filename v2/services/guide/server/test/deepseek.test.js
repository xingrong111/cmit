import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {answer} from '../src/assistant.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/content.json',import.meta.url),'utf8'));
const config={publicMode:false,modelKey:'TEST-NOT-A-SECRET',modelBase:'https://api.deepseek.com',modelName:'deepseek-flash'};
test('DeepSeek普通对话、史料选择和地点推荐采用官方路径与JSON非思考参数',async()=>{
 for(const question of ['你叫什么名字？','瞿秋白如何求学？','无锡文化路线怎么安排？']){
  let calls=0;
  const result=await answer({question},data,config,undefined,async(url,init)=>{
   calls++;assert.equal(url,'https://api.deepseek.com/chat/completions');assert.equal(init.headers.Authorization,'Bearer TEST-NOT-A-SECRET');
   const body=JSON.parse(init.body);assert.equal(body.model,'deepseek-flash');assert.equal(body.thinking.type,'disabled');assert.equal(body.response_format.type,'json_object');assert(body.messages[0].content.includes('JSON'));
   const content=body.messages[0].content.includes('factIds')?{factIds:['FACT-QQB-STUDY']}:body.messages[0].content.includes('guidanceIds')?{guidanceIds:['route'],placeIds:['PLACE-WX-LDY']}:{intent:'chat',reply:'我叫小迹。'};
   return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(content)}}]})};
  });assert(calls>=1);assert.equal(result.modelStatus,'available');
 }
});
test('认证、余额及限流错误分别提示，不能把配置错误写成没有史料',async()=>{
 for(const [status,code] of [[401,'MODEL_AUTH_FAILED'],[402,'MODEL_BALANCE_REQUIRED'],[429,'MODEL_RATE_LIMITED']]){
  const result=await answer({question:'你好'},data,config,undefined,async()=>({ok:false,status}));
  assert.equal(result.modelError,code);assert.equal(result.modelStatus,'unavailable');assert(!result.answer.includes('没有资料'));
 }
});

