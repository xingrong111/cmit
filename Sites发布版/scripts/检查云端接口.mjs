import fs from 'node:fs';import path from 'node:path';import {pathToFileURL,fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {DatabaseSync} from 'node:sqlite';import assert from 'node:assert/strict';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),tmp=path.join(root,'.sites-runtime');fs.mkdirSync(tmp,{recursive:true});
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE app_state(key TEXT PRIMARY KEY,value TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1)');
globalThis.mockEnv={
 ADMIN_EMAILS:'reviewer@example.test',
 DB:{prepare(text){
  let bindings=[];
  return {
   bind(...v){bindings=v;return this},
   async first(){return sql.prepare(text).get(...bindings)||null},
   async all(){return {results:sql.prepare(text).all(...bindings)}},
   async run(){const r=sql.prepare(text).run(...bindings);return {meta:{changes:Number(r.changes)}}}
  };
 }}
};
const mock=path.join(tmp,'测试运行时.mjs');fs.writeFileSync(mock,'export const env=globalThis.mockEnv;');
const require=createRequire(import.meta.url),esbuild=require('../../V1/frontend/node_modules/esbuild');await esbuild.build({entryPoints:[path.join(root,'app/api/[...path]/route.ts')],outfile:path.join(tmp,'接口测试构建.mjs'),bundle:true,platform:'node',format:'esm',alias:{'cloudflare:workers':mock},logLevel:'silent'});
const api=await import(pathToFileURL(path.join(tmp,'接口测试构建.mjs')));
const users={a:{'oai-authenticated-user-id':'sites_learner_a','oai-authenticated-user-email':'a@example.test'},b:{'oai-authenticated-user-id':'sites_learner_b','oai-authenticated-user-email':'b@example.test'},admin:{'oai-authenticated-user-id':'sites_reviewer','oai-authenticated-user-email':'reviewer@example.test'}};
async function request(route,method='GET',data,user){const req=new Request('https://example.test/api/'+route,{method,headers:{'Content-Type':'application/json',...(users[user]||{})},...(data?{body:JSON.stringify(data)}:{})});const res=await api[method](req);return {status:res.status,data:await res.json()}}
assert.equal((await request('reading/people')).data.total,15);assert.equal((await request('account/me')).data.user,null);assert.equal((await request('learning/attempts','POST',{level_id:'QQB-入门'})).status,401);
assert.equal((await request('account/admin/dashboard','GET',null,'a')).status,403);
let r=await request('account/comments','POST',{topicId:'P009',content:'核对来源后再讨论。'},'a');assert.equal(r.status,201);const id=r.data.item.id;
assert.equal((await request('account/comments')).data.items.length,0);
assert.equal((await request('account/comments/'+id,'PUT',{version:1,content:'越权修改'},'b')).status,404);
assert.equal((await request('account/admin/comments/'+id+'/review','POST',{version:1,decision:'approved'},'admin')).status,200);
const publicComments=(await request('account/comments')).data.items;assert.equal(publicComments.length,1);assert(!publicComments[0].author.id);assert(!publicComments[0].history);
assert.equal((await request('account/admin/comments/'+id+'/review','POST',{version:1,decision:'rejected',reason:'旧版本'},'admin')).status,409);
r=await request('learning/attempts','POST',{level_id:'QQB-入门'},'a');assert.equal(r.status,201);const attempt=r.data;assert.equal(attempt.total,5);assert(!JSON.stringify(attempt).includes('correct_answer'));
assert.equal((await request('learning/attempts/'+attempt.id,'GET',null,'b')).status,404);
for(const q of attempt.questions){r=await request('learning/attempts/'+attempt.id+'/answers','POST',{question_id:q.id,choice:q.options[0].key},'a');assert.equal(r.status,200)}assert(r.data.finished);
assert((await request('learning/levels','GET',null,'a')).data.items.find(x=>x.id==='QQB-入门').completed);
assert.equal((await request('learning/attempts','POST',{level_id:'QQB-进阶'},'a')).data.total,8);
assert.equal((await request('guide/config')).status,200);assert((await request('guide/places')).data.items.length>0);
const chat=await request('guide/chat','POST',{question:'你叫什么名字？',history:[]});assert.equal(chat.status,200);assert(chat.data.answer.includes('小迹'));
sql.close();console.log('云端适配接口检查通过：身份、管理员权限、评论先审后发、版本冲突、学习归属、抽题与恢复、地点和小迹基础对话。');fs.writeFileSync(path.join(root,'云端接口检查.json'),JSON.stringify({passed:true,reading:true,account:true,moderation:true,ownership:true,learning:true,guide:true,liveProviderTest:false},null,2));
