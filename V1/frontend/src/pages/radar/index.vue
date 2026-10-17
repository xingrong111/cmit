<template><AppShell><view class="module-frame"><!-- #ifdef H5 --><iframe ref="frame" :src="url" title="历史足迹" class="embedded-module"></iframe><!-- #endif --><!-- #ifndef H5 --><text>原生页面将在组装时接入</text><!-- #endif --></view></AppShell></template>
<script setup>import AppShell from '../../components/AppShell.vue';import {ref} from 'vue';import {onLoad,onShow} from '@dcloudio/uni-app';const frame=ref(null);const url=ref('/web/#radar');onLoad(o=>{if(o.topicId)url.value+='?topicId='+encodeURIComponent(o.topicId);});onShow(()=>{
// #ifdef H5
setTimeout(()=>frame.value?.contentWindow?.postMessage({type:'yingji-account-refresh'},location.origin),100);
// #endif
const context=uni.getStorageSync('yingji:radar-person');if(context){uni.removeStorageSync('yingji:radar-person');const personId=typeof context==='string'?context:context.id;const name=typeof context==='string'?'':context.name;url.value='/web/?archiveId='+encodeURIComponent(personId)+'&name='+encodeURIComponent(name)+'#radar';}})</script>
<style>.module-frame{width:100%;height:calc(100vh - 170px)}.embedded-module{border:0;width:100%;height:100%;display:block}</style>