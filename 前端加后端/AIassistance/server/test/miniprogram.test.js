import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const mini = new URL('../../miniprogram/', import.meta.url);
test('助手加入路线需点击且保存到本机；重复点击不重复添加',()=>{
 const saved=[];const {p,app}=page('pages/assistant/index.js',{'../../utils/api':{},wx:{setStorageSync:(k,v)=>saved.push([...v]),showToast:()=>{}}});
 const event={currentTarget:{dataset:{type:'add',id:'PLACE-WX-ZWT'}}};p.action(event);p.action(event);assert.equal(app.globalData.routeIds.length,1);assert.equal(saved.length,1);
});
test('未核入口不发起路线请求；新导览清除前次需求', async()=>{
 let called=false;const {p}=page('pages/route/index.js',{'../../utils/api':{request:()=>called=true},'../../utils/location':{}});
 p.data.ready=false;await p.plan();assert(!called);assert(p.data.error.includes('地图点位尚未全部确认'));
 const assistant=page('pages/assistant/index.js',{'../../utils/api':{}}).p;assistant.data.guideContext={city:'无锡市'};assistant.data.messages=[{text:'上次'}];assistant.resetGuide();assert.equal(assistant.data.messages.length,0);assert.equal(Object.keys(assistant.data.guideContext).length,0);
});
test('六栏独立导航只开放本模块入口，目录可直接进入路线', () => {
  let component; const calls=[]; const wx={showToast:o=>calls.push(['toast',o.title]),reLaunch:o=>calls.push(['launch',o.url]),showActionSheet:o=>o.success({tapIndex:2})};
  vm.runInNewContext(fs.readFileSync(new URL('components/module-shell/index.js',mini),'utf8'),{Component:c=>component=c,wx});
  const ctx={properties:{active:'assistant'}};
  component.methods.open.call(ctx,{currentTarget:{dataset:{id:'people'}}});
  component.methods.open.call(ctx,{currentTarget:{dataset:{id:'assistant'}}});
  component.methods.open.call(ctx,{currentTarget:{dataset:{id:'radar'}}});
  component.methods.menu.call(ctx);
  assert.equal(calls.length,3);assert.equal(calls[0][0],'toast');assert.equal(calls[1][1],'/pages/radar/index');assert.equal(calls[2][1],'/pages/route/index');
});
test('人物选择保留团体身份并在请求时限定资料范围', async () => {
  let sent;const api={request:(url,o)=>{sent=o.data;return{promise:Promise.resolve({answer:'资料',citations:[],actions:[]})};}};
  const {p}=page('pages/assistant/index.js',{'../../utils/api':api});p.sequence=0;
  p.choosePerson({detail:{value:2}});assert.equal(p.data.personId,'IP-LYS');assert.equal(p.data.contextName,'狼牙山五壮士');
  p.data.question='成员有哪些？';await p.send();assert.equal(sent.personId,'IP-LYS');p.clearContext();assert.equal(p.data.personIndex,0);assert.equal(p.data.personId,'');
});
function moduleFile(file, mocks) { const context = { module: { exports: {} }, require: name => mocks[name], wx: mocks.wx, Promise }; vm.runInNewContext(fs.readFileSync(new URL(file, mini),'utf8'), context); return context.module.exports; }
function page(file, mocks) { let p; const app = { globalData: { routeIds: [], position: null } }; vm.runInNewContext(fs.readFileSync(new URL(file, mini),'utf8'), { Page: value => p = value, require: n => mocks[n], wx: mocks.wx || {}, getApp: () => app, Promise, setInterval:()=>1, clearInterval:()=>{} }); p.setData = function(v) { Object.assign(this.data, v); }; return { p, app }; }
test('用户拒绝隐私授权，不触发定位', async () => { let called = false; const loc = moduleFile('utils/location.js', { wx: { requirePrivacyAuthorize: o => o.fail(), getLocation: () => called = true } }); await assert.rejects(loc.locate(), e => e.message.includes('手动浏览')); assert.equal(called,false); });
test('定位请求GCJ-02；精度不足仍拒绝；正常成功只传必要坐标', async () => { const wx = { requirePrivacyAuthorize: o => o.success(), getLocation: o => { assert.equal(o.type,'gcj02'); o.success({ latitude:31, longitude:120, accuracy:600 }); } }; const loc = moduleFile('utils/location.js',{ wx }); await assert.rejects(loc.locate(), e => e.message.includes('精度不足')); wx.getLocation = o => o.success({ latitude:31, longitude:120, accuracy:30, speed:1 }); const result = await loc.locate(); assert.equal(result.type,'gcj02'); assert.equal(result.speed,undefined); });
test('停止AI请求实际调用abort；页面卸载后不写回迟到回答', async () => { let finish, aborted = false; const api = { request: () => ({ promise: new Promise(r => finish=r), abort: () => aborted=true }) }; const {p} = page('pages/assistant/index.js',{ '../../utils/api':api }); p.sequence=0;p.data.question='测试问题'; const task=p.send(); p.stop(); assert(aborted);p.onUnload();finish({ answer:'迟到回答',citations:[],actions:[] });await task;assert.equal(p.data.messages.length,1); });
test('路线计算期间不允许改序和删除，避免结果错配', () => { const {p,app}=page('pages/route/index.js',{ '../../utils/api':{}, '../../utils/location':{} }); app.globalData.routeIds=['a','b'];p.data.busy=true;p.remove({currentTarget:{dataset:{id:'a'}}});p.up({currentTarget:{dataset:{id:'b'}}});assert.deepEqual(app.globalData.routeIds,['a','b']); });
test('手动选城会清除定位，查询模式回到城市', () => { const {p,app}=page('pages/radar/index.js',{ '../../utils/api':{}, '../../utils/location':{} });p.position={latitude:31};app.globalData.position=p.position;let loaded=false;p.load=()=>loaded=true;p.city({detail:{value:1}});assert.equal(p.position,null);assert.equal(app.globalData.position,null);assert.equal(p.data.city,'常州市');assert(loaded); });
test('小程序网络请求中止与HTTP错误可区分', async () => { let fail; const api=moduleFile('utils/api.js',{ '../config':{ apiBase:'http://localhost' }, wx:{request:o=>{fail=o.fail;return {abort:()=>fail({errMsg:'request:fail abort'})};}} }); const r=api.request('/api/chat');r.abort();await assert.rejects(r.promise,e=>e.cancelled===true); });

