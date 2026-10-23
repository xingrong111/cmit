<template>
  <view class="relation-graph">
    <view class="graph-heading">
      <view><text class="graph-eyebrow">RELATION ATLAS</text><text class="graph-title">人物关系 · 四方展开</text></view>
      <text class="graph-count">{{ filteredNodes.length }} 个关联节点 · {{ filteredEdges.length }} 条可读联系</text>
    </view>
    <view class="graph-modes"><button :class="{active:mode==='network'}" @tap="mode='network'">人物联系</button><button :class="{active:mode==='era'}" @tap="mode='era'">时代关联</button></view>
    <view class="graph-themes"><button v-for="item in themeOptions" :key="item" :class="{active:theme===item}" @tap="theme=item">{{item==='all'?'全部主题':item}}</button></view>
    <view class="graph-filters">
      <button v-for="item in availableFilters" :key="item.value" class="filter-button" :class="{ selected: filter === item.value }" @tap="filter = item.value">{{ item.label }}</button>
    </view>
    <view class="graph-viewport" :id="viewportId" :style="{height:viewportHeight+'px'}" @touchstart="handleTouchStart" @touchmove.stop.prevent="handleTouchMove" @touchend="handleTouchEnd" @touchcancel="handleTouchEnd" @mousedown="startMousePan" @mousemove="moveMousePan" @mouseup="endPan" @mouseleave="endPan">
      <view class="graph-grid"/><view class="graph-watermark">山河有迹</view><view v-if="!measured" class="graph-loading">正在展开人物关系…</view>
      <view class="graph-stage" :class="{'graph-ready':measured}" :style="stageStyle">
        <view v-for="edge in renderedEdges" :key="edge.id" class="graph-edge" :class="{'edge-selected':focusedEdge?.id===edge.id}" :style="edge.style" @tap.stop="selectEdge(edge)">
          <view v-for="(segment,i) in edge.segments" :key="i" class="ink-segment" :style="segment" /><text class="edge-label" :style="edge.labelStyle">{{ relationLabel(edge.type).slice(0,10) }}</text>
        </view>
        <view v-for="node in positionedNodes" :key="node.id" class="graph-node" :class="['kind-' + node.kind,{'node-anchor':node.id===nodes[0]?.id,'node-selected':node.id===selectedId,'has-image':Boolean(nodeArt(node)),'node-linked':focusedEdge&&(node.id===focusedEdge.from_id||node.id===focusedEdge.to_id)}]" :style="node.style" @tap.stop="selectNode(node)">
          <image v-if="nodeArt(node)" class="node-portrait" :src="nodeArt(node)" mode="aspectFit"/><image v-else class="node-symbol-icon" :src="'/static/icons/'+(node.kind==='person'?'people':node.kind==='event'?'calendar':'source')+'.png'" aria-hidden="true"/><text class="node-kind">{{ node.id===nodes[0]?.id?(node.person_id?'中心人物':'当前中心'):kindLabel(node.kind) }}</text><text class="node-name">{{ node.name }}</text><text v-if="node.id!==nodes[0]?.id" class="node-relation">{{ nodeRelation(node.id) }}</text>
        </view>
      </view>
      <view v-if="!visibleNodes.length" class="graph-empty">暂无这一类关系记录</view>
      <view class="graph-legend"><text class="legend-person">● 人物</text><text class="legend-group">● 机构</text><text class="legend-event">● 时代片段</text></view>
    </view>
    <view v-if="!filteredEdges.length" class="graph-sparse-note">{{mode==='network'?'本批资料尚未记载这一范围的人物联系，可切换“时代关联”阅读现有片段。':'此筛选下暂无记录，可切换其他主题。'}}</view>
    <view v-if="pageCount>1" class="graph-pages"><button :disabled="page===0" @tap="page--">上一组</button><text>{{page+1}} / {{pageCount}} · 分组展示防止重叠</text><button :disabled="page===pageCount-1" @tap="page++">下一组</button></view>
    <view v-if="focusedEdge" class="graph-evidence"><view><text class="graph-evidence-title">{{nodeById[focusedEdge.from_id]?.name}} · {{nodeById[focusedEdge.to_id]?.name}}</text><text class="graph-evidence-description">{{relationLabel(focusedEdge.type)}}</text></view><button v-if="focusedEdge.source_id" class="source-button" @tap="selectSource(focusedEdge.source_id)">查看关系出处 ↗</button><button class="zoom-button" aria-label="关闭关系说明" @tap="focusedEdge=null">×</button></view>
    <view class="graph-controls">

      <view class="zoom-controls"><button class="zoom-button" aria-label="缩小关系图" @tap="zoomBy(0.8)">−</button><text class="zoom-value">{{ Math.round(scale * 100) }}%</text><button class="zoom-button" aria-label="放大关系图" @tap="zoomBy(1.25)">+</button><button class="reset-button" @tap="resetView">复位</button></view>
    </view>
    <view class="relation-list">
      <view class="list-heading"><text>全部联系索引</text></view>
      <view v-if="!filteredEdges.length" class="list-empty">此筛选下没有已收录的联系。可切换“全部”查看。</view>
      <view v-for="edge in filteredEdges" :key="edge.id" class="relation-row">
        <view class="relation-description"><text class="relation-name" @tap="selectNode(nodeById[edge.from_id])">{{ nodeById[edge.from_id]?.name }}</text><text class="relation-type">{{ relationLabel(edge.type) }}</text><text class="relation-name" @tap="selectNode(nodeById[edge.to_id])">{{ nodeById[edge.to_id]?.name }}</text></view>
        <button v-if="edge.source_id" class="source-button" @tap="selectSource(edge.source_id)">查看出处 ↗</button><text v-else class="source-missing">来源待补</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import artworks from '../data/IP形象.json'
