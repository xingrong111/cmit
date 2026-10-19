<template>
 <view class="guide-entry"><view><text>第一次来？从一段小旅程开始</text><text>找人物 · 看全景 · 做挑战，按你的兴趣出发。</text></view><button @tap="go('guide')">使用指南 ↗</button></view>
 <view v-if="visible" class="welcome-mask"><view class="welcome-dialog" role="dialog" aria-modal="true" aria-labelledby="welcome-title" aria-describedby="welcome-copy">
  <view class="welcome-top"><text>山河有迹 · 初次相逢</text><button aria-label="跳过欢迎导览" @tap="close('skipped')">暂时跳过 ×</button></view>
  <scroll-view scroll-y :show-scrollbar="false" class="welcome-content" :scroll-top="scrollTop">
   <view class="welcome-art" :class="{compact:index===3}"><image src="/static/landscape.svg" mode="aspectFill"/><view><image class="welcome-brand-logo" src="/static/山河有迹Logo.png" mode="aspectFit"/><text>{{slide.art}}</text></view><text class="welcome-art-note">地图为引 · 史料为据</text></view>
   <text class="welcome-count">{{index+1}} / 4 · {{slide.label}}</text><text id="welcome-title" class="welcome-title">{{slide.title}}</text><text id="welcome-copy" class="welcome-copy">{{slide.copy}}</text>
   <view v-if="index<3" class="welcome-points"><view v-for="(point,i) in slide.points" :key="point"><text>{{i+1}}</text><text>{{point}}</text></view></view>
   <view v-if="index===3" class="welcome-choices"><button v-for="item in journeys" :key="item.id" :class="{selected:choice===item.id}" :aria-pressed="choice===item.id" @tap="choice=item.id"><image :src="'/static/icons/'+item.icon+'.png'"/><text>{{item.title}}</text><text>{{choice===item.id?'✓':''}}</text></button></view>
  </scroll-view>
  <view class="welcome-footer"><view class="welcome-dots" aria-label="导览进度"><view v-for="n in 4" :key="n" :class="{current:n===index+1,passed:n<index+1}"/></view><view class="welcome-buttons"><button v-if="index>0" class="welcome-prev" @tap="index--">上一步</button><button class="welcome-next" @tap="next">{{index===3?'开始我的旅程':'下一步'}} →</button></view></view>
  <text class="welcome-footnote">内容可上下滑动 · 以后在“我的 → 使用指南”中重看。</text>
 </view></view>
</template>
<script setup>
import {ref,computed,watch,nextTick,onMounted,onBeforeUnmount} from 'vue';
import {onShow,onHide} from '@dcloudio/uni-app';
import {go} from '../lib/navigation.js';
import {shouldOfferGuide,saveGuide,takeGuideRequest} from '../lib/首次使用引导.js';
import {slides,journeys} from '../data/使用指南.js';
const visible=ref(false),index=ref(0),choice=ref('read'),scrollTop=ref(0),slide=computed(()=>slides[index.value]);
let timer,offscreen=false;
function open(){if(offscreen||visible.value)return;index.value=0;choice.value='read';visible.value=true;}
function close(status){visible.value=false;saveGuide(status);}
function next(){if(index.value<3){index.value++;return;}const target=journeys.find(x=>x.id===choice.value)||journeys[0];close('completed');go(target.page,target.params);}
function requested(){if(!offscreen&&takeGuideRequest())open();}
function schedule(){offscreen=false;clearTimeout(timer);timer=setTimeout(()=>{if(!offscreen&&(takeGuideRequest()||shouldOfferGuide()))open();},650);}
onShow(schedule);onMounted(()=>{uni.$on('shanhe:guide:open',requested);schedule();});
onHide(()=>{offscreen=true;clearTimeout(timer);if(visible.value)close('skipped');});
watch(index,()=>{scrollTop.value=1;nextTick(()=>scrollTop.value=0);});
// #ifdef H5
let previousOverflow='',previousFocus;
function focusCard(){nextTick(()=>document.querySelector('.welcome-dialog .welcome-next')?.focus());}
function keys(e){if(!visible.value)return;if(e.key==='Escape'){e.preventDefault();close('skipped');}if(e.key==='Tab'){const buttons=[...document.querySelectorAll('.welcome-dialog button,.welcome-dialog uni-button')].filter(x=>!x.disabled);const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}
watch(visible,value=>{if(value){previousOverflow=document.body.style.overflow;previousFocus=document.activeElement;document.body.style.overflow='hidden';document.addEventListener('keydown',keys);focusCard();}else{document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',keys);previousFocus?.focus?.();}});
watch(index,()=>{if(visible.value)focusCard();});
// #endif
// #ifndef H5
watch(visible,value=>{if(value)uni.hideTabBar({animation:false});else uni.showTabBar({animation:false});});
// #endif
onBeforeUnmount(()=>{clearTimeout(timer);uni.$off('shanhe:guide:open',requested);
// #ifdef H5
document.removeEventListener('keydown',keys);if(visible.value)document.body.style.overflow=previousOverflow;
// #endif
// #ifndef H5
if(visible.value)uni.showTabBar({animation:false});
// #endif
});
</script>

<style scoped>.welcome-brand-logo{width:70px!important;height:70px!important;position:relative!important;opacity:1!important;inset:auto!important;display:block;margin:0 auto 14px}</style>
