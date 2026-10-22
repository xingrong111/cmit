<template>
 <view v-if="visible" class="xiaoji-root" :data-xj="uid" :class="{expanded,docked:docked&&!expanded,left:side==='left'}" :style="rootStyle">
  <view v-if="!expanded" class="xiaoji-ball-wrap">
   <text v-if="copy&&!docked" class="xiaoji-copy">{{copy}}</text>
   <view class="xiaoji-ball" role="button" tabindex="0" :aria-label="docked?'展开小迹':'打开小迹对话'" @keydown.enter="expand" @touchstart="onPointerDown" @touchmove.prevent="onPointerMove" @touchend="onPointerUp" @mousedown="onPointerDown">
    <image class="xiaoji-face" :src="faceSrc" mode="aspectFit" aria-hidden="true"/>
   </view>
  </view>
  <view v-else class="xiaoji-window" :style="windowStyle" role="dialog" aria-label="小迹对话">
   <view class="xiaoji-bar" @touchstart="onWindowDown" @touchmove="onWindowMove" @touchend="onWindowUp" @mousedown="onWindowDown">
    <image class="xiaoji-mini" :src="faceSrc" mode="aspectFit" aria-hidden="true"/>
    <view class="xiaoji-bar-copy"><text class="xiaoji-name">小迹</text><text class="xiaoji-sub">AI 山河导览员</text></view>
    <button class="xiaoji-full" aria-label="打开完整导览" @tap.stop="openFull">完整对话</button>
    <button class="xiaoji-min" aria-label="收起聊天框" @tap.stop="collapse">收起</button>
   </view>
   <scroll-view class="xiaoji-thread" scroll-y :show-scrollbar="false" :scroll-top="threadTop" @scroll="onThreadScroll">
    <view v-if="!messages.length" class="xiaoji-empty">
     <text>你好，我是小迹。今天想探索什么？</text>
     <view class="xiaoji-starts">
      <button v-for="item in starts" :key="item.q" :disabled="busy" @tap="quick(item.q)">{{item.label}}</button>
     </view>
    </view>
    <view v-for="(m,i) in messages" :key="i" class="xiaoji-turn" :class="m.role">
     <text class="xiaoji-bubble" selectable>{{m.text}}</text>
     <text v-if="m.notice" class="xiaoji-notice">{{m.notice}}</text>
     <view v-if="m.sources&&m.sources.length" class="xiaoji-cites">
      <text>资料依据 · {{m.sources.length}}</text>
      <text v-for="(s,si) in m.sources.slice(0,3)" :key="si">{{s.title||s}}</text>
     </view>
    </view>
    <view v-if="busy" class="xiaoji-wait"><text>{{waitText}}</text></view>
    <view v-if="error&&!busy" class="xiaoji-error"><text>{{error}}</text></view>
    <view id="xiaoji-end"></view>
   </scroll-view>
   <view class="xiaoji-composer">
    <textarea class="xiaoji-input" :value="question" :disabled="busy" maxlength="500" auto-height confirm-type="send" placeholder="问小迹…" @input="question=$event.detail.value" @confirm="send"/>
    <button v-if="busy" class="xiaoji-send" aria-label="停止回答" title="停止回答" @tap="stop"><image class="xiaoji-send-icon" :src="stopIcon" mode="aspectFit" aria-hidden="true"/></button>
    <button v-else class="xiaoji-send" aria-label="发送提问" title="发送提问" :disabled="!question.trim()" @tap="send"><image class="xiaoji-send-icon" :src="sendIcon" mode="aspectFit" aria-hidden="true"/></button>
   </view>
   <text class="xiaoji-disclaimer">AI 回答仅供参考，请以官方史料为准</text>
   <view class="xiaoji-resize" @touchstart.stop="onResizeDown" @touchmove.stop.prevent="onResizeMove" @touchend.stop="onResizeUp" @mousedown.stop="onResizeDown"></view>
  </view>
 </view>