import portraits from '../data/人物肖像.json'
function nodeArt(node){const p=portraits[node.person_id];if(p?.identityVerified&&(p.rightsApproved||p.displayApproved))return p.src;return Object.values(artworks).find(a=>a.personId&&a.personId===node.person_id)?.src||''}

// Cross-platform view-based graph; H5 uses native mouse events to retain button and coordinate fields.
// props.graph: { nodes: [{ id, name, kind, person_id?, event_id? }],
//                edges: [{ id, from_id, to_id, type, source_id? }] }
// Emits the original node object via `node`, and a source ID via `source`.
const props = defineProps({ graph: { type: Object, default: () => ({ nodes: [], edges: [] }) },selectedId:String })
const emit = defineEmits(['node', 'source', 'edge'])
const instance = getCurrentInstance()
const viewportId = `relation-viewport-${instance?.uid || 0}`
const filter = ref('all'),mode=ref('network'),theme=ref('all')
const page=ref(0)
const focusedEdge=ref(null)
const filters = [{ value: 'all', label: '全部' }, { value: 'person', label: '人物' }, { value: 'event', label: '事件' }, { value: 'group', label: '组织' }, {value:'collective',label:'群体'},{value:'school',label:'学校'},{value:'publication',label:'刊物'},{value:'place',label:'地点'},{value:'artifact',label:'作品'},{value:'record',label:'摘读'},{value:'entity',label:'其他'}]
const measured=ref(false)
const scale = ref(0.5)
const panX = ref(0)
const panY = ref(0)
const viewportWidth = ref(320)
const viewportHeight = computed(()=>visibleNodes.value.length<=1?300:560)
let panOrigin = null, pinchOrigin=null, viewportLeft=0, viewportTop=0
let suppressTapUntil = 0
const nodes = computed(() => props.graph?.nodes || [])
const nodeById = computed(() => Object.fromEntries(nodes.value.map(node => [node.id, node])))
const edges = computed(() => (props.graph?.edges || []).filter(edge => nodeById.value[edge.from_id] && nodeById.value[edge.to_id]))
const eligibleEdges=computed(()=>edges.value.filter(e=>mode.value==='era'||e.category!=='context'))
const themeOptions=computed(()=>['all',...new Set(eligibleEdges.value.map(e=>e.theme||'其他联系'))])
const themedEdges=computed(()=>eligibleEdges.value.filter(e=>theme.value==='all'||(e.theme||'其他联系')===theme.value))
const availableFilters=computed(()=>filters.filter(f=>f.value==='all'||themedEdges.value.some(e=>[e.from_id,e.to_id].some(id=>id!==nodes.value[0]?.id&&normalizeKind(nodeById.value[id]?.kind)===f.value))))
const filteredEdges=computed(()=>themedEdges.value.filter(e=>filter.value==='all'||[e.from_id,e.to_id].some(id=>id!==nodes.value[0]?.id&&normalizeKind(nodeById.value[id]?.kind)===filter.value)))
const filteredNodes=computed(()=>{const ids=new Set(filteredEdges.value.flatMap(e=>[e.from_id,e.to_id]));return nodes.value.filter((n,i)=>i===0||ids.has(n.id))})
const pageCount=computed(()=>Math.max(1,Math.ceil((filteredNodes.value.length-1)/6)))
const visibleNodes=computed(()=>filteredNodes.value.length?[filteredNodes.value[0],...filteredNodes.value.slice(1+page.value*6,1+(page.value+1)*6)]:[])
const visibleIds = computed(() => new Set(visibleNodes.value.map(node => node.id)))
const visibleEdges = computed(() => filteredEdges.value.filter(edge => visibleIds.value.has(edge.from_id) && visibleIds.value.has(edge.to_id)))
const inkColors=['#587459','#557c8a','#983f38','#a58a48','#82718f','#ae7245']
const layout = computed(() => {
  const count=visibleNodes.value.length,width=860,height=820,positions={}
  visibleNodes.value.forEach((node,index)=>{
    if(index===0){positions[node.id]={x:width/2,y:height/2};return}
    const angle=-Math.PI/2+(index-1)*Math.PI*2/Math.max(1,count-1)
    positions[node.id]={x:width/2+Math.cos(angle)*300,y:height/2+Math.sin(angle)*290}
  })
  return {width,height,positions}
})
const stageStyle = computed(() => ({ width: `${layout.value.width}px`, height: `${layout.value.height}px`, transform: `translate(${panX.value}px, ${panY.value}px) scale(${scale.value})` }))
function nodeRelation(id){return visibleEdges.value.filter(e=>e.from_id===id||e.to_id===id).map(e=>relationLabel(e.type)).join(' · ')}
const positionedNodes = computed(() => visibleNodes.value.map((node,index) => ({ ...node, style: { left: `${layout.value.positions[node.id].x - 63}px`, top: `${layout.value.positions[node.id].y - 42}px`, '--node-ink':index===0?'#982b28':inkColors[(index-1)%inkColors.length] } })))
const renderedEdges = computed(() => visibleEdges.value.map((edge,index) => {
  const a=layout.value.positions[edge.from_id],b=layout.value.positions[edge.to_id]
  const cy=(a.y+b.y)/2,cx=(a.x+b.x)/2,segments=[]
  let last=a
  for(let i=1;i<=36;i++){
    const t=i/36,q=1-t,p={x:q*q*a.x+2*q*t*cx+t*t*b.x,y:q*q*a.y+2*q*t*cy+t*t*b.y}
    segments.push({left:last.x+'px',top:last.y+'px',width:Math.hypot(p.x-last.x,p.y-last.y)+1+'px',transform:`rotate(${Math.atan2(p.y-last.y,p.x-last.x)}rad)`,backgroundColor:inkColors[index%inkColors.length]})
    last=p
  }
  return {...edge,segments,style:{left:0,top:0,width:layout.value.width+'px',height:layout.value.height+'px'},labelStyle:{display:'none'}}
}))
function normalizeKind(kind) { return ['group', 'organization', 'organisation'].includes(kind) ? 'group' : kind }
function kindLabel(kind) { return ({ person: '人物', event: '事件', group: '组织', entity:'关联对象',collective:'人物群体',school:'学校',publication:'刊物',place:'地点',artifact:'作品',record:'史料' })[normalizeKind(kind)] || '记录' }
function relationLabel(type) {
  return ({ related_event: '相关事迹', person_event: '相关事迹', participated: '参与', participation: '参与', colleague: '同事', comrade: '战友', spouse: '夫妻', marriage: '夫妻', teacher: '师生', family: '亲属', member: '成员', membership: '成员', friend: '友人', related: '相关联系' })[type] || type || '相关联系'
}
function selectNode(node) { if (node && Date.now() >= suppressTapUntil) emit('node', nodeById.value[node.id] || node) }
function selectSource(id) { if (id && Date.now() >= suppressTapUntil) emit('source', id) }
function selectEdge(edge){if(Date.now()>=suppressTapUntil){focusedEdge.value=edge;emit('edge',edge)}}
watch([mode,theme],()=>{filter.value='all';page.value=0;focusedEdge.value=null;nextTick(measure)})
watch(mode,()=>{theme.value='all'})
watch(filter,()=>{page.value=0;focusedEdge.value=null;nextTick(resetView)})
watch(page,()=>{focusedEdge.value=null;nextTick(resetView)})
function point(event) { const touch = event.touches?.[0]; return touch ? { x: touch.clientX ?? touch.pageX, y: touch.clientY ?? touch.pageY } : null }
function handleTouchStart(event){
  // #ifndef H5
  startPan(event)
  // #endif
}
function handleTouchMove(event){
  // #ifndef H5
  movePan(event)
  // #endif
}
function handleTouchEnd(event){
  // #ifndef H5
  endTouch(event)
  // #endif
}
function touchPair(event){
  const ts=event.touches||[];if(ts.length<2)return null
  const a=ts[0],b=ts[1],ax=a.clientX??a.pageX,ay=a.clientY??a.pageY,bx=b.clientX??b.pageX,by=b.clientY??b.pageY
  return {x:(ax+bx)/2,y:(ay+by)/2,distance:Math.hypot(bx-ax,by-ay)}
}
function localPoint(p){
  // #ifdef H5
  const rect=document.getElementById(viewportId)?.getBoundingClientRect();if(rect){viewportLeft=rect.left;viewportTop=rect.top}
  // #endif
  return {x:p.x-viewportLeft,y:p.y-viewportTop}
}
function beginPinch(pair){const c=localPoint(pair);pinchOrigin={distance:Math.max(1,pair.distance),scale:scale.value,worldX:(c.x-panX.value)/scale.value,worldY:(c.y-panY.value)/scale.value};panOrigin=null;suppressTapUntil=Date.now()+500}
function startPan(event) {
  const pair=touchPair(event)
  if(pair){beginPinch(pair);uni.createSelectorQuery().in(instance.proxy).select(`#${viewportId}`).boundingClientRect(rect=>{if(rect&&pinchOrigin){viewportLeft=rect.left;viewportTop=rect.top;beginPinch(pair)}}).exec();return}
  const p=point(event);if(p)panOrigin={...p,x0:panX.value,y0:panY.value,moved:false}
}
function movePan(event) {
  const pair=touchPair(event)
  if(pair){if(!pinchOrigin)beginPinch(pair);const c=localPoint(pair),nextScale=Math.max(0.2,Math.min(2,pinchOrigin.scale*pair.distance/pinchOrigin.distance));panX.value=c.x-pinchOrigin.worldX*nextScale;panY.value=c.y-pinchOrigin.worldY*nextScale;scale.value=nextScale;suppressTapUntil=Date.now()+500;return}
  updatePan(point(event))
}
function endTouch(event){const wasPinching=Boolean(pinchOrigin);pinchOrigin=null;endPan();if(wasPinching)suppressTapUntil=Date.now()+500;if(event.touches?.length===1)startPan(event)}
function startMousePan(event) {
  if (event.button !== 0) return
  panOrigin = { x: event.clientX, y: event.clientY, x0: panX.value, y0: panY.value, moved: false }
}
function moveMousePan(event) { if (event.buttons === 1) updatePan({ x: event.clientX, y: event.clientY }) }
function updatePan(p) {
  if (!p || !panOrigin) return
  const dx = p.x - panOrigin.x, dy = p.y - panOrigin.y
  if (Math.hypot(dx, dy) > 6) panOrigin.moved = true
  if (panOrigin.moved) { panX.value = panOrigin.x0 + dx; panY.value = panOrigin.y0 + dy }
}
function endPan() { if (panOrigin?.moved) suppressTapUntil = Date.now() + 350; panOrigin = null }
function zoomAt(multiplier,x,y){
  const oldScale=scale.value,nextScale=Math.max(0.2,Math.min(2,oldScale*multiplier)),ratio=nextScale/oldScale
  panX.value=x-(x-panX.value)*ratio;panY.value=y-(y-panY.value)*ratio;scale.value=nextScale
}
function zoomBy(multiplier){zoomAt(multiplier,viewportWidth.value/2,viewportHeight.value/2)}
function resetView() {
  pinchOrigin=null;panOrigin=null
  scale.value = Math.max(0.44, Math.min(1, (viewportWidth.value - 24) / layout.value.width, (viewportHeight.value - 34) / layout.value.height))
  panX.value = (viewportWidth.value - layout.value.width * scale.value) / 2
  panY.value = (viewportHeight.value - layout.value.height * scale.value) / 2
}
function measure() {
  measured.value=false
  nextTick(() => uni.createSelectorQuery().in(instance.proxy).select(`#${viewportId}`).boundingClientRect(rect => {
    if (rect?.width) viewportWidth.value = rect.width
    resetView();measured.value=true
  }).exec())
}
// #ifdef H5
let mouseElement=null;
function nativeTouchMove(event){event.preventDefault();movePan(event)}
function wheelZoom(event){if(!event.deltaY)return;event.preventDefault();const p=localPoint({x:event.clientX,y:event.clientY}),delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?viewportHeight.value:1);zoomAt(Math.exp(-Math.max(-160,Math.min(160,delta))*0.0025),p.x,p.y)}

