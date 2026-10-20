/* Web presentation only. Native miniprogram and original preview stay independent.
 * Reuses the existing conversation, data, map and itinerary functions. */
const webViewKey=localKey('yingji:web-view-v1');
try{const saved=JSON.parse(sessionStorage.getItem(webViewKey)||'null');if(saved&&saved.page===location.hash.slice(1)){if(['无锡市','常州市'].includes(saved.city))state.city=saved.city;if(['map','list'].includes(saved.viewMode))state.viewMode=saved.viewMode;if(typeof saved.selectedId==='string')state.selectedId=saved.selectedId;}}catch{}
function saveWebView(){try{sessionStorage.setItem(webViewKey,JSON.stringify({page:state.page,city:state.city,viewMode:state.viewMode,selectedId:state.selectedId,scroll:window.scrollY}));}catch{}}
window.addEventListener('pagehide',saveWebView);document.addEventListener('click',()=>setTimeout(saveWebView,100));
const venueBackStack=[];let restoringVenue=false;
function rememberVenue(){if(!restoringVenue&&webBootComplete)venueBackStack.push({page:state.page,id:state.current?.id,scroll:window.scrollY});}
function venueBack(){const prev=venueBackStack.pop();restoringVenue=true;const result=prev?.page==='place'?place(prev.id):go(prev?.page||'radar');Promise.resolve(result).finally(()=>{restoringVenue=false;setTimeout(()=>window.scrollTo(0,prev?.scroll||0),150)});}
const webOriginal = {assistant, radar, route, place, nav, go};
const webLabels = {assistant:'小迹导览',radar:'历史足迹',route:'文化路线'};
nav = function webNav() {
  const active=state.page==='place'?'radar':state.page;
  try{if(parent!==window){const back=parent.document.querySelector('.page-return');if(back)back.style.display=state.page==='place'?'none':'';}}catch{}
  if(state.page==='place'&&!screen.querySelector('.venue-return'))screen.insertAdjacentHTML('afterbegin','<button class="venue-return" data-venue-back>‹ 返回上一页</button>');
  const links=Object.entries(webLabels).map(([id,name])=>`<button data-action="page" data-value="${id}" class="${id===active?'active':''}" ${id===active?'aria-current="page"':''}>${name}${id==='route'?'<span class="route-count">'+state.stops.length+'</span>':''}</button>`).join('');
  document.querySelector('#desktop-nav').innerHTML=links;
  document.querySelector('#nav').innerHTML=links;
};
function panel(cls,children){const el=document.createElement('div');el.className=cls;for(const child of children)if(child)el.append(child);return el;}
function webAssistantLayout(){
  if(state.page!=='assistant')return;
  fitAssistantViewport();
  const heading=screen.querySelector('.hero');if(heading){heading.classList.add('assistant-cover');heading.querySelector('h2').innerHTML='<img class="module-feature-icon" src="/static/icons/assistant.png" alt="">小迹 · 你的山河导览员';heading.querySelector('p').textContent='读人物、寻足迹，把每一次好奇变成一段旅程。';if(!heading.querySelector('.assistant-cover-seal'))heading.insertAdjacentHTML('beforeend','<span class="assistant-cover-seal" aria-hidden="true">循迹<br>问知</span>');}
  const welcome=screen.querySelector('.guide-welcome');
  if(welcome){const heading=welcome.querySelector('h3,.heading');if(heading)heading.textContent='小迹陪你循迹';}
  screen.classList.toggle('has-conversation',state.messages.length>0);
  const sideNodes=[welcome,screen.querySelector('.scenario-grid'),screen.querySelector('.reading-selector'),screen.querySelector('.preference-panel')];
  const layout=panel('web-assistant-layout',[]),side=panel('web-assistant-sidebar',sideNodes);
  side.insertAdjacentHTML('beforeend','<div class="web-side-note"><span class="eyebrow">小迹能帮你</span><p>找功能入口、理解人物资料，<br>按城市和时间探索文化地点。</p><small>历史回答查看资料依据；出行前确认开放与预约。</small></div>');
  const chatNodes=[...screen.children].filter(el=>!el.matches('.hero,.label'));
  const chat=panel('web-chat-panel',chatNodes);
  if(state.guideContext?.personName||state.personId){const name=state.guideContext.personName||({"IP-QC":"瞿秋白","IP-LYS":"狼牙山五壮士","IP-SZZ":"宋振中","IP-LDY":"陆定一","IP-JZY":"江竹筠"}[state.personId]||'人物资料');chat.insertAdjacentHTML('afterbegin',`<div class="context-chip"><span>正在讨论：${esc(name)}</span><button data-web-clear-context aria-label="取消人物限定">×</button></div>`);}
  const conversation=chat.querySelector('.conversation');
  if(!state.messages.length)conversation.innerHTML='<div class="web-empty-chat"><img class="web-empty-logo" src="/static/山河有迹Logo.png" alt="山河有迹"><span class="eyebrow">与小迹一起，循迹而行</span><h3>从一个问题开始</h3><p>'+esc(sceneIntro())+'</p>'+startCards()+'</div>';
  layout.append(side,chat);screen.append(layout);
  chat.querySelector('#question')?.setAttribute('placeholder',scenePlaceholder());
  if(typeof bindConversationScroll==='function')bindConversationScroll();
  if(typeof restoreConversation==='function')requestAnimationFrame(()=>restoreConversation(!state.readingEarlier));
  if(typeof syncKeyboardInset==='function')syncKeyboardInset();
}
assistant=function(){webOriginal.assistant();webAssistantLayout();nav();};
function webRadarLayout(){
  if(state.page!=='radar'||screen.querySelector('.web-radar-layout'))return;
  // Move existing controls as nodes: retain their listeners, data and selection.
  const controls=[...screen.children].filter(el=>el.matches('.row.spread,.actions,.hint,.chips'));
  const toolbar=panel('radar-toolbar',controls);
  const label=screen.querySelector('.label');
  if(label)label.after(toolbar);else screen.querySelector('.hero')?.after(toolbar);
  const map=screen.querySelector('#theme-map-slot'),places=screen.querySelector('#places');
  if(!places)return;
  const layout=panel('web-radar-layout'+(state.viewMode==='list'?' list-only':''),[]);
  if(map)layout.append(panel('web-map-column',[map]));
  const list=panel('web-place-column',[places]);list.insertAdjacentHTML('afterbegin','<button class="map-panel-toggle" data-web-toggle-places aria-expanded="true">收起地点列表 ⌄</button><div class="web-column-title"><span class="eyebrow">城市里的历史</span><h3>选择值得了解的一站</h3><p>读地点资料，再加入文化路线。</p></div>');layout.append(list);screen.append(layout);
  screen.querySelector('.hint').textContent='按城市探索已接入地点。导航终点为场馆附近；开放与预约请以场馆最新公告为准。';
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

function decorateVenueCover(){
 const cover=screen.querySelector('.hero'),p=state.current;if(!cover||!p||cover.querySelector('.venue-cover-art'))return;
 cover.classList.add('venue-cover');
 const words=panel('venue-cover-copy',[...cover.children].filter(e=>!e.matches('.motion-toggle')));
 words.querySelector('.eyebrow').textContent='山河有迹 · 循迹访馆';
 words.insertAdjacentHTML('beforeend','<div class="venue-cover-tags"><span>人物与场所</span><span>城市文化足迹</span></div>');
 cover.append(words);
 const art=document.createElement('div');art.className='venue-cover-art';
 art.innerHTML=p.photo?`<img class="venue-cover-photo" src="${esc(p.photo.url)}" alt="${esc(p.photo.caption)}"><div class="venue-cover-credit"><a href="${esc(p.photo.sourceURL)}" target="_blank" rel="noopener noreferrer">资料照片 · 来源 ↗</a><span>${esc(p.photo.author)} · ${esc(p.photo.license)}</span></div>`:'<img class="venue-cover-photo" src="/preview/assets/场馆意象.svg" alt="原创建筑意象，非实景复原">';
 art.insertAdjacentHTML('beforeend','<span class="venue-cover-seal" aria-hidden="true">循迹<br>访馆</span>');cover.append(art);
}
function arrangeVenueDetail(layout){
 decorateVenueCover();
 const service=layout.querySelector('.venue-service'),highlights=layout.querySelector('.venue-highlights');
 const related=layout.querySelector('[data-action="person"]')?.closest('.card');
 if(related){related.classList.add('venue-related');related.querySelectorAll('p.small').forEach(p=>{if(p.textContent.includes('团队主工程'))p.remove()});related.querySelectorAll('[data-action="person"]').forEach(b=>{b.classList.add('venue-person-link');b.textContent=b.textContent.replace(' · 人物档案','');b.insertAdjacentHTML('beforeend','<span aria-hidden="true"> ↗</span>')});}
 const reading=panel('venue-reading-columns',[panel('venue-reading-left',[highlights,related]),panel('venue-reading-right',[service])]);
 layout.querySelector('.venue-story')?.after(reading);
 const candidate=layout.querySelector('.venue-candidate');
 const refs=panel('venue-reference-grid',[]);
 if(candidate){const folded=document.createElement('details');folded.className='card venue-poi-fold';const summary=document.createElement('summary');summary.textContent='地图位置与坐标参考';folded.append(summary);while(candidate.firstChild)folded.append(candidate.firstChild);candidate.replaceWith(folded);refs.append(folded);}
 [...layout.children].filter(e=>e.matches('details.card')).forEach(e=>refs.append(e));
 if(refs.children.length)layout.append(refs);
 const routeButton=layout.querySelector('[data-action="page"][data-value="route"]');
 const dock=screen.querySelector('.detail-dock');
 if(dock){dock.classList.add('venue-action-bar');const ask=dock.querySelector('[data-action="ask-place"]'),add=dock.querySelector('[data-action="add"]');if(ask)ask.textContent='问小迹';if(add)add.textContent=state.stops.includes(state.current.id)?'已加入路线':'加入路线';if(routeButton){routeButton.textContent='查看路线';routeButton.className='ghost';dock.insertBefore(routeButton,add);}const old=layout.querySelector('.actions:empty');if(old)old.remove();}
 const actions=service?.querySelector('.actions');
 if(actions){const copy=actions.querySelector('[data-action="copy-address"]'),map=actions.querySelector('.venue-call'),plan=actions.querySelector('[data-action="navigate"]');if(copy)copy.textContent='复制地址';if(map)map.textContent='地图查看 ↗';if(plan){plan.textContent=state.current.routeReady?'规划到这里':'暂不可规划';plan.className='primary';actions.prepend(plan);}}
}

place=async function(id){if(state.page!=='place'||state.current?.id!==id)rememberVenue();history.replaceState(null,'','#place/'+encodeURIComponent(id));await webOriginal.place(id);if(state.page!=='place')return;const articles=[...screen.children].filter(e=>!e.matches('.hero,.label,.detail-dock'));const layout=panel('web-detail-layout',articles);layout.querySelector('article.card')?.classList.add('venue-story');layout.querySelector('.visit-focus')?.closest('.card')?.classList.add('venue-highlights');arrangeVenueDetail(layout);screen.append(layout);const dock=screen.querySelector('.detail-dock');if(dock)screen.append(dock);nav();};
let webBootComplete=false;
go=function(page){if(!webBootComplete){webBootComplete=true;const match=location.hash.match(/^#place\/(PLACE-[A-Za-z0-9_-]{1,70})$/);if(match)return place(match[1]);}if(state.page!==page)rememberVenue();webOriginal.go(page);history.replaceState(null,'','#'+page);};
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

document.addEventListener('click',e=>{if(e.target.closest('[data-venue-back]'))venueBack();});

function fitAssistantViewport(){
 try{if(parent!==window&&window.frameElement){const f=window.frameElement,holder=f.parentElement;if(!holder)return;const tab=parent.document.querySelector('uni-tabbar'),tabH=tab&&parent.getComputedStyle(tab).display!=='none'?tab.getBoundingClientRect().height:0;const vv=parent.visualViewport;const visibleBottom=vv?vv.offsetTop+vv.height-tabH:parent.innerHeight-tabH;holder.style.setProperty('height',Math.max(280,visibleBottom-holder.getBoundingClientRect().top)+'px','important');}}catch{}
}
window.fitAssistantViewport=fitAssistantViewport;
window.addEventListener('resize',()=>{if(state.page==='assistant')fitAssistantViewport()});
try{parent.visualViewport?.addEventListener('resize',()=>{if(state.page==='assistant')fitAssistantViewport()});parent.visualViewport?.addEventListener('scroll',()=>{if(state.page==='assistant')fitAssistantViewport()})}catch{}
