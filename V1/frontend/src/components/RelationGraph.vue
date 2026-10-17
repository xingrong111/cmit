<template>
  <view class="relation-graph">
    <view class="graph-heading">
      <view><text class="graph-eyebrow">RELATION ATLAS</text><text class="graph-title">人物与时代的交汇</text></view>
      <text class="graph-count">{{ filteredNodes.length }} 个关联节点 · {{ edges.length }} 条已收录联系</text>
    </view>
    <view class="graph-filters">
      <button v-for="item in filters" :key="item.value" class="filter-button" :class="{ selected: filter === item.value }" @tap="filter = item.value">{{ item.label }}</button>
    </view>
    <view class="graph-viewport" :id="viewportId" @touchstart="startPan" @touchmove.stop.prevent="movePan" @touchend="endPan" @touchcancel="endPan" @mousedown="startMousePan" @mousemove="moveMousePan" @mouseup="endPan" @mouseleave="endPan">
      <view class="graph-grid"/><view class="graph-watermark">山河有迹</view><view v-if="!measured" class="graph-loading">正在展开人物关系…</view>
      <view class="graph-stage" :class="{'graph-ready':measured}" :style="stageStyle">
        <view v-for="edge in renderedEdges" :key="edge.id" class="graph-edge" :class="{'edge-selected':focusedEdge?.id===edge.id}" :style="edge.style" @tap.stop="selectEdge(edge)">
          <view class="edge-stroke" /><text class="edge-label" :style="edge.labelStyle">{{ relationLabel(edge.type).slice(0,10) }}</text>
        </view>
        <view v-for="node in positionedNodes" :key="node.id" class="graph-node" :class="['kind-' + node.kind,{'node-anchor':node.id===nodes[0]?.id,'node-linked':focusedEdge&&(node.id===focusedEdge.from_id||node.id===focusedEdge.to_id)}]" :style="node.style" @tap.stop="selectNode(node)">
          <image v-if="nodeArt(node)" class="node-portrait" :src="nodeArt(node)" mode="aspectFit"/><image v-else class="node-symbol-icon" :src="'/static/icons/'+(node.kind==='person'?'people':node.kind==='event'?'calendar':'source')+'.png'" aria-hidden="true"/><text class="node-kind">{{ node.id===nodes[0]?.id?'中心人物':kindLabel(node.kind) }}</text><text class="node-name">{{ node.name }}</text>
        </view>
      </view>
      <view v-if="!visibleNodes.length" class="graph-empty">暂无这一类关系记录</view>
      <view class="graph-legend"><text class="legend-person">● 人物</text><text class="legend-event">● 事件</text><text class="legend-group">● 组织</text></view>
    </view>
    <view v-if="pageCount>1" class="graph-pages"><button :disabled="page===0" @tap="page--">上一组</button><text>{{page+1}} / {{pageCount}} · 分组展示防止重叠</text><button :disabled="page===pageCount-1" @tap="page++">下一组</button></view>
    <view v-if="focusedEdge" class="graph-evidence"><view><text class="graph-evidence-title">{{nodeById[focusedEdge.from_id]?.name}} · {{nodeById[focusedEdge.to_id]?.name}}</text><text class="graph-evidence-description">{{relationLabel(focusedEdge.type)}}</text><text v-if="focusedEdge.boundary" class="graph-evidence-description">{{focusedEdge.boundary}}</text></view><button v-if="focusedEdge.source_id" class="source-button" @tap="selectSource(focusedEdge.source_id)">查看关系出处 ↗</button><button class="zoom-button" aria-label="关闭关系说明" @tap="focusedEdge=null">×</button></view>
    <view class="graph-controls">
      <text class="graph-hint">拖动探索 · 点节点查看 · 点连线读来源</text>
      <view class="zoom-controls"><button class="zoom-button" aria-label="缩小关系图" @tap="zoomBy(0.8)">−</button><text class="zoom-value">{{ Math.round(scale * 100) }}%</text><button class="zoom-button" aria-label="放大关系图" @tap="zoomBy(1.25)">+</button><button class="reset-button" @tap="resetView">复位</button></view>
    </view>
    <view class="relation-list">
      <view class="list-heading"><text>全部联系索引</text><text class="list-caption">当前分类下的完整记录 · 不受图谱分页影响</text></view>
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
function nodeArt(node){return Object.values(artworks).find(a=>a.personId&&a.personId===node.person_id)?.src||''}