function bindMouse(){mouseElement?.removeEventListener('touchstart',startPan);mouseElement?.removeEventListener('touchmove',nativeTouchMove);mouseElement?.removeEventListener('touchend',endTouch);mouseElement?.removeEventListener('touchcancel',endTouch);mouseElement?.removeEventListener('wheel',wheelZoom);mouseElement?.removeEventListener('mousedown',startMousePan);mouseElement?.removeEventListener('mousemove',moveMousePan);mouseElement?.removeEventListener('mouseleave',endPan);mouseElement=document.getElementById(viewportId);mouseElement?.addEventListener('touchstart',startPan,{passive:true});mouseElement?.addEventListener('touchmove',nativeTouchMove,{passive:false});mouseElement?.addEventListener('touchend',endTouch);mouseElement?.addEventListener('touchcancel',endTouch);mouseElement?.addEventListener('wheel',wheelZoom,{passive:false});mouseElement?.addEventListener('mousedown',startMousePan);mouseElement?.addEventListener('mousemove',moveMousePan);mouseElement?.addEventListener('mouseleave',endPan)}
onMounted(()=>{bindMouse();window.addEventListener('mouseup',endPan)});
onBeforeUnmount(()=>{mouseElement?.removeEventListener('touchstart',startPan);mouseElement?.removeEventListener('touchmove',nativeTouchMove);mouseElement?.removeEventListener('touchend',endTouch);mouseElement?.removeEventListener('touchcancel',endTouch);mouseElement?.removeEventListener('wheel',wheelZoom);mouseElement?.removeEventListener('mousedown',startMousePan);mouseElement?.removeEventListener('mousemove',moveMousePan);mouseElement?.removeEventListener('mouseleave',endPan);window.removeEventListener('mouseup',endPan)});
// #endif
onMounted(()=>{measure();uni.onWindowResize(measure)})
onBeforeUnmount(()=>uni.offWindowResize(measure))
watch(() => props.graph, ()=>{page.value=0;filter.value='all';theme.value='all';focusedEdge.value=null;if(!edges.value.some(e=>e.category!=='context'))mode.value='era';nextTick(measure)}, { deep: true,immediate:true })
</script>

