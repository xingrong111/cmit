<template>
 <view class="atlas-panel">
  <view class="atlas-top"><view><text class="eyebrow">山河有迹 / NATIONAL ARCHIVE</text><text class="section-title">以山河为卷，循足迹读人</text></view><button class="text-button" @tap="go('statistics')">收录说明 ↗</button></view>

  <view class="scope-metrics"><view><text class="count-number">{{summary.total}}</text><text>合并收录人物</text></view><view><text class="count-number">{{summary.assigned}}</text><text>已归属省份</text></view><view @tap="go('province',{code:'unknown'})"><text class="count-number">{{summary.unassigned}}</text><text>未分省人物 ↗</text></view></view><text class="small">全国原始{{summary.nationalRaw}}条＋{{summary.dossiers}}份详细档案＋{{summary.ipGroups}}组IP（{{summary.ipPeople}}人），跨名单去重后计数。</text><view class="atlas-layout"><view class="atlas-stage" :class="{'atlas-preparing':!ready,'atlas-fallback-full':full}" @touchstart="touchStart" @touchmove.stop.prevent="touchMove" @touchend="touchEnd" @touchcancel="finish">
   <!-- #ifdef H5 -->
   <view class="atlas-mouse">
   <!-- #endif -->
    <canvas id="national-atlas" canvas-id="national-atlas" class="atlas-canvas" :style="{width:width+'px',height:height+'px'}" aria-label="中国省级行政区互动地图，支持拖动和缩放"/>
   <!-- #ifdef H5 -->
   <view class="atlas-hit-area" role="img" aria-label="地图拖动区域，按住鼠标拖动，滚轮缩放" @tap.stop="tapMap"/>
   </view>
   <!-- #endif -->
   <view v-if="!ready" class="atlas-loading"><text class="serif">山河正在展开</text><text class="small">正在绘制省份与资料标注…</text></view>
   <view class="atlas-current"><text class="atlas-current-caption">当前选中</text><text class="atlas-current-name">{{shortName(selectedProvince.name)}}<text class="atlas-current-number">{{counts[selectedProvince.code]||0}}人</text></text></view><view class="atlas-tools"><button aria-label="放大地图" :disabled="!ready" @tap.stop="zoom(1.35)">＋</button><button aria-label="缩小地图" :disabled="!ready" @tap.stop="zoom(1/1.35)">−</button><button class="atlas-tool-text" aria-label="复位地图" @tap.stop="reset">复位</button><button class="atlas-tool-text" :aria-pressed="full" aria-label="切换全屏" @tap.stop="toggleFull">{{full?'退出':'全屏'}}</button></view>
   <text class="atlas-map-note">现行省级区划展示 · 非历史行政区划</text>
  </view><view class="atlas-selection"><text class="eyebrow">循迹一站</text><text class="atlas-region">{{selectedProvince.name}}</text><view class="atlas-count"><text>{{counts[selectedProvince.code]||0}}</text><text>位收录人物</text></view><button class="primary full" data-open-province @tap="open(selectedProvince.code)">查看人物名单 ↗</button><button class="outline full" :aria-expanded="directoryOpen" @tap="directoryOpen=!directoryOpen">{{directoryOpen?'收起省份目录':'选择其他省份'}} ⌄</button><text class="small atlas-boundary">{{counts[selectedProvince.code]?'每个数字对应下方可追溯的资料条目。':'本批暂未收录，不代表该地区没有英雄人物。'}}</text></view></view>
  <view class="atlas-legend"><text><text class="atlas-dot"/> 已选省份</text><text>点选省份 · 拖动探索 · ＋/− 或滚轮缩放 · {{Math.round(scale*100)}}%</text></view>
  <view class="atlas-switch-heading"><text class="small">沿山河选一站</text><text class="small">左右滑动切换省份 →</text></view>
  <scroll-view scroll-x class="atlas-region-scroll" :scroll-into-view="'atlas-chip-'+selectedCode" :scroll-with-animation="true"><view class="atlas-region-row"><button v-for="p in provinces" :id="'atlas-chip-'+p.code" :key="p.code" :class="['atlas-region-chip',{active:p.code===selectedCode}]" :aria-label="p.name+'，'+(counts[p.code]||0)+'位收录人物'" @tap="choose(p.code)"><text>{{shortName(p.name)}}</text><text class="atlas-chip-count">{{counts[p.code]||0}}</text></button></view></scroll-view>
  <view v-show="directoryOpen" class="atlas-directory"><button v-for="p in provinces" :key="p.code" :class="{selected:p.code===selectedCode}" :aria-label="p.name" @tap="choose(p.code)"><text>{{shortName(p.name)}}</text><text class="atlas-badge">{{counts[p.code]||0}}人</text></button></view>
  <view class="atlas-discover"><button @tap="go('people')"><text>读一位人物</text><text>深入档案 ↗</text></button><button @tap="go('learning')"><text>学一段历史</text><text>学习挑战 ↗</text></button><button @tap="go('radar')"><text>循一处足迹</text><text>探索场馆 ↗</text></button></view>
 </view>
