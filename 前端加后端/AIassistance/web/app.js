/* Web presentation only. Native miniprogram and original preview stay independent.
 * Reuses the existing conversation, data, map and itinerary functions. */
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
  const conversation=chat.querySelector('.conversation');
  if(!state.messages.length)conversation.innerHTML='<div class="web-empty-chat"><span class="web-empty-seal">迹</span><span class="eyebrow">与小迹一起，循迹而行</span><h3>从一个问题开始</h3><p>可以聊人物、问功能，<br>也可以告诉我你的城市和可用时间。</p></div>';
  layout.append(side,chat);screen.append(layout);
  chat.querySelector('#question')?.setAttribute('placeholder','问问小迹，或告诉我你的出行计划…');
}
assistant=function(){webOriginal.assistant();webAssistantLayout();nav();};
function webRadarLayout(){
  if(state.page!=='radar'||screen.querySelector('.web-radar-layout'))return;
  const map=screen.querySelector('#theme-map-slot'),places=screen.querySelector('#places');
  if(!places)return;
  const layout=panel('web-radar-layout'+(state.viewMode==='list'?' list-only':''),[]);
  if(map)layout.append(panel('web-map-column',[map]));
  const list=panel('web-place-column',[places]);list.insertAdjacentHTML('afterbegin','<div class="web-column-title"><span class="eyebrow">城市里的历史</span><h3>选择值得了解的一站</h3><p>读地点资料，再加入文化路线。</p></div>');layout.append(list);screen.append(layout);
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
  if(b.dataset.action==='web-section')toast('当前为成员4独立网页；'+b.dataset.value+'栏目将在团队合并时接入。');
  if(b.dataset.action==='add'||b.dataset.action==='action')nav();
});
window.addEventListener('hashchange',()=>{const page=location.hash.slice(1);const detail=page.match(/^place\/(PLACE-[A-Za-z0-9_-]{1,70})$/);if(detail&&(state.page!=='place'||state.current?.id!==detail[1]))place(detail[1]);else if(webLabels[page]&&page!==state.page)go(page);});
// Config may finish before this adapter loads, especially with cached scripts.
if(state.config)go(state.page==='place'?'radar':state.page);
