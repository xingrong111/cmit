import {env} from 'cloudflare:workers';
import reading from '../../../data/阅读接口.json';
import guideData from '../../../data/导览资料.json';
import topics from '../../../data/讨论主题.json';
import bank from '../../../data/题库.json';
import levels from '../../../data/关卡.json';
import honors from '../../../data/荣誉.json';
import {createLearning} from '../../../lib/项目/学习逻辑.js';
import {answer} from '../../../lib/项目/guide/assistant.js';
import {present} from '../../../lib/项目/guide/presentation.js';
import {walking} from '../../../lib/项目/guide/routes.js';
import {convertGPS} from '../../../lib/项目/guide/定位.js';
import {MapCache} from '../../../lib/项目/guide/map-cache.js';
import {visible,coordinate,distance,publicPlace} from '../../../lib/项目/guide/domain.js';
export const dynamic='force-dynamic';
const cache=new MapCache(), E=()=>env as any, now=()=>new Date().toISOString();
const json=(v:any,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function fail(status:number,message:string,code='REQUEST_FAILED'):never{throw Object.assign(new Error(message),{status,code})}
async function body(req:Request){if(Number(req.headers.get('content-length')||0)>24000)fail(413,'请求过大');const text=await req.text();if(text.length>24000)fail(413,'请求过大');try{return JSON.parse(text||'{}')}catch{fail(400,'请求格式无效')}}
async function get(key:string){const row=await E().DB.prepare('SELECT value,version FROM app_state WHERE key=?').bind(key).first();return row?{value:JSON.parse(row.value),version:row.version}:null}
async function insert(key:string,value:any){return E().DB.prepare('INSERT OR IGNORE INTO app_state(key,value,version) VALUES(?,?,1)').bind(key,JSON.stringify(value)).run()}
async function update(key:string,value:any,version:number){const r=await E().DB.prepare('UPDATE app_state SET value=?,version=version+1 WHERE key=? AND version=?').bind(JSON.stringify(value),key,version).run();if(!r.meta.changes)fail(409,'资料刚被更新，请刷新后重试');}
async function actor(req:Request){const id=req.headers.get('oai-authenticated-user-id');if(!id)return null;const email=req.headers.get('oai-authenticated-user-email')||'',role=String(E().ADMIN_EMAILS||'').split(',').map((s:string)=>s.trim().toLowerCase()).includes(email.toLowerCase())?'admin':'user';const key='profile:'+id;let row=await get(key);if(!row){await insert(key,{id,nickname:'山河学习者',createdAt:now()});row=await get(key)}return {...row?.value,id,role}}
function need(user:any,admin=false){if(!user)fail(401,'请先通过ChatGPT登录');if(admin&&user.role!=='admin')fail(403,'该操作仅对已授权管理员开放')}
async function audit(user:any,action:string,target:string){await insert('audit:'+crypto.randomUUID(),{actorId:user.id,action,targetId:target,createdAt:now()})}
async function rows(prefix:string){const r=await E().DB.prepare('SELECT value FROM app_state WHERE key LIKE ? ORDER BY rowid DESC LIMIT 200').bind(prefix+'%').all();return r.results.map((x:any)=>JSON.parse(x.value))}
async function rate(req:Request,name:string,max:number){const raw=req.headers.get('oai-authenticated-user-id')||req.headers.get('cf-connecting-ip')||'anonymous';const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))].map(n=>n.toString(16).padStart(2,'0')).join('');const key='rate:'+name+':'+hash,minute=Math.floor(Date.now()/60000);for(let i=0;i<4;i++){let row=await get(key);if(!row){await insert(key,{minute,count:0});continue}const count=row.value.minute===minute?row.value.count:0;if(count>=max)fail(429,'请求较频繁，请稍后再试','RATE_LIMITED');try{await update(key,{minute,count:count+1},row.version);return}catch(e:any){if(e.status!==409)throw e}}fail(429,'当前请求较多，请稍后再试')}
function commentView(c:any,user:any){const owner=user&&(user.id===c.authorId||user.role==='admin');return {id:c.id,topicType:c.topicType,topicId:c.topicId,topicTitle:c.topicTitle,content:c.content,status:c.status,submittedAt:c.submittedAt,updatedAt:c.updatedAt,version:c.version,author:owner?{id:c.authorId,nickname:c.authorNickname}:{nickname:c.authorNickname},...(owner?{reviewReason:c.reviewReason,history:user.role==='admin'?c.history:undefined}:{})}}
async function account(req:Request,url:URL,path:string){
 const user=await actor(req),method=req.method;
 if(path==='/me')return json({user});
 if(path==='/topics')return json({items:topics});
 if(path.startsWith('/auth/'))return json({error:{message:'线上使用ChatGPT登录，请从账户页继续。'}},405);
 if(path==='/comments'&&method==='GET'){const topicId=url.searchParams.get('topicId');return json({items:(await rows('comment:')).filter((x:any)=>x.status==='approved'&&(!topicId||x.topicId===topicId)).map((x:any)=>commentView(x,null))})}
 if(path==='/my/comments'){need(user);return json({items:(await rows('comment:')).filter((x:any)=>x.authorId===user.id).map((x:any)=>commentView(x,user))})}
 if(path==='/comments'&&method==='POST'){need(user);await rate(req,'comment',5);const b=await body(req),topic=topics.find(x=>x.id===b.topicId),text=String(b.content||'').trim();if(!topic||!text||text.length>500)fail(400,'请选择有效人物并填写1—500字评论');const c={id:'cmt_'+crypto.randomUUID(),authorId:user.id,authorNickname:user.nickname,topicType:topic.type,topicId:topic.id,topicTitle:topic.title,content:text,status:'pending',reviewReason:'',submittedAt:now(),updatedAt:now(),version:1,history:[{action:'submitted',at:now()}]};await insert('comment:'+c.id,c);await audit(user,'submit_comment',c.id);return json({message:'已提交，审核通过后公开。',item:commentView(c,user)},201)}
 const match=path.match(/^\/comments\/([^/]+)$/);
 if(match&&method==='PUT'){need(user);const key='comment:'+match[1],r=await get(key);if(!r||r.value.authorId!==user.id)fail(404,'评论不存在');const b=await body(req),text=String(b.content||'').trim();if(b.version!==r.value.version)fail(409,'评论版本已更新');if(!['pending','rejected','hidden'].includes(r.value.status)||!text||text.length>500)fail(400,'当前评论不可修改或内容无效');const c={...r.value,content:text,status:'pending',reviewReason:'',updatedAt:now(),version:r.value.version+1,history:[...r.value.history,{action:'resubmitted',at:now()}]};await update(key,c,r.version);return json({message:'已重新提交审核。'})}
 if(path.startsWith('/admin/')){need(user,true);
  if(path==='/admin/dashboard'){const cs=await rows('comment:');return json({pendingComments:cs.filter((c:any)=>c.status==='pending').length,pendingFacts:0,recentAudit:(await rows('audit:')).slice(0,20)})}
  if(path==='/admin/comments')return json({items:(await rows('comment:')).filter((c:any)=>url.searchParams.get('status')==='all'||c.status===(url.searchParams.get('status')||'pending')).map((c:any)=>commentView(c,user))});
  if(path==='/admin/facts')return json({items:[]});
  const m=path.match(/^\/admin\/comments\/([^/]+)\/(review|hide)$/);if(m&&method==='POST'){const key='comment:'+m[1],r=await get(key);if(!r)fail(404,'评论不存在');const b=await body(req);if(b.version!==r.value.version)fail(409,'评论版本已更新');if(m[2]==='review'&&r.value.status!=='pending')fail(409,'仅可审核待审核评论');const status=m[2]==='hide'?'hidden':b.decision;if(!['approved','rejected','hidden'].includes(status))fail(400,'审核操作无效');if(status==='hidden'&&r.value.status!=='approved')fail(409,'仅可隐藏已公开评论');const reason=String(b.reason||'').trim();if(status!=='approved'&&!reason)fail(400,'请填写处理原因');const c={...r.value,status,reviewReason:reason.slice(0,300),version:r.value.version+1,updatedAt:now(),history:[...r.value.history,{action:status,at:now(),actorId:user.id,reason}]};await update(key,c,r.version);await audit(user,'review_comment_'+status,c.id);return json({message:'已记录审核结果。'})}
 }
 fail(404,'接口不存在');
}
async function learning(req:Request,url:URL,path:string){const user=await actor(req);const write=req.method!=='GET';if(write||path.startsWith('/attempts'))need(user);if(path.startsWith('/manage/')||path.startsWith('/import/')){need(user,true);return json({error:'线上资料管理需使用审核后的发布流程，本机草稿工具不向公网开放。'},403)}
 const key=user?'learning:'+user.id:'',row=key?await get(key):null;const engine=createLearning({levels,honors,questions:bank.questions,sources:bank.sources,persist:false,initialStore:row?.value||{learners:{},attempts:{}}});
 if(path==='/levels')return json(engine.levels(user?.id));if(path==='/honors')return json(engine.titles(user?.id));
 let result;const b=write?await body(req):{};
 if(path==='/attempts'&&req.method==='POST')result=await engine.start(b.level_id,user.id);
 else{const m=path.match(/^\/attempts\/(att_[a-f0-9]{32})(\/answers)?$/);if(!m)fail(404,'接口不存在');if(engine.owner(m[1])!==user.id)fail(404,'本账户没有该答题记录');result=m[2]&&req.method==='POST'?await engine.answer(m[1],b.choice,b.question_id):engine.attempt(m[1])}
 if(result.status>=400)return json({error:result.error},result.status);
 if(write){if(row)await update(key,engine.snapshot(),row.version);else{const saved=await insert(key,engine.snapshot());if(!saved.meta.changes)fail(409,'学习记录刚被更新，请刷新后重试')}}return json(result.body,result.status);
}
function readAPI(url:URL,path:string){const map=reading as any;let value=map[path];if(!value)return json({error:'内容不存在或尚未公开'},404);
 if(path==='/people'){const q=(url.searchParams.get('q')||'').trim(),province=url.searchParams.get('province'),items=value.items.filter((p:any)=>(!q||(p.name+' '+p.aliases.join(' ')).includes(q))&&(!province||p.province===province)),page=Math.max(1,Number(url.searchParams.get('page')||1)),limit=Math.min(100,Math.max(1,Number(url.searchParams.get('limit')||100)));return json({items:items.slice((page-1)*limit,page*limit),total:items.length,page,limit,has_more:page*limit<items.length})}
 if(path==='/timeline'||path.endsWith('/timeline')){if(path==='/timeline'&&url.searchParams.get('person_id'))value=map['/people/'+url.searchParams.get('person_id')+'/timeline'];if(!value)return json({error:'人物不存在'},404);let items=value.items.filter((x:any)=>!url.searchParams.get('stage')||x.stage===url.searchParams.get('stage'));return json({...value,items:items.slice(0,Math.min(100,Number(url.searchParams.get('limit')||100))),total:items.length})}
 return json(value);
}
async function guideAPI(req:Request,url:URL,path:string){const e=E(),config={publicMode:false,modelKey:e.MODEL_API_KEY||'',modelBase:e.MODEL_BASE_URL||'https://api.deepseek.com',modelName:e.MODEL_NAME||'deepseek-chat',mapKey:e.TENCENT_MAP_KEY||'',browserMapKey:e.TENCENT_MAP_BROWSER_KEY||'',mapStyleId:e.TENCENT_MAP_STYLE_ID||''},data=guideData as any,sources=Object.fromEntries(data.sources.map((s:any)=>[s.id,s]));
 if(path==='/config')return json({publicMode:false,modelConfigured:!!config.modelKey,walkingConfigured:!!config.mapKey,browserMapKey:config.browserMapKey,mapStyleId:config.mapStyleId,cities:[...new Set(data.places.filter((p:any)=>visible(p,false)).map((p:any)=>p.city))],contentLabel:'资料试读 · 待独立复核'});
 if(path==='/chat'&&req.method==='POST'){await rate(req,'chat',8);return json(present(await answer(await body(req),data,config,req.signal,fetch)))}
 if(path==='/position'&&req.method==='POST'){await rate(req,'map',15);return json(await convertGPS(await body(req),config,req.signal,fetch))}
 if(path==='/routes'&&req.method==='POST'){await rate(req,'map',15);return json(await walking(await body(req),data,config,req.signal,fetch,cache))}
 if(path==='/poi-candidates')fail(403,'候选点资料核查工具仅供本机使用');
 if(path==='/places'){const q=(url.searchParams.get('q')||'').slice(0,80),city=url.searchParams.get('city'),type=url.searchParams.get('type');let origin:any=null;if(url.searchParams.has('lat')||url.searchParams.has('lng')){if(!url.searchParams.get('lat')||!url.searchParams.get('lng'))fail(400,'请同时提供经纬度');origin=coordinate({latitude:Number(url.searchParams.get('lat')),longitude:Number(url.searchParams.get('lng')),type:url.searchParams.get('coordinateType')})}const radius=Number(url.searchParams.get('radius')||10000);if(!Number.isFinite(radius)||radius<100||radius>50000)fail(400,'附近范围应为100—50000米');let items=data.places.filter((p:any)=>visible(p,false)&&(!city||p.city===city)&&(!type||p.type===type)&&(!q||(p.name+p.address+p.summary).includes(q))).map((p:any)=>{const item=publicPlace(p,sources,undefined,false);if(origin&&item.routeReady){item.distanceMeters=distance(origin,item.routeCoordinate);item.distanceLabel=item.distanceMeters<1000?`${item.distanceMeters}米 · 直线距离`:`${(item.distanceMeters/1000).toFixed(1)}公里 · 直线距离`}return item});if(origin)items=items.filter((p:any)=>Number.isFinite(p.distanceMeters)&&p.distanceMeters<=radius).sort((a:any,b:any)=>a.distanceMeters-b.distanceMeters);return json({items,total:items.length,mode:origin?'nearby':'city',coordinateType:'gcj02',notice:'资料试读；距离为直线距离，实际出行请核对场馆开放与地图路线。'})}
 const m=path.match(/^\/places\/([A-Za-z0-9_-]+)$/);if(m){const p=data.places.find((x:any)=>x.id===m[1]&&visible(x,false));if(!p)fail(404,'地点不存在或尚未公开');return json(publicPlace(p,sources,undefined,false))}fail(404,'接口不存在');
}
async function handler(req:Request){try{const url=new URL(req.url);if(req.method!=='GET'&&req.method!=='HEAD'){const origin=req.headers.get('origin');if(origin&&origin!==url.origin)fail(403,'访问来源未获允许');if(!req.headers.get('content-type')?.includes('application/json'))fail(415,'请使用JSON格式提交')}const m=url.pathname.match(/^\/api\/(reading|account|learning|guide)(\/.*)?$/);if(!m)return json({error:'接口不存在'},404);const path=decodeURIComponent(m[2]||'/');if(m[1]==='reading'){if(req.method!=='GET')fail(405,'阅读接口仅提供查询');return readAPI(url,path)}if(m[1]==='account')return await account(req,url,path);if(m[1]==='learning')return await learning(req,url,path);return await guideAPI(req,url,path)}catch(e:any){const message=e.status?e.message:'服务暂时不可用，请稍后重试。';return json({error:new URL(req.url).pathname.startsWith('/api/learning/')?message:{code:e.code||'INTERNAL_ERROR',message}},e.status||500)}}
export {handler as GET,handler as POST,handler as PUT,handler as DELETE};