// Cross-platform view-based graph: no DOM, SVG, canvas or browser-only APIs.
// props.graph: { nodes: [{ id, name, kind, person_id?, event_id? }],
//                edges: [{ id, from_id, to_id, type, source_id? }] }
// Emits the original node object via `node`, and a source ID via `source`.
const props = defineProps({ graph: { type: Object, default: () => ({ nodes: [], edges: [] }) } })
const emit = defineEmits(['node', 'source'])
const instance = getCurrentInstance()
const viewportId = `relation-viewport-${instance?.uid || 0}`
const filter = ref('all')
const page=ref(0)
const focusedEdge=ref(null)
const filters = [{ value: 'all', label: '全部' }, { value: 'person', label: '人物' }, { value: 'event', label: '事件' }, { value: 'group', label: '组织' }, {value:'entity',label:'其他关联'}]
const measured=ref(false)
const scale = ref(0.5)
const panX = ref(0)
const panY = ref(0)
const viewportWidth = ref(320)
const viewportHeight = 520
let panOrigin = null
let suppressTapUntil = 0
const nodes = computed(() => props.graph?.nodes || [])
const nodeById = computed(() => Object.fromEntries(nodes.value.map(node => [node.id, node])))
const edges = computed(() => (props.graph?.edges || []).filter(edge => nodeById.value[edge.from_id] && nodeById.value[edge.to_id]))
// Keep the subject as the anchor when filtering its related events or organizations.
const filteredNodes = computed(() => nodes.value.filter((node,index) => filter.value === 'all' || index === 0 || normalizeKind(node.kind) === filter.value))
const pageCount=computed(()=>Math.max(1,Math.ceil((filteredNodes.value.length-1)/6)))
const visibleNodes=computed(()=>filteredNodes.value.length?[filteredNodes.value[0],...filteredNodes.value.slice(1+page.value*6,1+(page.value+1)*6)]:[])
const visibleIds = computed(() => new Set(visibleNodes.value.map(node => node.id)))
const filteredEdges=computed(()=>{const ids=new Set(filteredNodes.value.map(n=>n.id));return edges.value.filter(e=>ids.has(e.from_id)&&ids.has(e.to_id))})
const visibleEdges = computed(() => edges.value.filter(edge => visibleIds.value.has(edge.from_id) && visibleIds.value.has(edge.to_id)))
const layout = computed(() => {
  const count = visibleNodes.value.length
  const rings = Math.max(1, Math.ceil((count - 1) / 12))
  const radius = 230 + (rings - 1) * 150
  const width = Math.max(640, radius * 2 + 180)
  const height = Math.max(620, radius * 2 + 160)
  const positions = {}
  visibleNodes.value.forEach((node, index) => {
    if (index === 0) positions[node.id] = { x: width / 2, y: height / 2 }
    else {
      const ring = Math.floor((index - 1) / 12)
      const ringCount = Math.min(12, count - 1 - ring * 12)
      const angle = -Math.PI / 2 + ((index - 1) % 12) * Math.PI * 2 / ringCount
      const r = 230 + ring * 150
      positions[node.id] = { x: width / 2 + Math.cos(angle) * r, y: height / 2 + Math.sin(angle) * r }
    }
  })
  return { width, height, positions }
})
const stageStyle = computed(() => ({ width: `${layout.value.width}px`, height: `${layout.value.height}px`, transform: `translate(${panX.value}px, ${panY.value}px) scale(${scale.value})` }))
const positionedNodes = computed(() => visibleNodes.value.map(node => ({ ...node, style: { left: `${layout.value.positions[node.id].x - 80}px`, top: `${layout.value.positions[node.id].y - 58}px` } })))
const renderedEdges = computed(() => visibleEdges.value.map(edge => {
  const a = layout.value.positions[edge.from_id]
  const b = layout.value.positions[edge.to_id]
  const angle=Math.atan2(b.y-a.y,b.x-a.x)
  return { ...edge,labelStyle:{transform:`rotate(${-angle}rad)`}, style: { left: `${a.x}px`, top: `${a.y - 22}px`, width: `${Math.hypot(b.x - a.x, b.y - a.y)}px`, transform: `rotate(${angle}rad)` } }
}))
function normalizeKind(kind) { return ['group', 'organization', 'organisation'].includes(kind) ? 'group' : kind }
function kindLabel(kind) { return ({ person: '人物', event: '事件', group: '组织', entity:'关联对象' })[normalizeKind(kind)] || '记录' }
function relationLabel(type) {
  return ({ related_event: '相关事迹', person_event: '相关事迹', participated: '参与', participation: '参与', colleague: '同事', comrade: '战友', spouse: '夫妻', marriage: '夫妻', teacher: '师生', family: '亲属', member: '成员', membership: '成员', friend: '友人', related: '相关联系' })[type] || type || '相关联系'
}
function selectNode(node) { if (node && Date.now() >= suppressTapUntil) emit('node', nodeById.value[node.id] || node) }
function selectSource(id) { if (id && Date.now() >= suppressTapUntil) emit('source', id) }
function selectEdge(edge){if(Date.now()>=suppressTapUntil)focusedEdge.value=edge}
watch(filter,()=>{page.value=0;focusedEdge.value=null;nextTick(resetView)})
watch(page,()=>{focusedEdge.value=null;nextTick(resetView)})
function point(event) { const touch = event.touches?.[0]; return touch ? { x: touch.clientX ?? touch.pageX, y: touch.clientY ?? touch.pageY } : null }
function startPan(event) { const p = point(event); if (p) panOrigin = { ...p, x0: panX.value, y0: panY.value, moved: false } }
function movePan(event) { updatePan(point(event)) }
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
function zoomBy(multiplier) {
  const oldScale = scale.value
  const nextScale = Math.max(0.2, Math.min(2, oldScale * multiplier))
  const ratio = nextScale / oldScale
  panX.value = viewportWidth.value / 2 - (viewportWidth.value / 2 - panX.value) * ratio
  panY.value = viewportHeight / 2 - (viewportHeight / 2 - panY.value) * ratio
  scale.value = nextScale
}
function resetView() {
  scale.value = Math.max(0.2, Math.min(0.9, (viewportWidth.value - 24) / layout.value.width, (viewportHeight - 34) / layout.value.height))
  panX.value = (viewportWidth.value - layout.value.width * scale.value) / 2
  panY.value = (viewportHeight - layout.value.height * scale.value) / 2
}
function measure() {
  measured.value=false
  nextTick(() => uni.createSelectorQuery().in(instance.proxy).select(`#${viewportId}`).boundingClientRect(rect => {
    if (rect?.width) viewportWidth.value = rect.width
    resetView();measured.value=true
  }).exec())
}
onMounted(()=>{measure();uni.onWindowResize(measure)})
onBeforeUnmount(()=>uni.offWindowResize(measure))
watch(() => props.graph, measure, { deep: true })
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
