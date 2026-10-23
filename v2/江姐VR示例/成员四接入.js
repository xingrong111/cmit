import {createStoryVoice} from './剧情配音.js';
import {story} from './剧情配置.mjs';
import {StoryController} from './剧情控制.mjs';
import {createPanorama,isPanoramaSupported} from './全景模块.js?v=vr-load-20261022';
import {scenes,closeups} from './场景配置.js';
import {ReadingUI as ui} from './ui.js';
const $=id=>document.getElementById(id),host=$('storyScene');
let controller,pano,unframe,layoutObserver,accountId='guest',accountSync=false,disposed=false;
let effectiveText=true,sceneMessage='正在准备故事……',loadedScene=null;
const mini=new URLSearchParams(location.search).get('host')==='mini';
const voice=createStoryVoice(text=>ui.hint(text));
const personEvents=new AbortController();let personPointer=null;
const profiles={
 JJ:{title:'江竹筠（江姐）· 人物简介',html:'<p><b>江竹筠（1920—1949）</b>，四川自贡人，1939年加入中国共产党，是小说《红岩》中江姐形象的原型。</p><p>她曾从事党的通信联络工作，参与重庆地下刊物《挺进报》的联络和组织发行，后赴川东开展革命工作。1948年6月14日被捕，被关押于重庆渣滓洞监狱，在狱中始终坚贞不屈、保守党的秘密。1949年11月14日在重庆牺牲，年仅29岁。</p><p><b>本作中的江姐</b><br>画面、人物动作与对白为文学化创作，不是历史现场复原，也不是江竹筠的历史原话；两位狱友为本作虚构角色。</p><p class="profile-sources">史料来源：<a href="https://www.xinhuanet.com/politics/2019-05/29/c_1124557270.htm" target="_blank" rel="noopener noreferrer">新华社《江竹筠：共产党员的意志是钢铁》</a>；<a href="https://fuwu.12371.cn/2012/11/27/ARTI1354005278415624.shtml" target="_blank" rel="noopener noreferrer">共产党员网《江竹筠》</a>。</p>'},
 YOUNG:{title:'年轻狱友 · 虚构角色',html:'<p>她向往窗外平常的生活，也会对眼前的事情感到紧张。在同伴的支持下，她愿意尝试、参与，一点点找到自己的力量。</p><p>这是本作原创的虚构狱友，不对应某位已确认的历史人物；角色经历与对白不作为史实。</p>'},
 ELDER:{title:'年长狱友 · 虚构角色',html:'<p>她以耐心的回应和细致的帮助支持年轻同伴。在共同做事的过程中，她提醒大家不必着急，可以一步一步来。</p><p>这是本作原创的虚构狱友，不对应某位已确认的历史人物；角色经历与对白不作为史实。</p>'},
};
function showProfile(id){const p=profiles[id];if(p)ui.showInfo(p.title,p.html);}
function personAt(clientX,clientY){
 if(!pano||effectiveText||controller?.busy)return null;
 const rect=host.getBoundingClientRect(),fov=pano.getState().fov;
 const radius=rect.height/(2*Math.tan(fov*Math.PI/360))*Math.tan(10*Math.PI/180);
 let best=null;
 for(const id of Object.keys(profiles)){
  const a=pano.getAnchor(id);if(!a?.inView)continue;
  const dx=(clientX-rect.left-a.x)/(radius*1.1),dy=(clientY-rect.top-a.y-radius*.6)/(radius*1.7);
  const score=dx*dx+dy*dy;if(score<=1&&(!best||score<best.score))best={id,score};
 }
 return best?.id;
}
function installPersonActions(){
 const options={signal:personEvents.signal};
 host.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0){personPointer=null;return;}personPointer=e.target.classList.contains('pano-canvas')?{id:e.pointerId,x:e.clientX,y:e.clientY,moved:false}:null;},options);
 host.addEventListener('pointermove',e=>{if(personPointer&&Math.hypot(e.clientX-personPointer.x,e.clientY-personPointer.y)>8)personPointer.moved=true;},options);
 host.addEventListener('pointercancel',()=>personPointer=null,options);
 host.addEventListener('pointerup',e=>{const p=personPointer;personPointer=null;if(!p||p.moved||p.id!==e.pointerId)return;const id=personAt(e.clientX,e.clientY);if(id)showProfile(id);},options);
 const tools=document.querySelector('.tools');
 for(const id of Object.keys(profiles)){const b=document.createElement('button');b.textContent=story.speakers[id]+'简介';b.onclick=()=>showProfile(id);tools.append(b);}
}
function status(text){$('saveStatus').textContent=text;}
function focusSpeaker(id){
 const a=pano?.getAnchor(id);if(!a)return;
 if(innerHeight<=500)pano.lookAt({yaw:a.yaw,pitch:a.pitch-23});
 else if(innerWidth<=640)pano.lookAt({yaw:a.yaw,pitch:a.pitch-12});
 else pano.lookAt(id);
}
function route(kind){
 voice.stop();
 const link=story.links[kind],url='/pages/'+link.page+'/index?'+new URLSearchParams(link.params);
 if(mini){if(window.wx?.miniProgram)wx.miniProgram.redirectTo({url});else status('请返回小程序，通过人物档案、学习挑战或内容与来源说明进入。');return;}
 if(kind==='sources'){location.href='./剧情来源.html'+location.search;return;}
 if(['3158','3160'].includes(location.port)){location.href='http://127.0.0.1:3110/#'+url;}else window.top.location.href='/#'+url;
}
function update(s=controller.snapshot()){
 const n=controller.node();ui.setProgress(`${n.act===0?'序章':'第'+n.act+'幕'} · ${n.id}`);
 $('entry').hidden=n.type!=='hotspot';$('entry').textContent=n.actionLabel||n.text;$('entry').disabled=s.busy;
 $('finish').hidden=n.type!=='ending';$('finish').disabled=s.busy||!s.read||s.finished;$('finish').textContent=s.finished?'已完成阅读':'完成阅读';
 $('read').hidden=s.read||n.type==='hotspot';$('read').disabled=s.busy;
 for(const b of document.querySelectorAll('#rui-root .rui-bar-row:first-child button,.rui-bubble-foot button')){
  const t=b.textContent;b.disabled=s.busy||(t.includes('上一句')&&!s.cursor)||(t.includes('继续')&&(!s.read||['hotspot','choice','ending'].includes(n.type)));
 }
 document.querySelectorAll('.rui-choice').forEach(b=>{b.disabled=s.busy||!s.read;});
 const history=$('history'),value=history.value;history.replaceChildren(new Option('回看已读段落',''));
 for(const id of s.trail.filter((id,i,a)=>s.completed.includes(id)&&a.indexOf(id)===i))history.add(new Option(id+' '+controller.node(id).text.slice(0,12),id));
 history.value=value;document.body.dataset.node=n.id;
}
function markIfFits(){
 if(disposed||!controller||controller.busy)return;
 const el=document.querySelector('.rui-bubble:not([hidden]) .rui-bubble-text,.rui-narration:not([hidden]),.rui-choices:not([hidden])');
 if(el&&el.scrollHeight<=el.clientHeight+2)controller.markRead();
}
function render(n,s){
 ui.clearSpeech();const text=effectiveText||s.mode==='text';document.body.classList.toggle('text-reading',text);
 // 热点入口已有明确按钮，不再重复显示同文旁白框。
 if(n.type==='hotspot'){}
 else if(n.type==='choice')ui.showChoices(n.text,n.choices.map(c=>({id:c.id,label:c.text})));
 else if(n.type==='dialogue'&&!text){ui.showDialogue({speakerId:n.speakerId,text:n.text});focusSpeaker(n.speakerId);}
 else ui.showNarration((n.type==='dialogue'?story.speakers[n.speakerId]+'：':'')+n.text);
 $('sceneStatus').textContent=sceneMessage;update(s);voice.show(n);requestAnimationFrame(markIfFits);
}
const view={
 async loadScene(id){
  voice.stop();
  const text=controller?.state.mode==='text';
  if(text||!pano){
   effectiveText=true;sceneMessage=text?'文字阅读模式':'当前设备无法使用全景，已使用文字阅读';
   if(pano&&loadedScene!=='TEXT'){await pano.loadScene('TEXT');loadedScene='TEXT';}
   return {status:'ready'};
  }
  if(id===loadedScene&&pano.getState().ready){effectiveText=false;sceneMessage=scenes[id].note||'静态全景 · 拖动环视，点击人物查看简介';pano.setHotspotStates({});return {status:'ready'};}
  const result=await pano.loadScene(id,{view:'preset'});if(result.mode==='stale')return {status:'cancelled'};
  loadedScene=id;effectiveText=result.mode==='text';sceneMessage=effectiveText?'本段以文字呈现；未展示对应场景图片。':(scenes[id].note||'静态全景 · 拖动环视，点击人物查看简介');return {status:'ready'};
 },enterTextMode(){effectiveText=true;},dispose(){disposed=true;voice.dispose();personEvents.abort();layoutObserver?.disconnect();unframe?.();pano?.dispose();}
};
function avoidHotspotOverlap(){
 const selectors='#nodeActions,.rui-bar,.rui-bubble:not([hidden]),.rui-narration:not([hidden]),.rui-choices:not([hidden]),header details';
 const blocks=[...document.querySelectorAll(selectors)].map(e=>e.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);
 for(const button of host.querySelectorAll('.pano-hotspot')){
  if(button.hidden)continue;
  const r=button.getBoundingClientRect();
  const collision=blocks.some(b=>r.left<b.right+12&&r.right>b.left-12&&r.top<b.bottom+12&&r.bottom>b.top-12);
  button.style.visibility=collision?'hidden':'visible';
  button.tabIndex=collision?-1:0;
  if(collision)button.setAttribute('aria-hidden','true');else button.removeAttribute('aria-hidden');
 }
}
const reader={render,update,status,dispose(){ui.dispose();},setBusy(b){if(!controller)return;update({...controller.snapshot(),busy:b});if(!b){pano?.setHotspotStates(Object.fromEntries((controller.node().hotspots||[]).map(id=>[id,'active'])));requestAnimationFrame(markIfFits);}},setSceneError(error){$('retry').hidden=!error;if(error){effectiveText=true;ui.showNarration('场景未能加载。可重试或点击菜单中的“文字阅读”继续，阅读进度会保留。');$('sceneStatus').textContent='场景加载失败';}}};
async function getAccount(){
 try{const token=localStorage.getItem('yingji_token');const r=await fetch('/api/account/me',{credentials:'same-origin',headers:token&&token!=='sites'?{Authorization:'Bearer '+token}:{},signal:AbortSignal.timeout(4000)});if(r.ok){const d=await r.json();return d.user?.id?String(d.user.id):'guest';}if(r.status===401)return 'guest';}catch{}return null;
}
function action(type,p={}){
 if(type==='continue')return controller.next();if(type==='prev')return controller.previous();if(type==='choice')return controller.choose(p.id);if(type==='skip')return controller.skip();
 if(type==='replay')return voice.replay();
 if(type==='backToSpeaker'){pano?.zoom(12);return focusSpeaker(p.speakerId);}if(type==='exit')route('archive');
}
async function mount(){
 scenes.TEXT={title:'文字阅读',image:null};
 ui.init({onAction:action,names:story.speakers,aboutHtml:story.notice,helpHtml:'<p>点击继续阅读；长文字先滚动到底部或点击“已读完本段”。窗边入口开启第一幕，幕末入口进入下一幕。</p><p>48段原始配音随对应台词播放；点击“重听当前句”重新播放，故事菜单可关闭配音。首次进入若未出声，请点击重听。切换台词会停止上一段配音。</p><p>点击人物头像或上半身可查看角色简介，也可从故事菜单打开；查看不会推进剧情。</p><p>全景可拖动、缩放、复位和全屏。前三幕已补充AI艺术化全景；物件仍不提供缺失的独立放大图。</p><p>跳过停在本幕末或待选分支；重播清除本账户当前故事进度。进度只保存到当前设备。</p>'});
 const voiceToggle=document.createElement('button');voiceToggle.textContent='配音：开';voiceToggle.setAttribute('aria-pressed','true');voiceToggle.onclick=()=>{const on=voice.toggle();voiceToggle.textContent='配音：'+(on?'开':'关');voiceToggle.setAttribute('aria-pressed',String(on));};document.querySelector('.tools').append(voiceToggle);
 const bar=document.querySelector('.rui-bar');layoutObserver=new ResizeObserver(()=>document.documentElement.style.setProperty('--reading-bar-height',bar.getBoundingClientRect().height+'px'));layoutObserver.observe(bar);
 if(isPanoramaSupported())try{pano=createPanorama(host,{scenes,closeups,onEvent(type,d){if(type==='sceneloading'){$('sceneStatus').textContent='正在加载全景图片，请稍候…';}if(type==='hotspot')controller?.hotspot(d.id);}});}catch{sceneMessage='全景初始化失败，使用文字阅读';}
 installPersonActions();
 unframe=pano?.onFrame(()=>{const rect=host.getBoundingClientRect(),anchors={};for(const id of ['JJ','YOUNG','ELDER']){const a=pano.getAnchor(id);if(a){const fov=pano.getState().fov;const scale=rect.height/(2*Math.tan(fov*Math.PI/360));const edge=1+Math.min(1,Math.abs(a.x-rect.width/2)/(rect.width/2))*.25;anchors[id]={...a,x:a.x+rect.left,y:a.y+rect.top,visible:a.inView,r:Math.max(38,scale*Math.tan(10*Math.PI/180)*edge)};}}ui.updateAnchors(anchors);avoidHotspotOverlap();});
 accountId=(await getAccount())||'guest';controller=new StoryController({story,view,reader,account:accountId,storage:{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)}});
 window.storyController=controller;window.storyPanorama=pano;await controller.start();status(controller.saved?'已恢复进度（当前设备）':'阅读进度保存在当前设备');
}
$('entry').onclick=()=>controller.hotspot(controller.node().triggerHotspotId);$('read').onclick=()=>controller.markRead();$('finish').onclick=()=>controller.finish();$('retry').onclick=()=>controller.retry();
$('textMode').onclick=()=>controller.setMode('text');$('panoramaMode').onclick=()=>controller.setMode('panorama');$('history').onchange=e=>{if(e.target.value)controller.jumpTo(e.target.value);};
$('restart').onclick=()=>$('restartDialog').showModal();$('cancelRestart').onclick=()=>$('restartDialog').close();$('confirmRestart').onclick=()=>{$('restartDialog').close();controller.replay();};
$('archive').onclick=()=>route('archive');$('learning').onclick=()=>route('learning');$('sources').onclick=()=>route('sources');$('zoomIn').onclick=()=>pano?.zoom(-8);$('zoomOut').onclick=()=>pano?.zoom(8);$('reset').onclick=()=>pano?.reset();$('fullscreen').onclick=()=>pano?.toggleFullscreen(document.documentElement);
document.addEventListener('scroll',e=>{const el=e.target;if(el.matches?.('.rui-bubble-text,.rui-narration')&&el.scrollTop+el.clientHeight>=el.scrollHeight-3)controller?.markRead();},true);
async function syncAccount(){if(accountSync||!controller||disposed)return;accountSync=true;try{const next=await getAccount();if(next!==null&&next!==accountId){accountId=next;await controller.switchAccount(next);}}finally{accountSync=false;}}
window.addEventListener('focus',syncAccount);window.addEventListener('storage',syncAccount);window.addEventListener('pagehide',()=>controller?.dispose());window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
window.addEventListener('resize',()=>{if(controller&&!disposed&&controller.node().type==='dialogue'&&!effectiveText)focusSpeaker(controller.node().speakerId);});
mount().catch(()=>status('故事初始化失败，请刷新重试。'));
