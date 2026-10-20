<template>
 <view class="atlas-panel">
  <view class="atlas-top"><view><text class="eyebrow">山河有迹 / NATIONAL ARCHIVE</text><text class="section-title">以山河为卷，循足迹读人</text></view><button class="text-button" @tap="go('statistics')">收录说明 ↗</button></view>
  <text class="muted atlas-caption">三类名单合并去重，数字对应本项目收录人物，不代表全国历史总人数。</text>
  <view class="scope-metrics"><view><text class="count-number">{{summary.total}}</text><text>合并收录人物</text></view><view><text class="count-number">{{summary.assigned}}</text><text>已归属省份</text></view><view @tap="go('province',{code:'unknown'})"><text class="count-number">{{summary.unassigned}}</text><text>未分省人物 ↗</text></view></view><text class="small">全国原始{{summary.nationalRaw}}条＋{{summary.dossiers}}份详细档案＋{{summary.ipGroups}}组IP（{{summary.ipPeople}}人），跨名单去重后计数。</text><view class="atlas-layout"><view class="atlas-stage" :class="{'atlas-preparing':!ready}" @touchstart="touchStart" @touchmove.stop.prevent="touchMove" @touchend="touchEnd" @touchcancel="finish">
   <!-- #ifdef H5 -->
   <view class="atlas-mouse" @mousedown="mouseStart" @mousemove="mouseMove" @mouseup="mouseEnd" @mouseleave="finish">
   <!-- #endif -->
    <canvas id="national-atlas" canvas-id="national-atlas" class="atlas-canvas" :style="{width:width+'px',height:height+'px'}" aria-label="中国省级行政区互动地图，支持拖动和缩放"/>
   <!-- #ifdef H5 -->
   <view class="atlas-hit-area" style="position:absolute;inset:0;z-index:1" aria-hidden="true" @tap.stop="tapMap"/>
   </view>
   <!-- #endif -->
   <view v-if="!ready" class="atlas-loading"><text class="serif">山河正在展开</text><text class="small">正在绘制省份与资料标注…</text></view>
   <view class="atlas-current"><text class="atlas-current-caption">当前选中</text><text class="atlas-current-name">{{shortName(selectedProvince.name)}}<text class="atlas-current-number">{{counts[selectedProvince.code]||0}}人</text></text></view><view class="atlas-tools"><button aria-label="放大地图" :disabled="!ready" @tap.stop="zoom(1.35)">＋</button><button aria-label="缩小地图" :disabled="!ready" @tap.stop="zoom(1/1.35)">−</button><button aria-label="重置地图" @tap.stop="reset">复位</button></view>
   <text class="atlas-map-note">现行省级区划展示 · 非历史行政区划</text>
  </view><view class="atlas-selection"><text class="eyebrow">循迹一站</text><text class="atlas-region">{{selectedProvince.name}}</text><view class="atlas-count"><text>{{counts[selectedProvince.code]||0}}</text><text>位收录人物</text></view><text class="small">按来源所记籍贯归类，未分省人物单列</text><button class="primary full" data-open-province @tap="open(selectedProvince.code)">查看人物名单 ↗</button><button class="outline full" :aria-expanded="directoryOpen" @tap="directoryOpen=!directoryOpen">{{directoryOpen?'收起省份目录':'选择其他省份'}} ⌄</button><text class="small atlas-boundary">{{counts[selectedProvince.code]?'每个数字对应下方可追溯的资料条目。':'本批暂未收录，不代表该地区没有英雄人物。'}}</text></view></view>
  <view class="atlas-legend"><text><text class="atlas-dot"/> 已选省份</text><text>点选省份 · 拖动探索 · ＋/− 缩放 · {{Math.round(scale*100)}}%</text></view>
  <view class="atlas-switch-heading"><text class="small">沿山河选一站</text><text class="small">左右滑动切换省份 →</text></view>
  <scroll-view scroll-x class="atlas-region-scroll" :scroll-into-view="'atlas-chip-'+selectedCode" :scroll-with-animation="true"><view class="atlas-region-row"><button v-for="p in provinces" :id="'atlas-chip-'+p.code" :key="p.code" :class="['atlas-region-chip',{active:p.code===selectedCode}]" :aria-label="p.name+'，'+(counts[p.code]||0)+'位收录人物'" @tap="choose(p.code)"><text>{{shortName(p.name)}}</text><text class="atlas-chip-count">{{counts[p.code]||0}}</text></button></view></scroll-view>
  <view v-show="directoryOpen" class="atlas-directory"><button v-for="p in provinces" :key="p.code" :class="{selected:p.code===selectedCode}" @tap="choose(p.code)"><text>{{shortName(p.name)}}</text><text class="atlas-badge">{{counts[p.code]||0}}人</text></button></view>
  <view class="atlas-discover"><button @tap="go('people')"><text>读一位人物</text><text>深入档案 ↗</text></button><button @tap="go('learning')"><text>学一段历史</text><text>学习挑战 ↗</text></button><button @tap="go('radar')"><text>循一处足迹</text><text>探索场馆 ↗</text></button></view>
 </view>
