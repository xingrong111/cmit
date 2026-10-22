<template><AppShell><view class="module-frame account-stage" :style="'height:'+frameHeight+'px!important'"><!-- #ifdef H5 --><iframe ref="frame" @load="fitFrame" scrolling="no" :src="url" title="账户" class="embedded-module"></iframe><!-- #endif --><!-- #ifndef H5 --><text>原生页面将在组装时接入</text><!-- #endif --></view></AppShell></template>
<script setup>import AppShell from '../../components/AppShell.vue';import AccountModule from '../../components/AccountModule.vue';import {ref,onBeforeUnmount} from 'vue';import {onLoad,onShow,onUnload} from '@dcloudio/uni-app';const frame=ref(null),frameHeight=ref(1000);let frameObserver;
function fitFrame(){
// #ifdef H5
frameObserver?.disconnect();const d=frame.value?.contentDocument;if(!d?.body)return;d.documentElement.style.overflow='hidden';d.body.style.overflow='hidden';const resize=()=>{frameHeight.value=Math.ceil(d.body.getBoundingClientRect().height)+8};frameObserver=new ResizeObserver(resize);frameObserver.observe(d.body);resize();
// #endif
}
onBeforeUnmount(()=>frameObserver?.disconnect());const url=ref('/modules/account/#me');function setTopic(id){const base=url.value.split('?')[0].split('#')[0];const requested=new URLSearchParams(location.hash.split('?')[1]||'').get('view');const route=['login','register','me'].includes(requested)?requested:'me';const back=new URLSearchParams(location.hash.split('?')[1]||'').get('returnTo');url.value=base+(id?'?topicId='+encodeURIComponent(id):back==='learning'?'?returnTo=learning':'')+'#'+(back==='learning'?'login':route);}function syncTopic(){
// #ifdef H5
if(location.hash.split('?')[0]==='#/pages/account/index')setTopic(new URLSearchParams(location.hash.split('?')[1]||'').get('topicId'));
// #endif
}onLoad(o=>{setTopic(o.topicId);
// #ifdef H5
window.addEventListener('hashchange',syncTopic);
// #endif
});onUnload(()=>{
// #ifdef H5
window.removeEventListener('hashchange',syncTopic);
// #endif
});onShow(()=>{
// #ifdef H5
setTopic(new URLSearchParams(location.hash.split('?')[1]||'').get('topicId'));
// #endif
})</script>
<style>.module-frame{width:100%;height:calc(100vh - 170px)}.embedded-module{border:0;width:100%;height:100%;display:block}</style>