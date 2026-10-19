<template><view class="person-panorama" :class="{'panorama-expanded':expanded}">
<!-- #ifdef H5 -->
<iframe ref="frame" class="person-panorama-frame" :src="sceneUrl" :title="sceneName+'360度可交互全景'" allow="fullscreen" allowfullscreen="true" loading="eager"></iframe>
<button v-if="expanded" class="panorama-exit" @tap="setExpanded(false)">退出全屏 ×</button>
<!-- #endif -->
<!-- #ifndef H5 -->
<image class="panorama-mobile-poster" src="/static/青绿山水.jpg" mode="aspectFill"/><view class="panorama-mobile-copy"><text class="eyebrow">沉浸阅读 · 360°全景</text><text class="panorama-mobile-name">{{sceneName}}</text><text class="small">艺术化场景，可拖动环视、缩放与全屏。</text><button class="primary" @tap="openPanorama">进入360°全景 ↗</button></view>
<!-- #endif -->
<button v-if="!sceneOnly" class="panorama-archive" @tap="showPortrait=true"><image :src="portraitSrc" mode="aspectFill"/><view><text>{{sceneName}} · 人物档案</text><text class="panorama-archive-hint">史料照片 / IP形象 ↗</text></view></button>
<view v-if="showPortrait" class="panorama-portrait-mask" @tap.self="showPortrait=false"><view class="panorama-portrait-dialog"><view class="panorama-dialog-top"><text>人物图像</text><button @tap="showPortrait=false" aria-label="关闭人物图像">×</button></view><PersonPortrait :person-id="portraitId" :name="sceneName" variant="cover"/></view></view>
</view></template>
<script setup>
import {ref,computed,onMounted,onBeforeUnmount} from 'vue';import PersonPortrait from './PersonPortrait.vue';import portraits from '../data/人物肖像.json';
const props=defineProps({sceneOnly:Boolean,group:{type:String,default:'QQB'}});const sceneUrl=computed(()=>props.group==='LDY'?'/panorama/ldy/场景.html':'/panorama/qqb/场景.html?scene='+props.group),sceneName=computed(()=>({QQB:'瞿秋白',LYS:'狼牙山五壮士',SZZ:'宋振中',LDY:'陆定一'}[props.group]||'瞿秋白'));
const portraitId=computed(()=>({QQB:'P009',SZZ:'P004',LDY:'P014'}[props.group]||'P009')),portraitSrc=computed(()=>portraits[portraitId.value]?.src||'/static/青绿山水.jpg'),showPortrait=ref(false),expanded=ref(false),frame=ref(null);let previousOverflow='';
function openPanorama(){uni.navigateTo({url:'/pages/panorama/index?scene='+props.group})}
function setExpanded(value){expanded.value=value;
// #ifdef H5
if(value){previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden'}else document.body.style.overflow=previousOverflow;
frame.value?.contentWindow?.postMessage({type:'shanhe-panorama-expanded',expanded:value},location.origin)
// #endif
}
// #ifdef H5
function message(e){if(e.origin!==location.origin||e.source!==frame.value?.contentWindow)return;if(e.data?.type==='shanhe-panorama-fullscreen'&&e.data.scene===props.group)setExpanded(!!e.data.expanded)}
function key(e){if(e.key==='Escape'){if(expanded.value)setExpanded(false);showPortrait.value=false}}
onMounted(()=>{window.addEventListener('message',message);window.addEventListener('keydown',key)});onBeforeUnmount(()=>{window.removeEventListener('message',message);window.removeEventListener('keydown',key);if(expanded.value)document.body.style.overflow=previousOverflow})
// #endif
</script>
<style scoped>
.person-panorama{height:470px;position:relative;overflow:hidden;border:1px solid #d4bd97;border-radius:9px;background:#354d43}.person-panorama-frame{display:block;width:100%;height:100%;border:0}.panorama-archive{position:absolute;left:24px;bottom:45px;display:flex;align-items:center;gap:11px;max-width:250px;min-height:62px;padding:8px 13px 8px 8px;border:1px solid #e4cda177;background:#fbf5e9ed;border-radius:5px;text-align:left;margin:0;box-shadow:0 4px 24px #0002}.panorama-archive image{width:37px;height:48px;border-radius:2px;flex-shrink:0}.panorama-archive view{display:flex;flex-direction:column;gap:6px}.panorama-archive text{font-size:12px;color:#354d43;line-height:1.4}.panorama-archive .panorama-archive-hint{font-size:9px;color:#982b28}.panorama-expanded{position:fixed;inset:0;z-index:20000;height:100dvh;width:100%;border:0;border-radius:0}.panorama-exit{position:absolute;top:16px;right:16px;border:1px solid #dcc59d;background:#fbf5e9;color:#982b28;padding:8px 12px;font-size:12px;border-radius:5px;z-index:3}.panorama-portrait-mask{position:fixed;inset:0;background:#17231bb3;display:flex;align-items:center;justify-content:center;z-index:21000;padding:24px}.panorama-portrait-dialog{background:#fbf5e9;border:1px solid #bd9a67;border-radius:10px;padding:15px;width:310px;max-width:90vw;box-shadow:0 20px 90px #0005}.panorama-dialog-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;color:#354d43;font-size:14px}.panorama-dialog-top button{margin:0;border:0;background:none;font-size:23px;padding:2px 8px;line-height:1.4;color:#982b28}.panorama-mobile-poster{position:absolute;inset:0;width:100%;height:100%;opacity:.5}.panorama-mobile-copy{position:absolute;top:25px;left:23px;right:23px;display:flex;flex-direction:column;gap:16px;color:#fbf5e9}.panorama-mobile-copy .eyebrow,.panorama-mobile-copy .small{color:#f0e2c7}.panorama-mobile-name{font:38px STSong,SimSun,serif}.panorama-mobile-copy button{margin:0;align-self:flex-start;padding:10px 18px;min-width:150px}
@media(max-width:650px){.person-panorama{height:370px;border-radius:7px}.panorama-expanded{height:100dvh}.panorama-archive{left:15px;bottom:46px;padding:6px 9px 6px 6px;gap:7px;max-width:190px;min-height:48px}.panorama-archive image{width:29px;height:37px}.panorama-archive text{font-size:10px}.panorama-archive .panorama-archive-hint{font-size:8px}.panorama-archive view{gap:4px}}
</style>