</template>
<script setup>
import {ref,computed,nextTick,getCurrentInstance,onMounted,onBeforeUnmount} from 'vue'
import geometry from '../lib/地图几何.js'
import {provinces,counts,shortName,summary} from '../lib/全国收录.js'
import {go} from '../lib/navigation.js'
const instance=getCurrentInstance(),width=ref(343),height=ref(330),scale=ref(1),full=ref(false)
const ready=ref(false),directoryOpen=ref(false),selectedCode=ref('320000'),selectedProvince=computed(()=>provinces.find(p=>p.code===selectedCode.value)||provinces[0])
let offset={x:0,y:0},rect={left:0,top:0},start=null,moved=false,pinch=0,frame=null,resizeTimer,lastTouch=0,mountTimer,fullRequest=0
const shapes=geometry.features.map(f=>({code:String(f.properties.区划码),polygons:f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates}))
const points=shapes.flatMap(f=>f.polygons.flat(2)),xs=points.map(p=>p[0]),ys=points.map(p=>p[1])
const minX=xs.reduce((a,b)=>Math.min(a,b),Infinity),maxX=xs.reduce((a,b)=>Math.max(a,b),-Infinity),minY=ys.reduce((a,b)=>Math.min(a,b),Infinity),maxY=ys.reduce((a,b)=>Math.max(a,b),-Infinity)
function project(p){const r=Math.min((width.value-32)/(maxX-minX),(height.value-40)/(maxY-minY));return [(p[0]-(minX+maxX)/2)*r*scale.value+width.value/2+offset.x,((minY+maxY)/2-p[1])*r*scale.value+height.value/2+offset.y]}
// 允许原始比例下自由探索，同时让地图至少保留一部分在视野内。
function bounds(s){const r=Math.min((width.value-32)/(maxX-minX),(height.value-40)/(maxY-minY));const hw=(maxX-minX)/2*r*s,hh=(maxY-minY)/2*r*s;return{x:width.value/2+hw-80,y:height.value/2+hh-80}}
function clampOffset(s){const b=bounds(s);offset.x=Math.max(-b.x,Math.min(b.x,offset.x));offset.y=Math.max(-b.y,Math.min(b.y,offset.y))}
function ringArea(r){let a=0;for(let i=0,j=r.length-1;i<r.length;j=i++)a+=r[j][0]*r[i][1]-r[i][0]*r[j][1];return Math.abs(a)}
const anchors=shapes.map(f=>{const ring=f.polygons.map(p=>p[0]).sort((a,b)=>ringArea(b)-ringArea(a))[0];const x=ring.map(p=>p[0]),y=ring.map(p=>p[1]);return {code:f.code,p:[(Math.min(...x)+Math.max(...x))/2,(Math.min(...y)+Math.max(...y))/2]}})
function draw(){frame=null;const c=uni.createCanvasContext('national-atlas',instance.proxy);c.clearRect(0,0,width.value,height.value)
 for(const f of shapes){c.beginPath();for(const polygon of f.polygons)for(const ring of polygon){ring.forEach((p,i)=>{const [x,y]=project(p);i?c.lineTo(x,y):c.moveTo(x,y)});c.closePath()}c.setFillStyle(f.code===selectedCode.value?'#982B28':counts[f.code]?'#D9C39C':'#E9DDC7');c.setStrokeStyle('#FBF5E9');c.setLineWidth(.8);c.fill();c.stroke()}
 const selected=anchors.find(a=>a.code===selectedCode.value)
 if(selected){const [x,y]=project(selected.p);if(x>8&&x<width.value-8&&y>8&&y<height.value-26){c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.setFillStyle('#FBF5E9');c.fill();c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.setFillStyle('#BD9A67');c.fill()}}
 c.draw(false,()=>{ready.value=true})
}
function redraw(){if(frame===null)frame=setTimeout(draw,25)}
function measure(){ready.value=false;uni.createSelectorQuery().in(instance.proxy).select('.atlas-stage').boundingClientRect(r=>{if(!r?.width)return;rect=r;width.value=r.width;height.value=full.value?Math.max(320,Math.round(r.height||(typeof window!=='undefined'?window.innerHeight:460))):Math.max(300,Math.min(460,r.width*.68));clampOffset(scale.value);nextTick(redraw)}).exec()}
function inside(p,ring){let v=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=project(ring[i]),b=project(ring[j]);if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])v=!v}return v}
function pick(x,y){if(!ready.value)return;uni.createSelectorQuery().in(instance.proxy).select('.atlas-stage').boundingClientRect(r=>{if(!r)return;rect=r;const p=[x-rect.left,y-rect.top];const f=shapes.find(f=>f.polygons.some(r=>inside(p,r[0])&&!r.slice(1).some(h=>inside(p,h))));if(f)choose(f.code)}).exec()}
function choose(code){selectedCode.value=code;redraw()}
function tapMap(e){if(moved)return;const x=e.clientX??e.detail?.x,y=e.clientY??e.detail?.y;if(Number.isFinite(x)&&Number.isFinite(y))pick(x,y)}
function open(code){go('province',{code})}
function begin(x,y){start={x,y,ox:offset.x,oy:offset.y};moved=false}
function move(x,y){if(!start)return;const dx=x-start.x,dy=y-start.y;if(Math.abs(dx)+Math.abs(dy)>5)moved=true;if(moved){offset.x=start.ox+dx;offset.y=start.oy+dy;clampOffset(scale.value);redraw()}}
function finish(){start=null;pinch=0}
function zoom(f,cx,cy){const s0=scale.value,s1=Math.max(1,Math.min(4,s0*f));if(Math.abs(s1-s0)<1e-6)return;const px=(cx==null?width.value/2:cx)-width.value/2-offset.x,py=(cy==null?height.value/2:cy)-height.value/2-offset.y;offset.x-=px*(s1/s0-1);offset.y-=py*(s1/s0-1);scale.value=s1;clampOffset(s1);redraw()}
function reset(){finish();scale.value=1;offset={x:0,y:0};redraw()}
function distance(t){return Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY)}
function touchStart(e){lastTouch=Date.now();if(e.target?.closest?.('.atlas-tools'))return;if(e.touches.length===2){pinch=distance(e.touches);moved=true;start=null}else if(e.touches[0])begin(e.touches[0].clientX,e.touches[0].clientY)}
function touchMove(e){if(e.touches.length===2){const d=distance(e.touches);if(pinch)zoom(d/pinch);pinch=d;moved=true}else if(e.touches[0])move(e.touches[0].clientX,e.touches[0].clientY)}
function touchEnd(e){const t=e.changedTouches?.[0];if(start&&t&&!moved)pick(t.clientX,t.clientY);finish()}
function mouseStart(e){if(e.target?.closest?.('.atlas-mouse')&&e.button===0&&Date.now()-lastTouch>600&&ready.value){e.preventDefault();begin(e.clientX,e.clientY)}}
function mouseMove(e){if(!start||Date.now()-lastTouch<600)return;e.preventDefault();move(e.clientX,e.clientY)}
function mouseEnd(e){if(Date.now()-lastTouch<600)return;if(start&&!moved)pick(e.clientX,e.clientY);finish()}
function onWheel(e){
 // #ifdef H5
 const stage=e.target?.closest?.('.atlas-stage');if(!stage||!stage.querySelector('#national-atlas'))return;e.preventDefault();const r=stage.getBoundingClientRect();zoom(e.deltaY<0?1.12:1/1.12,e.clientX-r.left,e.clientY-r.top);
 // #endif
}
function setFull(on){finish();full.value=on;nextTick(measure)}
function toggleFull(){
 // #ifdef H5
 const el=document.querySelector('#national-atlas')?.closest('.atlas-stage');if(!el)return;
 setFull(!full.value)
 if(!full.value&&document.fullscreenElement===el)document.exitFullscreen().catch(()=>{})
 // #endif
}
function onFullChange(){
 // #ifdef H5
 const el=document.querySelector('#national-atlas')?.closest('.atlas-stage');if(document.fullscreenElement===el){nextTick(measure)}else if(!full.value){nextTick(measure)}else{setFull(false)}
 // #endif
}
function onKeydown(e){
 // #ifdef H5
 if(e.key==='Escape'&&full.value)toggleFull()
 // #endif
}
function resize(){clearTimeout(resizeTimer);resizeTimer=setTimeout(measure,120)}
onMounted(()=>{mountTimer=setTimeout(measure,100);uni.onWindowResize(resize)
// #ifdef H5
document.addEventListener('mousedown',mouseStart,true);document.addEventListener('mousemove',mouseMove);document.addEventListener('mouseup',mouseEnd);window.addEventListener('blur',finish);document.addEventListener('wheel',onWheel,{passive:false,capture:true});document.addEventListener('fullscreenchange',onFullChange);document.addEventListener('keydown',onKeydown);
// #endif
})
onBeforeUnmount(()=>{++fullRequest;clearTimeout(mountTimer);clearTimeout(frame);clearTimeout(resizeTimer);uni.offWindowResize(resize)
// #ifdef H5
document.removeEventListener('mousedown',mouseStart,true);document.removeEventListener('mousemove',mouseMove);document.removeEventListener('mouseup',mouseEnd);window.removeEventListener('blur',finish);document.removeEventListener('wheel',onWheel,true);document.removeEventListener('fullscreenchange',onFullChange);document.removeEventListener('keydown',onKeydown);
// #endif
})
</script>

