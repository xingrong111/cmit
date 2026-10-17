<template><AppShell><view class="module-frame"><!-- #ifdef H5 --><iframe ref="frame" :src="url" title="学习挑战" class="embedded-module"></iframe><!-- #endif --><!-- #ifndef H5 --><text>原生学习页由组装脚本接入</text><!-- #endif --></view></AppShell></template>
<script setup>import {ref} from 'vue';import {onLoad,onShow} from '@dcloudio/uni-app';import AppShell from '../../components/AppShell.vue';const frame=ref(null),url=ref('/modules/learning/');onLoad(o=>{if(/^(QQB|LYS|SZZ|LDY|JZY)$/.test(o.group||''))url.value+='?group='+o.group});onShow(()=>{
// #ifdef H5
setTimeout(()=>frame.value?.contentWindow?.postMessage({type:'yingji-refresh-learning'},location.origin),100);
// #endif
})</script><style>.module-frame{height:100%}.embedded-module{border:0;width:100%;height:100%}</style>