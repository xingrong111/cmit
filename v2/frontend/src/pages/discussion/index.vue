<template><AppShell><!-- #ifdef H5 --><AccountModule :src="url" title="账户与讨论"/><!-- #endif --></AppShell></template>
<script setup>import AppShell from '../../components/AppShell.vue';import AccountModule from '../../components/AccountModule.vue';import {ref} from 'vue';import {onLoad,onShow,onUnload} from '@dcloudio/uni-app';const url=ref('/modules/account/#discussion');function setTopic(id){const base=url.value.split('?')[0].split('#')[0];const route='discussion';url.value=base+(id?'?topicId='+encodeURIComponent(id):'')+'#'+route;}function syncTopic(){
// #ifdef H5
if(location.hash.split('?')[0]==='#/pages/discussion/index')setTopic(new URLSearchParams(location.hash.split('?')[1]||'').get('topicId'));
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