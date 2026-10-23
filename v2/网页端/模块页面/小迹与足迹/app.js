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
  if(['assistant','radar','route'].includes(state.page))screen.querySelectorAll('.hero .motion-toggle').forEach(button=>button.remove());
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
  screen.querySelector('.label')?.remove();
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
  syncOriginStatus();
}
route=async function(){await webOriginal.route();webRouteLayout();nav();};

const venueCoverDesigns={
 'PLACE-WX-LDY':{image:'/web/venue-covers/lu-dingyi.png',position:'100% 48%',mask:'mask-l',pos:'at-lt',seal:'seal-r',name:'陆定一',suffix:'祖居陈列馆',addr:'无锡市惠山区 · 老陆巷 4 号'},
 'PLACE-WX-QBC':{image:'/web/venue-covers/qin-bangxian.png',position:'50% 38%',mask:'mask-r',pos:'at-rm',seal:'seal-l',name:'秦邦宪',suffix:'故居',addr:'无锡市梁溪区 · 崇安寺街道'},
 'PLACE-CZ-QQB':{image:'/web/venue-covers/qu-qiubai.png',position:'50% 65%',mask:'mask-l',pos:'at-lm',seal:'seal-r',name:'瞿秋白',suffix:'纪念馆',addr:'常州市天宁区 · 延陵西路 188 号'},
 'PLACE-CZ-ZTL':{image:'/web/venue-covers/zhang-tailei.png',position:'50% 90%',mask:'mask-r',pos:'at-rt',seal:'seal-l',name:'张太雷',suffix:'纪念馆',addr:'常州市天宁区 · 延陵西路'},
 'PLACE-WX-ZWT':{image:'/web/venue-covers/zhang-wentian.png',position:'center 80%',split:true,seal:'seal-r',name:'张闻天旧居',addr:'无锡市梁溪区 · 崇安寺街道汤巷 45 号'}
};
function decorateVenueCover(){
 const cover=screen.querySelector('.hero'),p=state.current;if(!cover||!p||cover.querySelector('.venue-cover-art,.venue-cover-photo,.split-photo'))return;
 const design=venueCoverDesigns[p.id];
 cover.classList.add('venue-cover');
 if(design){
  // 五馆定制封面：全幅实景+定向遮罩，各馆文字落点不同；张闻天为上下分区
  cover.classList.add('venue-cover-custom');
  if(design.split)cover.classList.add('cover-split');else cover.classList.add(design.mask);
  const keep=[...cover.children].filter(e=>e.matches('.motion-toggle'));
  cover.innerHTML='';keep.forEach(e=>cover.append(e));
  const photo=design.split
   ?`<img class="split-photo" src="${design.image}" alt="${esc(p.name)}" style="object-position:${design.position}">`
   :`<img class="venue-cover-photo" src="${design.image}" alt="${esc(p.name)}" style="object-position:${design.position}">`;
  const copy=design.split
   ?`<div class="cover-copy split"><span class="eyebrow">山河有迹 · 循迹访馆</span><h2><span class="name">${design.name}</span></h2><p class="subtitle">${design.addr}</p></div>`
   :`<div class="cover-copy ${design.pos}"><span class="eyebrow">山河有迹 · 循迹访馆</span><h2><span class="name">${design.name}</span><span class="suffix">${design.suffix}</span></h2><p class="subtitle">${design.addr}</p></div>`;
  const seal=`<span class="venue-cover-seal ${design.seal}" aria-hidden="true">循迹<br>访馆</span>`;
  cover.insertAdjacentHTML('beforeend',design.split?copy+photo+seal:photo+seal+copy);
  return;
 }
 const words=panel('venue-cover-copy',[...cover.children].filter(e=>!e.matches('.motion-toggle')));
 words.querySelector('.eyebrow').textContent='山河有迹 · 循迹访馆';
 words.insertAdjacentHTML('beforeend','<div class="venue-cover-tags"><span>人物与场所</span><span>城市文化足迹</span></div>');
 cover.append(words);
 const art=document.createElement('div');art.className='venue-cover-art';
 const image=design?.image||p.photo?.url||'/preview/assets/场馆意象.svg';
 const alt=p.photo?.caption||p.name||'场馆实景';
 art.innerHTML=`<img class="venue-cover-photo" src="${esc(image)}" alt="${esc(alt)}"${design?` style="object-position:${design.position}"`:''}>${p.photo?`<div class="venue-cover-credit"><a href="${esc(p.photo.sourceURL)}" target="_blank" rel="noopener noreferrer">资料照片 · 来源 ↗</a><span>${esc(p.photo.author)} · ${esc(p.photo.license)}</span></div>`:''}`;
 art.insertAdjacentHTML('beforeend','<span class="venue-cover-seal" aria-hidden="true">循迹<br>访馆</span>');cover.append(art);
}
function arrangeVenueDetail(layout){
 decorateVenueCover();
 const service=layout.querySelector('.venue-service'),highlights=layout.querySelector('.venue-highlights');
 if(state.current?.id==='PLACE-WX-LDY'&&service){
  layout.querySelectorAll('.venue-candidate p').forEach(el=>{if(el.textContent.includes('（未独立确认）'))el.textContent=el.textContent.replaceAll('（未独立确认）','');});
  service.querySelectorAll(':scope > .hint,:scope > p.small,:scope > .venue-contacts').forEach(el=>el.remove());
  service.querySelectorAll('.venue-service-row').forEach(row=>{if(row.querySelector('strong')?.textContent.trim()==='门票记录')row.remove();});
 }

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

let webAccount=localStorage.getItem('yingji_user_id')||'';window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='yingji-account-refresh')return;const id=localStorage.getItem('yingji_user_id')||'';if(id===webAccount)return;webAccount=id;state.stops=readLocal('yingji-route-v1',[]);state.stays=readLocal('yingji-stay-v1',{});state.budget=readLocal('yingji-budget-minutes-v1',0);state.routeOrigin=readLocal('yingji-route-origin-v1',null);state.routeError='';state.walkResult=null;state.messages=[];state.current=null;state.selectedId='';go(state.page==='place'?'radar':state.page);});

document.addEventListener('click',e=>{if(e.target.closest('[data-venue-back]'))venueBack();});

function fitAssistantViewport(){
 try{if(parent!==window&&window.frameElement){const holder=window.frameElement.parentElement;if(!holder)return;const screen=document.querySelector('#screen');if(!screen)return;const height=Math.ceil(Math.max(document.body.getBoundingClientRect().height,screen.getBoundingClientRect().bottom+24));holder.style.setProperty('height',height+'px','important');window.frameElement.setAttribute('scrolling','no');}}catch{}
}
let assistantResizeObserver;
function observeAssistantHeight(){if(assistantResizeObserver)return;const screen=document.querySelector('#screen');if(screen){assistantResizeObserver=new ResizeObserver(()=>requestAnimationFrame(fitAssistantViewport));assistantResizeObserver.observe(screen);}}
observeAssistantHeight();
window.fitAssistantViewport=fitAssistantViewport;
window.addEventListener('resize',()=>{if(state.page==='assistant')fitAssistantViewport()});
try{parent.visualViewport?.addEventListener('resize',()=>{if(state.page==='assistant')fitAssistantViewport()});}catch{}
