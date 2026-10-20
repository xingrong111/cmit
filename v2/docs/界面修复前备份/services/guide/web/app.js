/* Web presentation only. Native miniprogram and original preview stay independent.
 * Reuses the existing conversation, data, map and itinerary functions. */
const webViewKey=localKey('yingji:web-view-v1');
try{const saved=JSON.parse(sessionStorage.getItem(webViewKey)||'null');if(saved&&saved.page===location.hash.slice(1)){if(['无锡市','常州市'].includes(saved.city))state.city=saved.city;if(['map','list'].includes(saved.viewMode))state.viewMode=saved.viewMode;if(typeof saved.selectedId==='string')state.selectedId=saved.selectedId;}}catch{}
function saveWebView(){try{sessionStorage.setItem(webViewKey,JSON.stringify({page:state.page,city:state.city,viewMode:state.viewMode,selectedId:state.selectedId,scroll:window.scrollY}));}catch{}}
window.addEventListener('pagehide',saveWebView);document.addEventListener('click',()=>setTimeout(saveWebView,100));
const webOriginal = {assistant, radar, route, place, nav, go};
const webLabels = {assistant:'小迹导览',radar:'历史足迹',route:'文化路线'};
nav = function webNav() {
  const active=state.page==='place'?'radar':state.page;
  const links=Object.entries(webLabels).map(([id,name])=>`<button data-action="page" data-value="${id}" class="${id===active?'active':''}" ${id===active?'aria-current="page"':''}>${name}${id==='route'?'<span class="route-count">'+state.stops.length+'</span>':''}</button>`).join('');
  document.querySelector('#desktop-nav').innerHTML=links;
  document.querySelector('#nav').innerHTML=links;
};
function panel(cls,children){const el=document.createElement('div');el.className=cls;for(const child of children)if(child)el.append(child);return el;}
function webAssistantLayout(){
  if(state.page!=='assistant')return;
  const welcome=screen.querySelector('.guide-welcome');
  const sideNodes=[welcome,screen.querySelector('.scenario-grid'),screen.querySelector('.reading-selector'),screen.querySelector('.preference-panel')];
  const layout=panel('web-assistant-layout',[]),side=panel('web-assistant-sidebar',sideNodes);
  side.insertAdjacentHTML('beforeend','<div class="web-side-note"><span class="eyebrow">小迹能帮你</span><p>找功能入口、理解人物资料，<br>按城市和时间探索文化地点。</p><small>历史回答查看资料依据；出行前确认开放与预约。</small></div>');
  const chatNodes=[...screen.children].filter(el=>!el.matches('.hero,.label'));
  const chat=panel('web-chat-panel',chatNodes);
  if(state.guideContext?.personName||state.personId){const name=state.guideContext.personName||({"IP-QC":"瞿秋白","IP-LYS":"狼牙山五壮士","IP-SZZ":"宋振中","IP-LDY":"陆定一","IP-JZY":"江竹筠"}[state.personId]||'人物资料');chat.insertAdjacentHTML('afterbegin',`<div class="context-chip"><span>正在讨论：${esc(name)}</span><button data-web-clear-context aria-label="取消人物限定">×</button></div>`);}
  const conversation=chat.querySelector('.conversation');
  if(!state.messages.length)conversation.innerHTML='<div class="web-empty-chat"><span class="web-empty-seal">迹</span><span class="eyebrow">与小迹一起，循迹而行</span><h3>从一个问题开始</h3><p>可以聊人物、问功能，<br>也可以告诉我你的城市和可用时间。</p></div>';
  layout.append(side,chat);screen.append(layout);
  chat.querySelector('#question')?.setAttribute('placeholder','问小迹，或告诉我出行计划…');
}
assistant=function(){webOriginal.assistant();webAssistantLayout();nav();};
function webRadarLayout(){
  if(state.page!=='radar'||screen.querySelector('.web-radar-layout'))return;
  const map=screen.querySelector('#theme-map-slot'),places=screen.querySelector('#places');
  if(!places)return;
  const layout=panel('web-radar-layout'+(state.viewMode==='list'?' list-only':''),[]);
  if(map)layout.append(panel('web-map-column',[map]));
  const list=panel('web-place-column',[places]);list.insertAdjacentHTML('afterbegin','<button class="map-panel-toggle" data-web-toggle-places aria-expanded="true">收起地点列表 ⌄</button><div class="web-column-title"><span class="eyebrow">城市里的历史</span><h3>选择值得了解的一站</h3><p>读地点资料，再加入文化路线。</p></div>');layout.append(list);screen.append(layout);
  screen.querySelector('.hint').textContent='按城市探索已接入地点。真实地图需浏览器地图Key；地图终点为场馆附近，开放与预约单独确认。';
}
radar=async function(){await webOriginal.radar();webRadarLayout();nav();};
function webRouteLayout(){
  if(state.page!=='route'||screen.querySelector('.web-route-layout'))return;
  const map=screen.querySelector('#route-map-slot'),stops=screen.querySelector('#stops'),budget=screen.querySelector('#budget')?.closest('.card');
  if(!stops)return;
  const clear=screen.querySelector('[data-action="clear-route"]');
  const layout=panel('web-route-layout',[panel('web-map-column',[map,budget]),panel('web-route-column',[clear,stops])]);screen.append(layout);
  const start=stops.querySelector('[data-action="plan"]')?.previousElementSibling;
  if(start)start.textContent=state.routeOrigin?'已选择地图起点；可重新点选地图调整。':'在真实地图点选起点，再计算场馆地图位置间的步行路线。';
}
route=async function(){await webOriginal.route();webRouteLayout();nav();};
place=async function(id){history.replaceState(null,'','#place/'+encodeURIComponent(id));await webOriginal.place(id);if(state.page!=='place')return;const articles=[...screen.children].filter(e=>!e.matches('.hero,.label,.detail-dock'));const layout=panel('web-detail-layout',articles);screen.append(layout);const dock=screen.querySelector('.detail-dock');if(dock)screen.append(dock);nav();};
let webBootComplete=false;
go=function(page){if(!webBootComplete){webBootComplete=true;const match=location.hash.match(/^#place\/(PLACE-[A-Za-z0-9_-]{1,70})$/);if(match)return place(match[1]);}webOriginal.go(page);history.replaceState(null,'','#'+page);};
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-action]');if(!b)return;
  if(b.dataset.action==='web-section'){const page={'首页':'home','人物':'people','长卷':'timeline','我的':'me'}[b.dataset.value];if(page){if(parent!==window)parent.postMessage({type:'yingji-module-navigation',page},location.origin);else location.href='/#/pages/'+page+'/index';}}
  if(b.dataset.action==='add'||b.dataset.action==='action')nav();
});
window.addEventListener('hashchange',()=>{const page=location.hash.slice(1);const detail=page.match(/^place\/(PLACE-[A-Za-z0-9_-]{1,70})$/);if(detail&&(state.page!=='place'||state.current?.id!==detail[1]))place(detail[1]);else if(webLabels[page]&&page!==state.page)go(page);});
// Config may finish before this adapter loads, especially with cached scripts.
if(state.config)go(state.page==='place'?'radar':state.page);