</template>
<script setup>
import {ref,computed,nextTick,getCurrentInstance,onMounted,onBeforeUnmount} from 'vue'
import geometry from '../lib/地图几何.js'
import {provinces,counts,shortName,summary} from '../lib/全国收录.js'
import {go} from '../lib/navigation.js'
const instance=getCurrentInstance(),width=ref(343),height=ref(330),scale=ref(1)
const ready=ref(false),directoryOpen=ref(false),selectedCode=ref('320000'),selectedProvince=computed(()=>provinces.find(p=>p.code===selectedCode.value)||provinces[0])
let offset={x:0,y:0},rect={left:0,top:0},start=null,moved=false,pinch=0,frame=null,resizeTimer,lastTouch=0
const shapes=geometry.features.map(f=>({code:String(f.properties.区划码),polygons:f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates}))
const points=shapes.flatMap(f=>f.polygons.flat(2)),xs=points.map(p=>p[0]),ys=points.map(p=>p[1])
const minX=xs.reduce((a,b)=>Math.min(a,b),Infinity),maxX=xs.reduce((a,b)=>Math.max(a,b),-Infinity),minY=ys.reduce((a,b)=>Math.min(a,b),Infinity),maxY=ys.reduce((a,b)=>Math.max(a,b),-Infinity)
function project(p){const r=Math.min((width.value-32)/(maxX-minX),(height.value-40)/(maxY-minY));return [(p[0]-(minX+maxX)/2)*r*scale.value+width.value/2+offset.x,((minY+maxY)/2-p[1])*r*scale.value+height.value/2+offset.y]}
function ringArea(r){let a=0;for(let i=0,j=r.length-1;i<r.length;j=i++)a+=r[j][0]*r[i][1]-r[i][0]*r[j][1];return Math.abs(a)}
const anchors=shapes.map(f=>{const ring=f.polygons.map(p=>p[0]).sort((a,b)=>ringArea(b)-ringArea(a))[0];const x=ring.map(p=>p[0]),y=ring.map(p=>p[1]);return {code:f.code,p:[(Math.min(...x)+Math.max(...x))/2,(Math.min(...y)+Math.max(...y))/2]}})
function draw(){frame=null;const c=uni.createCanvasContext('national-atlas',instance.proxy);c.clearRect(0,0,width.value,height.value)
 for(const f of shapes){c.beginPath();for(const polygon of f.polygons)for(const ring of polygon){ring.forEach((p,i)=>{const [x,y]=project(p);i?c.lineTo(x,y):c.moveTo(x,y)});c.closePath()}c.setFillStyle(f.code===selectedCode.value?'#982B28':counts[f.code]?'#D9C39C':'#E9DDC7');c.setStrokeStyle('#FBF5E9');c.setLineWidth(.8);c.fill();c.stroke()}
 const selected=anchors.find(a=>a.code===selectedCode.value)
 if(selected){const [x,y]=project(selected.p);if(x>8&&x<width.value-8&&y>8&&y<height.value-26){c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.setFillStyle('#FBF5E9');c.fill();c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.setFillStyle('#BD9A67');c.fill()}}
 c.draw(false,()=>{ready.value=true})
}
function redraw(){if(frame===null)frame=setTimeout(draw,25)}
function measure(){ready.value=false;uni.createSelectorQuery().in(instance.proxy).select('.atlas-stage').boundingClientRect(r=>{if(!r?.width)return;rect=r;width.value=r.width;height.value=Math.max(300,Math.min(460,r.width*.68));nextTick(()=>{redraw()})}).exec()}
function inside(p,ring){let v=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=project(ring[i]),b=project(ring[j]);if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])v=!v}return v}
function pick(x,y){if(!ready.value)return;uni.createSelectorQuery().in(instance.proxy).select('.atlas-stage').boundingClientRect(r=>{if(!r)return;rect=r;const p=[x-rect.left,y-rect.top];const f=shapes.find(f=>f.polygons.some(r=>inside(p,r[0])&&!r.slice(1).some(h=>inside(p,h))));if(f)choose(f.code)}).exec()}
function choose(code){selectedCode.value=code;redraw()}
function tapMap(e){if(moved)return;const x=e.clientX??e.detail?.x,y=e.clientY??e.detail?.y;if(Number.isFinite(x)&&Number.isFinite(y))pick(x,y)}
function open(code){go('province',{code})}
function begin(x,y){start={x,y,ox:offset.x,oy:offset.y};moved=false}
function move(x,y){if(!start)return;const dx=x-start.x,dy=y-start.y;if(Math.abs(dx)+Math.abs(dy)>5)moved=true;if(moved){offset={x:Math.max(-width.value*scale.value,Math.min(width.value*scale.value,start.ox+dx)),y:Math.max(-height.value*scale.value,Math.min(height.value*scale.value,start.oy+dy))};redraw()}}
function finish(){start=null;pinch=0}
function zoom(f){scale.value=Math.max(1,Math.min(4,scale.value*f));if(scale.value===1)offset={x:0,y:0};redraw()}
function reset(){scale.value=1;offset={x:0,y:0};redraw()}
function distance(t){return Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY)}
function touchStart(e){lastTouch=Date.now();if(e.touches.length===2){pinch=distance(e.touches);moved=true;start=null}else if(e.touches[0])begin(e.touches[0].clientX,e.touches[0].clientY)}
function touchMove(e){if(e.touches.length===2){const d=distance(e.touches);if(pinch)zoom(d/pinch);pinch=d;moved=true}else if(e.touches[0])move(e.touches[0].clientX,e.touches[0].clientY)}
function touchEnd(e){const t=e.changedTouches?.[0];if(t&&!moved)pick(t.clientX,t.clientY);finish()}
function mouseStart(e){if(e.button===0&&Date.now()-lastTouch>600)begin(e.clientX,e.clientY)}
function mouseMove(e){move(e.clientX,e.clientY)}
function mouseEnd(e){if(start&&!moved)pick(e.clientX,e.clientY);finish()}
function resize(){clearTimeout(resizeTimer);resizeTimer=setTimeout(measure,120)}
onMounted(()=>{setTimeout(measure,100);uni.onWindowResize(resize)})
onBeforeUnmount(()=>{clearTimeout(frame);clearTimeout(resizeTimer);uni.offWindowResize(resize)})
</script>