</template>
<script setup>
import {computed,onBeforeUnmount,onMounted,ref} from 'vue';
import {onShow} from '@dcloudio/uni-app';
import {go} from '../lib/navigation.js';
import faceSrc from '../static/xiaoji.png';
import sendIcon from '../static/icons/send.svg';
import stopIcon from '../static/icons/stop.svg';
import {dismissTip} from '../lib/新手任务.js';
import {store,expanded,docked,side,x,y,winX,winY,winW,winH,question,messages,busy,error,waitText,followLatest,threadTop,scrollEnd,stop,quick,send} from '../lib/companion-store.js';
const props=defineProps({
 copy:{type:String,default:''},
 corner:{type:String,default:'right'},
 assist:{type:Boolean,default:true},
 hideOn:{type:Array,default:()=>['assistant']}
});
const visible=ref(true);
const uid=`xj${Math.random().toString(36).slice(2,9)}`;
// 位置、展开状态与对话在 lib/companion-store.js 中全局共享，各页面的小迹保持一致
const starts=[{label:'这个平台可以做什么？',q:'这个平台可以做什么？'},{label:'如何开始我的第一次探索？',q:'如何开始我的第一次探索？'},{label:'怎么使用小迹规划文化路线？',q:'怎么使用小迹规划文化路线？'}];
let dragging=false,moved=false,sx=0,sy=0,ox=0,oy=0,lastTouch=0;
const margin=8,stickerW=60,stickerH=60;
function viewport(){
 let w=390,h=700;
 // #ifdef H5
 w=window.innerWidth;h=window.innerHeight;
 const tab=document.querySelector('uni-tabbar');
 const tabH=tab&&getComputedStyle(tab).display!=='none'?tab.getBoundingClientRect().height:0;
 h-=tabH;
 // #endif
 // #ifndef H5
 try{const sys=uni.getSystemInfoSync();w=sys.windowWidth;h=sys.windowHeight-(sys.safeAreaInsets?.bottom||0)}catch{}
 // #endif
 return {w,h};
}
function defaultPos(){
 const {w,h}=viewport();
 y.value=Math.max(margin,h-stickerH-90);
 x.value=props.corner==='left'?margin:Math.max(margin,w-stickerW-16);
 side.value=props.corner==='left'?'left':'right';
}
function defaultWindow(){
 const {w,h}=viewport();
 winW.value=Math.min(360,Math.max(280,w-24));
 winH.value=Math.min(460,Math.max(320,h-32));
 winX.value=Math.max(8,w-winW.value-18);
 winY.value=Math.max(56,h-winH.value-18);
}
function clamp(){
 const {w,h}=viewport();
 x.value=Math.min(Math.max(margin,x.value),Math.max(margin,w-stickerW-margin));
 y.value=Math.min(Math.max(margin,y.value),Math.max(margin,h-stickerH-margin));
 winW.value=Math.min(Math.max(280,winW.value),Math.max(280,w-16));
 winH.value=Math.min(Math.max(320,winH.value),Math.max(320,h-16));
 winX.value=Math.min(Math.max(8,winX.value),Math.max(8,w-winW.value-8));
 winY.value=Math.min(Math.max(56,winY.value),Math.max(56,h-winH.value-8));
}
const rootStyle=computed(()=>{
 if(expanded.value)return {left:winX.value+'px',top:winY.value+'px',width:winW.value+'px',height:winH.value+'px'};
 return {left:x.value+'px',top:y.value+'px'};
});
const windowStyle=computed(()=>({width:winW.value+'px',height:winH.value+'px'}));
function edgeSide(){
 const {w}=viewport();
 if(expanded.value){
  if(winX.value<=8)return 'left';
  if(winX.value>=Math.max(8,w-winW.value-8))return 'right';
  return '';
 }
 if(x.value<=margin)return 'left';
 if(x.value>=Math.max(margin,w-stickerW-margin))return 'right';
 return '';
}
function point(e){
 const t=e.touches?.[0]||e.changedTouches?.[0]||e;
 return {x:t.clientX??t.pageX,y:t.clientY??t.pageY};
}
function onPointerDown(e){
 if(e.type==='touchstart')lastTouch=Date.now();
 if(e.type==='mousedown'&&(e.button!==0||Date.now()-lastTouch<700))return;
 if(e.cancelable)e.preventDefault();
 dragging=true;moved=false;docked.value=false;
 const p=point(e);sx=p.x;sy=p.y;ox=x.value;oy=y.value;
 // #ifdef H5
 window.addEventListener('mousemove',onPointerMove);window.addEventListener('mouseup',onPointerUp);
 // #endif
}
function onPointerMove(e){
 if(!dragging||expanded.value)return;
 const p=point(e);const dx=p.x-sx,dy=p.y-sy;
 if(Math.abs(dx)>6||Math.abs(dy)>6)moved=true;
 x.value=ox+dx;y.value=oy+dy;clamp();
}
function onPointerUp(){
 if(!dragging)return;dragging=false;
 // #ifdef H5
 window.removeEventListener('mousemove',onPointerMove);window.removeEventListener('mouseup',onPointerUp);
 // #endif
 if(!moved){if(props.assist)expand();else go('assistant');return}
 const hit=edgeSide();
 if(hit){side.value=hit;docked.value=true;x.value=hit==='left'?margin:Math.max(margin,viewport().w-stickerW-margin)}
 else docked.value=false;
}
function expand(){
 if(!props.assist){go('assistant');return}
 const {w,h}=viewport();
 winW.value=Math.min(360,w-20);winH.value=Math.min(460,h-24);
 winX.value=Math.max(8,Math.min(x.value+stickerW-winW.value,w-winW.value-8));
 winY.value=Math.max(8,Math.min(y.value,h-winH.value-8));
 clamp();expanded.value=true;docked.value=false;followLatest.value=true;scrollEnd();dismissTip('ball');
}
function collapse(){
 const {w,h}=viewport();
 x.value=Math.max(margin,Math.min(winX.value+winW.value-stickerW,w-stickerW-margin));
 y.value=Math.max(margin,Math.min(winY.value+winH.value-stickerH,h-stickerH-margin));
 expanded.value=false;docked.value=false;stop();clamp();
}
function openFull(){collapse();go('assistant')}
function onWindowDown(e){
 dragging=true;moved=false;const p=point(e);sx=p.x;sy=p.y;ox=winX.value;oy=winY.value;
 // #ifdef H5
 window.addEventListener('mousemove',onWindowMove);window.addEventListener('mouseup',onWindowUp);
 // #endif
}
function onWindowMove(e){
 if(!dragging||!expanded.value)return;
 const p=point(e);
 if(Math.abs(p.x-sx)>6||Math.abs(p.y-sy)>6)moved=true;
 winX.value=ox+(p.x-sx);winY.value=oy+(p.y-sy);clamp();
}
function onWindowUp(){
 dragging=false;
 // #ifdef H5
 window.removeEventListener('mousemove',onWindowMove);window.removeEventListener('mouseup',onWindowUp);
 // #endif
}
function onResizeDown(e){
 dragging=true;const p=point(e);sx=p.x;sy=p.y;ox=winW.value;oy=winH.value;
 // #ifdef H5
 window.addEventListener('mousemove',onResizeMove);window.addEventListener('mouseup',onResizeUp);
 // #endif
}
function onResizeMove(e){
 if(!dragging)return;
 const p=point(e);winW.value=ox+(p.x-sx);winH.value=oy+(p.y-sy);clamp();
}
function onResizeUp(){
 dragging=false;
 // #ifdef H5
 window.removeEventListener('mousemove',onResizeMove);window.removeEventListener('mouseup',onResizeUp);
 // #endif
}
function onThreadScroll(e){
 const d=e.detail||{};const top=d.scrollTop||0,height=d.scrollHeight||0;
 const client=winH.value-140;
 followLatest.value=(height-top-client)<80;
}
function currentPage(){return getCurrentPages().slice(-1)[0]?.route?.split('/')[1]||''}
function syncPage(){
 const show=!props.hideOn.includes(currentPage());
 if(show&&!visible.value)clamp();
 visible.value=show;
}
function onResize(){clamp()}
onMounted(()=>{
 if(!store.inited){defaultPos();defaultWindow();store.inited=true}
 clamp();syncPage()
 // #ifdef H5
 window.addEventListener('resize',onResize);
 // uni-view 在 H5 不转发原生 mousedown/touchstart，改为文档级委托
 document.addEventListener('mousedown',delegateDown,true);
 document.addEventListener('touchstart',delegateDown,{capture:true,passive:false});
 // #endif
});
onShow(()=>{syncPage()});
// #ifdef H5
function bindTouch(move,up){
 const onMove=e=>{if(e.cancelable)e.preventDefault();move(e)};
 const onEnd=e=>{window.removeEventListener('touchmove',onMove);window.removeEventListener('touchend',onEnd);window.removeEventListener('touchcancel',onEnd);up(e)};
 window.addEventListener('touchmove',onMove,{passive:false});window.addEventListener('touchend',onEnd);window.addEventListener('touchcancel',onEnd);
}
function delegateDown(e){
 const t=e.target;if(!t||!t.closest)return;
 // 多个页面各有一个实例，只处理点在自己根节点内的事件
 if(t.closest('.xiaoji-root')?.dataset?.xj!==uid)return;
 const touch=e.type==='touchstart';
 if(t.closest('.xiaoji-resize')){onResizeDown(e);if(touch)bindTouch(onResizeMove,onResizeUp);return}
 if(t.closest('.xiaoji-ball')){onPointerDown(e);if(touch&&dragging)bindTouch(onPointerMove,onPointerUp);return}
 if(t.closest('.xiaoji-bar')&&!t.closest('button,uni-button,.xiaoji-min')){
  if(e.type==='mousedown'&&e.button!==0)return;
  onWindowDown(e);if(touch)bindTouch(onWindowMove,onWindowUp)
 }
}
// #endif
onBeforeUnmount(()=>{
 // #ifdef H5
 window.removeEventListener('resize',onResize);
 document.removeEventListener('mousedown',delegateDown,true);
 document.removeEventListener('touchstart',delegateDown,true);
 // #endif
});
</script>
<style>
.xiaoji-root{position:fixed;z-index:70;pointer-events:none;transition:transform .22s ease}
.xiaoji-root>*{pointer-events:auto}
.xiaoji-ball-wrap{position:relative;width:60px;height:60px}
.xiaoji-copy{position:absolute;right:68px;top:14px;max-width:126px;padding:6px 10px;background:#fffaf1ee;border:1px solid #e2d3b8;border-radius:10px 10px 4px 10px;font-size:12px;line-height:1.5;color:#534433;white-space:nowrap}
.xiaoji-root.left .xiaoji-copy{right:auto;left:68px;border-radius:10px 10px 10px 4px}
.xiaoji-ball{width:60px;height:60px;min-height:60px;margin:0;padding:0;border-radius:50%;border:2px solid #d7c09a;background:#f4ead6;box-shadow:0 6px 16px #4b351822;overflow:hidden;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none}
.xiaoji-ball:after{border:0}
.xiaoji-face{width:100%;height:100%;display:block;pointer-events:none}
.xiaoji-face :deep(div){background-size:165% auto!important;background-position:65% 5%!important}
.xiaoji-mini :deep(div){background-size:220% auto!important;background-position:50% 0!important}
.xiaoji-mini{width:34px;height:34px;border-radius:50%;border:1px solid #e2d3b8;background:#f3e7d2;flex-shrink:0;display:block;overflow:hidden}
.xiaoji-root.docked:not(.left){transform:translateX(38px)}
.xiaoji-root.docked.left{transform:translateX(-38px)}
.xiaoji-window{display:flex;flex-direction:column;min-height:0;background:#fffaf2e8;border:1px solid #e2d4bb;border-radius:16px;box-shadow:0 18px 48px #3c2a140f;backdrop-filter:blur(16px);overflow:hidden}
.xiaoji-bar{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid #eadfcd;cursor:move;flex:none}
.xiaoji-mini{width:36px;height:44px;border-radius:0;border:0;background:transparent;flex-shrink:0}
.xiaoji-bar-copy{flex:1;min-width:0}
.xiaoji-name{display:block;font:14px/1.4 STSong,SimSun,serif;color:#354d43}
.xiaoji-sub{display:block;font-size:12px;color:#534433}
.xiaoji-disclaimer{display:block;padding:0 12px 8px;font-size:12px;line-height:1.5;color:#534433;text-align:center;background:#fffaf2e8}
.xiaoji-full,.xiaoji-min{margin:0;padding:4px 10px;min-height:32px;font-size:12px;border-radius:8px;background:#f4edde;color:#534433}
.xiaoji-min{background:#982b28;color:#fffaf1;font-weight:600}
.xiaoji-full:after,.xiaoji-min:after{border:0}
.xiaoji-thread{flex:1;min-height:0;height:0;padding:8px 12px}
.xiaoji-empty{padding:18px 6px;color:#534433;font-size:12px;line-height:1.8}
.xiaoji-starts{display:flex;flex-direction:column;gap:6px;margin-top:12px}
.xiaoji-starts button{margin:0;text-align:left;padding:8px 10px;min-height:34px;font-size:12px;border:1px solid #e2d3b8;border-radius:9px;background:#fffdf8;color:#6d5b45}
.xiaoji-starts button:after{border:0}
.xiaoji-turn{margin:8px 0;display:flex;flex-direction:column;gap:4px}
.xiaoji-turn.user{align-items:flex-end}
.xiaoji-bubble{max-width:88%;padding:8px 11px;border-radius:12px;font-size:14px;line-height:1.7;background:#fffaf1;border:1px solid #eadbc4;color:#35281d}
.xiaoji-turn.user .xiaoji-bubble{background:#f1e7d5;border-color:#e4d3b5;border-radius:12px 12px 4px 12px}
.xiaoji-notice,.xiaoji-cites,.xiaoji-wait,.xiaoji-error{font-size:12px;line-height:1.6;color:#534433}
.xiaoji-cites{display:flex;flex-direction:column;gap:2px;padding:4px 0}
.xiaoji-error{color:#8a3b32;background:#f9e8e3;border-radius:8px;padding:7px 9px}
.xiaoji-composer{display:flex;align-items:flex-end;gap:8px;margin:6px 10px 6px;padding:6px 6px 6px 12px;border:1px solid #e4d3b5;border-radius:14px;background:#fffdf8;flex:none}
.xiaoji-composer:focus-within{border-color:#982b28;box-shadow:0 4px 14px #982b2814}
.xiaoji-input{flex:1;min-width:0;min-height:34px;max-height:84px;padding:6px 0;font-size:14px;line-height:1.6;background:transparent}
.xiaoji-send{display:flex;align-items:center;justify-content:center;width:36px;height:36px;min-height:36px;margin:0;padding:0;border-radius:50%;background:#982b28;flex-shrink:0}
.xiaoji-send-icon{width:20px;height:20px;display:block;pointer-events:none}
.xiaoji-send:after{border:0}
.xiaoji-send[disabled]{opacity:.4}
.xiaoji-resize{position:absolute;right:2px;bottom:2px;width:16px;height:16px;cursor:nwse-resize;background:linear-gradient(135deg,transparent 50%,#bd9a67 50%)}
@media(max-width:650px){.xiaoji-copy{display:none}.xiaoji-full{display:none}}
@media(prefers-reduced-motion:reduce){.xiaoji-root{transition:none}}
</style>