<style scoped>
.graph-stage{opacity:0}.graph-stage.graph-ready{opacity:1}.graph-loading{position:absolute;inset:0;z-index:4;background:var(--paper);display:flex;align-items:center;justify-content:center;color:var(--muted)}
.relation-graph { color: var(--ink); min-width: 0; max-width: 100%; }
.graph-heading { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px; margin-bottom: 18px; }
.graph-eyebrow { display: block; font-size: 12px; letter-spacing: 3px; color: var(--gold); margin-bottom: 8px; }
.graph-title { display: block; font-family: serif; font-size: 22px; font-weight: 600; }
.graph-count { font-size: 12px; color: var(--muted); }
.graph-filters { display: flex; gap: 8px; margin-bottom: 14px; }
.filter-button, .zoom-button, .reset-button, .source-button { margin: 0; border: 0; line-height: 1.4; font-weight: normal; border-radius: 4px; min-height: 44px; min-width: 44px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
button::after { border: none; }
.filter-button { padding: 7px 16px; font-size: 12px; color: var(--muted); background: var(--card); border: 1px solid var(--line); }
.filter-button.selected { color: var(--paper); background: var(--green); border-color: var(--green); }
.graph-viewport { position: relative; height: 390px; overflow: hidden; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); touch-action: none; }
.graph-grid { position: absolute; inset: 0; opacity: .2; background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px); background-size: 28px 28px; pointer-events: none; }
.graph-stage { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
.graph-node { position: absolute; width: 110px; height: 64px; z-index: 2; border: 1px solid var(--gold); border-radius: 6px; background: var(--green); color: var(--paper); display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 0 4px; box-sizing: border-box; }
.kind-event { background: var(--card); color: var(--ink); border-color: var(--gold); }
.kind-group, .kind-organization, .kind-organisation { background: var(--red); }
.node-kind { font-size: 15px; letter-spacing: 1px; opacity: .8; margin-bottom: 4px; }
.node-name { font-family: serif; font-size: 22px; line-height: 24px; text-align: center; max-width: 102px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.graph-edge { position: absolute; height: 28px; transform-origin: 0 50%; z-index: 1; display: flex; align-items: center; justify-content: center; }
.edge-stroke { position: absolute; top: 13px; left: 0; width: 100%; height: 1px; background: var(--gold); opacity: .7; }
.edge-label { display:none; }
.graph-evidence{display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:18px;border:1px solid var(--line);border-radius:12px;background:var(--card);margin-top:14px}.graph-evidence>view{flex:1;min-width:180px}.graph-evidence-title{display:block;font-size:17px;color:var(--green)}.graph-evidence-description{display:block;font-size:13px;line-height:1.8;color:var(--muted);margin-top:6px}
.graph-legend { position: absolute; bottom: 12px; left: 14px; display: flex; gap: 14px; font-size: 12px; padding: 5px 7px; background: var(--paper); pointer-events: none; }
.legend-person { color: var(--green); }.legend-event { color: var(--gold); }.legend-group { color: var(--red); }
.graph-empty { position: absolute; top: 45%; width: 100%; text-align: center; color: var(--muted); font-size: 13px; }
.graph-controls { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0 20px; }
.graph-hint { color: var(--muted); font-size: 12px; line-height: 1.7; }
.zoom-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.zoom-button { width: 44px; height: 44px; padding: 0; line-height: 44px; font-size: 20px; color: var(--ink); background: var(--card); border: 1px solid var(--line); }
.zoom-value { font-size: 12px; min-width: 34px; text-align: center; color: var(--muted); }
.reset-button { padding: 10px 12px; font-size: 12px; color: var(--green); background: var(--card); border: 1px solid var(--line); }
.relation-list { border-top: 1px solid var(--line); }
.list-heading { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; padding: 18px 0 10px; font-family: serif; font-size: 17px; }
.list-caption { font-family: sans-serif; font-size: 12px; line-height: 1.7; color: var(--muted); }
.relation-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 9px; padding: 14px 0; border-bottom: 1px solid var(--line); }
.relation-description { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 14px; line-height: 1.8; min-width: 0; max-width: 100%; overflow-wrap: anywhere; word-break: break-all; }
.relation-name { color: var(--green); display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; max-width: 100%; }.relation-type { color: var(--muted); font-size: 12px; max-width: 100%; }
.source-button { color: var(--red); background: transparent; font-size: 12px; padding: 10px 12px; white-space: nowrap; }
.source-missing, .list-empty { color: var(--muted); font-size: 12px; padding: 12px 0; }
@media (max-width: 420px) { .graph-title { font-size: 20px; }.filter-button { flex: 1; min-width: 44px; padding: 10px 6px; }.graph-heading { gap: 8px; }.graph-count { width: 100%; }.relation-row { gap: 4px; } }
</style>
<style scoped>.node-symbol-icon{position:absolute;right:4px;top:4px;width:80px;height:80px;opacity:.13;pointer-events:none}</style>
<style scoped>
.relation-graph{padding:24px;border:1px solid #ddc9ac;border-radius:24px;background:linear-gradient(145deg,#fffaf1,#f7efdf);box-shadow:0 12px 40px #53391b08}.graph-heading{padding-bottom:20px;border-bottom:1px solid #e3d3b8}.graph-title{font-weight:400;color:#354d43;font-size:26px}.graph-filters{flex-wrap:wrap}.filter-button{border-radius:20px;padding:9px 18px}.graph-viewport{height:520px;border-radius:20px;background:radial-gradient(ellipse at center,#fffdf7 0%,#f2e7d3 100%)}.graph-grid{opacity:.35;background-image:radial-gradient(#bd9a6760 1px,transparent 1px);background-size:22px 22px}.graph-watermark{position:absolute;right:22px;bottom:48px;writing-mode:vertical-rl;font-family:serif;font-size:24px;letter-spacing:8px;color:#b2997330;pointer-events:none}.graph-node{width:160px;height:116px;border-radius:20px;background:#fffcf5;border:2px solid #c7b08a;color:#354d43;box-shadow:0 8px 18px #533c2010;padding:12px;overflow:hidden}.graph-node.node-anchor{background:#982b28;color:#fff8e8;border:3px solid #c8a16d;box-shadow:0 0 0 9px #bd9a671c,0 12px 30px #982b2820}.graph-node.kind-event{border-radius:12px;border-top:5px solid #bd9a67}.graph-node.kind-group{background:#354d43;color:#fff8e8}.node-kind{font-size:19px;margin-bottom:7px;letter-spacing:2px}.node-name{font-size:27px;line-height:32px;max-width:146px;position:relative;z-index:1}.node-symbol{position:absolute;right:6px;top:0;font:80px/1.1 serif;opacity:.07}.node-portrait{position:absolute;right:-12px;bottom:-12px;width:100px;height:126px;opacity:.3;pointer-events:none}.node-anchor .node-portrait{opacity:.25}.graph-edge{height:44px}.edge-stroke{top:21px;height:2px;background:linear-gradient(90deg,#982b2840,#bd9a67,#354d4360)}.edge-label{display:block;z-index:1;font-size:19px;line-height:28px;max-width:180px;padding:4px 10px;border:1px solid #ddc8a5;border-radius:20px;background:#fffaf1;color:#75604b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 8px #54331308}.edge-selected .edge-stroke{height:4px;background:#982b28}.edge-selected .edge-label{color:#982b28;border-color:#982b28}.node-linked{box-shadow:0 0 0 6px #bd9a6730}.graph-legend{border-radius:20px;padding:7px 12px;font-size:11px;gap:10px;background:#fffaf1e8}.graph-pages{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:16px}.graph-pages text{font-size:12px;color:#75604b}.graph-pages button{display:flex;align-items:center;justify-content:center;padding:8px 16px;min-height:40px;margin:0;border:1px solid #bd9a67;border-radius:8px;background:#fffaf1;color:#982b28;font-size:13px}.graph-pages button[disabled]{opacity:.4}.relation-list{border-top:0}.relation-row{background:#fffaf1;border:1px solid #e5d6be;border-left:3px solid #bd9a67;border-radius:12px;padding:12px 16px;margin:10px 0}.relation-name{font-family:serif;font-size:16px}.relation-type{padding:3px 10px;border-radius:16px;background:#f2e7d5}.graph-evidence{border-color:#bd9a67;background:#f4ead9}.source-button{border:1px solid #dfccad;border-radius:8px;min-height:38px}.graph-controls{gap:12px}.zoom-controls{padding:5px;background:#efe4d1;border-radius:12px}.zoom-button,.reset-button{border:0;background:#fffaf1;border-radius:8px}
@media(max-width:650px){.relation-graph{padding:14px;border-radius:18px}.graph-title{font-size:22px}.graph-filters{gap:6px}.filter-button{min-width:46px;padding:9px 10px}.graph-controls{flex-direction:column;align-items:flex-start}.relation-row{padding:10px 12px}.graph-count{line-height:1.8}.graph-pages{gap:8px}.graph-pages text{font-size:11px}}
</style>
<style scoped>
.relation-graph{padding:20px;border-radius:16px;background:#fbf7ed;box-shadow:none}.graph-title{font-size:25px}.graph-modes{display:flex;width:fit-content;gap:4px;padding:4px;background:#eee5d4;border-radius:10px;margin:0 0 16px}.graph-modes button{margin:0;border:0;background:transparent;padding:9px 18px;min-height:40px;font-size:14px;color:#7d6a4f;border-radius:7px}.graph-modes .active{background:#354d43;color:#fffaf0}.graph-themes{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}.graph-themes button{margin:0;min-height:34px;padding:5px 12px;font-size:12px;border:1px solid transparent;color:#8b795c;background:transparent;border-radius:18px;line-height:1.7}.graph-themes button.active{border-color:#d3bd99;color:#982b28;background:#f3e9d6}.graph-filters{margin-bottom:16px}.filter-button{border-radius:7px;font-size:12px;min-height:34px;padding:6px 12px}.graph-viewport{border-radius:12px}.graph-grid{opacity:.22}.graph-node{border-radius:13px;padding:10px;border-width:1px}.node-kind{font-size:12px;letter-spacing:1px;margin-bottom:7px}.node-name{font-size:19px;line-height:26px;max-width:140px}.graph-node.node-anchor{border-width:2px;background:#982b28}.graph-node.kind-school{border-color:#738e78;background:#eef2e8}.graph-node.kind-publication{border-color:#bca174;background:#f7efdc}.graph-node.kind-place{border-color:#899b9b;background:#eef2ed}.graph-node.kind-artifact,.graph-node.kind-record{background:#f4eddf;border-color:#c4ac87}.graph-node.kind-group{background:#e5ecdf;color:#354d43;border-color:#8d9c81}.node-portrait{width:43px;height:43px;border-radius:50%;flex-shrink:0;margin-bottom:6px;background:#f2e7d4;border:1px solid #c6ad83}.has-image .node-kind{display:none}.has-image .node-name{font-size:18px;line-height:23px}.edge-label{max-width:138px;font-size:11px;padding:3px 7px}.graph-legend{font-size:10px}.graph-sparse-note{padding:13px 16px;margin:12px 0;font-size:12px;color:#887358;background:#f1e9d8;border-radius:9px;line-height:1.8}.graph-controls{padding-bottom:15px}.graph-hint{font-size:11px}.graph-evidence-title{font-size:16px}.graph-heading{margin-bottom:16px;padding-bottom:16px}.relation-row{border-left-width:2px;border-radius:9px}.relation-list .relation-name{font-size:15px}.relation-type{font-size:11px;max-width:100%}.list-caption{font-size:11px}
@media(max-width:650px){.relation-graph{padding:13px;border-radius:12px}.graph-title{font-size:21px}.graph-modes{width:100%;box-sizing:border-box}.graph-modes button{flex:1;padding:8px}.graph-themes{gap:4px}.graph-themes button{padding:5px 9px;font-size:11px}.filter-button{flex:none;min-height:33px;font-size:11px;padding:5px 10px}.graph-count{font-size:11px}}
</style>

<style scoped>.graph-node.node-selected:not(.node-anchor){box-shadow:0 0 0 6px #bd9a672b;border-color:#982b28}</style>

<style scoped>.graph-node.kind-collective{background:#edf0e4;border-color:#9ba887}</style>

<style scoped>
.graph-heading{padding-bottom:13px;margin-bottom:13px}.graph-eyebrow{font-size:10px;margin-bottom:5px}.graph-title{font-size:23px}.graph-modes{margin-bottom:11px}.graph-themes{margin-bottom:9px}.graph-filters{margin-bottom:12px}.graph-node{cursor:pointer}.graph-node:hover{border-color:#982b28}
@media(max-width:650px){.graph-title{font-size:20px}.graph-heading{gap:4px}.graph-count{font-size:10px}}
</style>

<style scoped>
/* A reading scroll: colored ink connections retain their real endpoints. */
.graph-viewport{background:#fbf5e9;border:0;border-top:1px solid #e2d2b8;border-bottom:1px solid #e2d2b8;border-radius:0}
.graph-grid{background:linear-gradient(0deg,#fbf5e9 0%,#fbf5e9bb 45%,#fbf5e9ef 100%),url('/static/青绿山水.jpg') center bottom/cover no-repeat;opacity:.58}
.graph-watermark{writing-mode:horizontal-tb;right:24px;bottom:45px;font-size:18px;letter-spacing:5px;color:#917c5440}
.graph-edge{pointer-events:none;display:block;transform:none;z-index:1}
.ink-segment{position:absolute;height:2px;transform-origin:0 50%;opacity:.42;pointer-events:auto;cursor:pointer;padding:3px 0;background-clip:content-box;box-sizing:content-box;margin-top:-3px}
.edge-selected .ink-segment{opacity:1;height:3px}
.graph-node,.graph-node.kind-event,.graph-node.kind-school,.graph-node.kind-publication,.graph-node.kind-place,.graph-node.kind-artifact,.graph-node.kind-record,.graph-node.kind-group,.graph-node.kind-collective{width:126px;height:84px;border:0!important;box-shadow:none!important;border-radius:0;padding:0;background:transparent!important;color:var(--node-ink);overflow:visible;justify-content:center}
.graph-node::before{content:'';position:absolute;left:55px;top:34px;width:14px;height:14px;border-radius:50%;background:var(--node-ink);border:3px solid #fbf5e9;box-shadow:0 0 0 1px var(--node-ink)}
.graph-node.node-selected::before{box-shadow:0 0 0 5px #bd9a6740,0 0 0 1px var(--node-ink)}
.node-name,.has-image .node-name{position:absolute;top:67px;left:-19px;width:164px;max-width:164px;font:22px/1.45 STSong,SimSun,serif;color:var(--node-ink);text-align:center;display:block;overflow:visible}
.node-kind,.has-image .node-kind{display:block;position:absolute;top:112px;left:0;width:126px;text-align:center;font-size:10px;letter-spacing:3px;opacity:.7}
.node-relation{position:absolute;top:139px;left:-19px;width:164px;font-size:12px;line-height:1.7;text-align:center;color:#7d6a51;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.node-portrait,.node-anchor .node-portrait{position:absolute;left:34px;right:auto;top:-47px;bottom:auto;width:58px;height:68px;opacity:1;border-radius:30px 30px 5px 5px;object-fit:cover;border:1px solid #cbb48e;background:#f3ead8;margin:0}
.node-symbol-icon{position:absolute;top:-28px;left:47px;width:32px;height:32px;opacity:.6}
.node-anchor .node-name{font-size:28px;color:#982b28}.node-anchor .node-kind{color:#982b28}
.graph-legend{background:#fbf5e9c9;bottom:8px}.relation-graph{background:#fbf5e9}.graph-count{line-height:1.8}
</style>

<style scoped>.graph-node:not(.node-anchor) .node-kind{display:none}.node-relation{top:140px}.ink-segment{border-radius:2px}</style>

<style scoped>
.graph-node:not(.node-anchor) .node-name{top:65px;font-size:21px;line-height:1.35}
.graph-node:not(.node-anchor) .node-relation{top:128px;font-size:11px;line-height:1.6;background:#fbf5e9e6;border-radius:5px}
.graph-node.node-anchor .node-name{top:67px;background:#fbf5e9eb;border-radius:5px}
.graph-node.node-anchor .node-kind{top:110px;background:#fbf5e9eb}
.ink-segment{opacity:.5}
</style>