<style scoped>
.atlas-current{position:absolute;left:16px;top:16px;z-index:2;pointer-events:none;background:#fffaf1ee;border:1px solid #d9c29f;border-radius:12px;padding:10px 14px;box-shadow:0 5px 18px #54371c0a;min-width:76px}.atlas-current-caption{display:block;font-size:10px;letter-spacing:2px;color:#8c7457;margin-bottom:4px}.atlas-current-name{display:flex;align-items:baseline;gap:12px;color:#982b28;font-family:STSong,SimSun,serif;font-size:19px}.atlas-current-number{font-family:Georgia,serif;font-size:16px;color:#725b40}.atlas-switch-heading{display:flex;justify-content:space-between;gap:10px;margin:16px 0 10px}.atlas-region-scroll{width:100%;white-space:nowrap;margin-bottom:18px}.atlas-region-row{display:inline-flex;gap:8px;padding:2px 2px 8px}.atlas-region-chip{display:inline-flex!important;align-items:center;justify-content:center;gap:10px;margin:0!important;padding:10px 14px!important;min-height:44px;font-size:13px!important;line-height:1.5!important;border:1px solid #e2d0b3!important;border-radius:11px!important;background:#fffaf1!important;color:#6e5943!important;flex-shrink:0}.atlas-region-chip.active{background:#982b28!important;border-color:#982b28!important;color:#fffaf1!important}.atlas-chip-count{font-family:Georgia,serif;font-size:16px;color:#982b28}.active .atlas-chip-count{color:#fffaf1}.atlas-region-chip:after{border:0}.atlas-region-chip:active{opacity:.8}
@media(max-width:650px){.atlas-current{left:12px;top:12px;padding:8px 12px}.atlas-current-name{font-size:17px}.atlas-switch-heading .small{font-size:11px}.atlas-region-chip{padding:9px 12px!important}}
</style>
