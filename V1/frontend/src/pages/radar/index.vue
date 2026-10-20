<template><AppShell><view class="module-frame radar-frame" :style="'height:'+frameHeight+'!important'"><!-- #ifdef H5 --><iframe ref="frame" :src="url" @load="fitFrame" scrolling="no" title="历史足迹" class="embedded-module"></iframe><!-- #endif --><!-- #ifndef H5 --><text>原生页面将在组装时接入</text><!-- #endif --></view></AppShell></template>
<script setup>import AppShell from '../../components/AppShell.vue';import {ref,onBeforeUnmount} from 'vue';import {onLoad,onShow} from '@dcloudio/uni-app';const frame=ref(null);const frameHeight=ref('900px');let frameObserver=null;
function fitFrame(){
 // #ifdef H5
 frameObserver?.disconnect();const el=frame.value,d=el?.contentDocument;if(!d?.body)return;
 d.documentElement.style.overflow='hidden';d.body.style.overflow='hidden';
 const resize=()=>{const height=Math.ceil(d.body.getBoundingClientRect().height)+4;if(height>0&&frameHeight.value!==height+'px')frameHeight.value=height+'px'};
 frameObserver=new ResizeObserver(resize);frameObserver.observe(d.body);resize();
 // #endif
}
onBeforeUnmount(()=>frameObserver?.disconnect());const url=ref('/web/#radar');onLoad(o=>{if(o.topicId)url.value+='?topicId='+encodeURIComponent(o.topicId);});onShow(()=>{
// #ifdef H5
setTimeout(()=>frame.value?.contentWindow?.postMessage({type:'yingji-account-refresh'},location.origin),100);
// #endif
const context=uni.getStorageSync('yingji:radar-person');if(context){uni.removeStorageSync('yingji:radar-person');const personId=typeof context==='string'?context:context.id;const name=typeof context==='string'?'':context.name;url.value='/web/?archiveId='+encodeURIComponent(personId)+'&name='+encodeURIComponent(name)+'#radar';}})</script>
<style>.module-frame{width:100%;height:calc(100vh - 170px)}.module-frame.radar-frame{min-height:400px}.embedded-module{border:0;width:100%;height:100%;display:block}</style>
<style>
/* 足迹使用页面单一滚动，不继承聊天模块的整屏裁切布局。 */
html body uni-app uni-page:has(.radar-frame),html body uni-page uni-page-wrapper:has(.radar-frame),html body uni-page-wrapper uni-page-body:has(.radar-frame){height:auto!important;min-height:100dvh!important;overflow:visible!important}
.app-shell:has(.radar-frame){height:auto!important;min-height:100dvh;overflow:visible!important;display:block}
.app-shell:has(.radar-frame) .shell-body{height:auto;overflow:visible;min-height:0}
.app-shell:has(.radar-frame) .page-return{margin-bottom:14px}
</style>
