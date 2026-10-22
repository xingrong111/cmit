<template><AppShell><view class="module-frame assistant-stage"><!-- #ifdef H5 --><iframe ref="frame" :src="url" @load="fitFrame" title="小迹导览" class="embedded-module"></iframe><!-- #endif --><!-- #ifndef H5 --><text>原生页面将在组装时接入</text><!-- #endif --></view></AppShell></template>
<script setup>
import AppShell from '../../components/AppShell.vue';
import {ref} from 'vue';
import {onLoad,onShow} from '@dcloudio/uni-app';
const frame=ref(null);
function fitFrame(){
 // #ifdef H5
 const el=frame.value,win=el?.contentWindow;
 if(win?.fitAssistantViewport)win.fitAssistantViewport();
 else win?.dispatchEvent(new Event('resize'));
 // #endif
}
const url=ref('/web/#assistant');
onLoad(o=>{if(o.topicId)url.value+='?topicId='+encodeURIComponent(o.topicId);});
onShow(()=>{
// #ifdef H5
setTimeout(()=>frame.value?.contentWindow?.postMessage({type:'yingji-account-refresh'},location.origin),100);
fitFrame();
// #endif
const context=uni.getStorageSync('yingji:guide-person');if(context){uni.removeStorageSync('yingji:guide-person');const personId=typeof context==='string'?context:context.id;const name=typeof context==='string'?'':context.name;url.value='/web/?archiveId='+encodeURIComponent(personId)+'&name='+encodeURIComponent(name)+'#assistant';}})
</script>
<style>
.assistant-stage{width:100%;height:100%;min-height:0}
.embedded-module{border:0;width:100%;height:100%;display:block}
</style>