test('重试旧问题丢弃后续消息且只发送之前上下文',async()=>{
 let sent;const {p}=page('pages/assistant/index.js',{'../../utils/api':{request:(url,o)=>{sent=o.data;return{promise:Promise.resolve({answer:'重新回答',citations:[],actions:[]})};}}});p.sequence=0;
 p.data.messages=[{role:'user',text:'旧问题'},{role:'assistant',text:'失败',failed:true,retryQuestion:'旧问题'},{role:'user',text:'后来的问题'},{role:'assistant',text:'后来的回答'}];p.data.question='旧问题';await p.send(1);assert.equal(sent.history.length,0);assert.equal(p.data.messages.length,2);assert.equal(p.data.messages[1].text,'重新回答');
});
test('用户上滑阅读时回答完成不强制滚动',async()=>{
 let finish;let scrolled=false;const {p}=page('pages/assistant/index.js',{'../../utils/api':{request:()=>({promise:new Promise(r=>finish=r)})},wx:{pageScrollTo:()=>scrolled=true}});p.sequence=0;p.data.question='问题';const task=p.send();p.previousScroll=100;p.onPageScroll({scrollTop:50});finish({answer:'回答',citations:[],actions:[]});await task;assert.equal(scrolled,false);assert.equal(p.data.showLatest,true);
});