<style scoped>
.atlas-current{position:absolute;left:16px;top:16px;z-index:2;pointer-events:none;background:#fffaf1ee;border:1px solid #d9c29f;border-radius:12px;padding:10px 14px;box-shadow:0 5px 18px #54371c0a;min-width:76px}.atlas-current-caption{display:block;font-size:10px;letter-spacing:2px;color:#8c7457;margin-bottom:4px}.atlas-current-name{display:flex;align-items:baseline;gap:12px;color:#982b28;font-family:STSong,SimSun,serif;font-size:19px}.atlas-current-number{font-family:Georgia,serif;font-size:16px;color:#725b40}.atlas-switch-heading{display:flex;justify-content:space-between;gap:10px;margin:16px 0 10px}.atlas-region-scroll{width:100%;white-space:nowrap;margin-bottom:18px}.atlas-region-row{display:inline-flex;gap:8px;padding:2px 2px 8px}.atlas-region-chip{display:inline-flex!important;align-items:center;justify-content:center;gap:10px;margin:0!important;padding:10px 14px!important;min-height:44px;font-size:13px!important;line-height:1.5!important;border:1px solid #e2d0b3!important;border-radius:11px!important;background:#fffaf1!important;color:#6e5943!important;flex-shrink:0}.atlas-region-chip.active{background:#982b28!important;border-color:#982b28!important;color:#fffaf1!important}.atlas-chip-count{font-family:Georgia,serif;font-size:16px;color:#982b28}.active .atlas-chip-count{color:#fffaf1}.atlas-region-chip:after{border:0}.atlas-region-chip:active{opacity:.8}
@media(max-width:650px){.atlas-current{left:12px;top:12px;padding:8px 12px}.atlas-current-name{font-size:17px}.atlas-switch-heading .small{font-size:11px}.atlas-region-chip{padding:9px 12px!important}}
.atlas-mouse{position:relative;cursor:grab;user-select:none;touch-action:none}
.atlas-mouse:active{cursor:grabbing}
.atlas-hit-area{position:absolute;inset:0;z-index:1}
.atlas-tools{z-index:4}
.atlas-loading{pointer-events:none}
.atlas-tools .atlas-tool-text{font-size:11px!important}
.atlas-stage:fullscreen{border:0;border-radius:0;min-height:0;height:100%;background:radial-gradient(ellipse at 70% 30%,#fffaf1,#f2e7d2)}
.atlas-stage.atlas-fallback-full{position:fixed;inset:0;z-index:9999;border:0;border-radius:0;min-height:0;width:100vw;height:100vh;height:100dvh;background:radial-gradient(ellipse at 70% 30%,#fffaf1,#f2e7d2)}
</style>