const archiveContext=new URLSearchParams(location.search);const archiveId=archiveContext.get('archiveId');if(archiveId){const map=Object.fromEntries((window.yingjiLinks||[]).filter(x=>x.readingId).map(x=>[x.readingId,x.guideId]));state.personId=map[archiveId]||'';state.guideContext={...state.guideContext,personName:archiveContext.get('name')||''};if(state.personId){state.scene='history';state.mode='history';}state.archiveFilter=archiveId;if(archiveId&&!map[archiveId]&&location.hash==='#assistant')state.followUps=[(archiveContext.get('name')||'这个人物')+'是否有已接入资料？'];if(state.page==='assistant')assistant();if(state.page==='radar')radar();}

document.addEventListener('click',e=>{if(e.target.closest('[data-web-clear-context]')){state.personId='';state.eventId='';state.guideContext={...state.guideContext,personName:''};assistant();}});

document.addEventListener('click',e=>{const b=e.target.closest('[data-web-toggle-places]');if(b){const panel=b.closest('.web-place-column');const folded=panel.classList.toggle('places-folded');b.setAttribute('aria-expanded',String(!folded));b.textContent=folded?'展开地点列表 ⌃':'收起地点列表 ⌄';}});

let webAccount=localStorage.getItem('yingji_user_id')||'';window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='yingji-account-refresh')return;const id=localStorage.getItem('yingji_user_id')||'';if(id===webAccount)return;webAccount=id;state.stops=readLocal('yingji-route-v1',[]);state.stays=readLocal('yingji-stay-v1',{});state.budget=readLocal('yingji-budget-minutes-v1',0);state.messages=[];state.current=null;state.selectedId='';go(state.page==='place'?'radar':state.page);});
