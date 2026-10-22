<template><AppShell><view class="module-frame learning-flow" :style="'height:'+frameHeight+'!important'"><!-- #ifdef H5 --><iframe ref="frame" :src="url" @load="fitFrame" scrolling="no" title="学习挑战" class="embedded-module"></iframe><!-- #endif --><!-- #ifndef H5 --><text>原生学习页由组装脚本接入</text><!-- #endif --></view></AppShell></template>
<script setup>import {ref,onBeforeUnmount} from 'vue';import {onLoad,onShow} from '@dcloudio/uni-app';import AppShell from '../../components/AppShell.vue';const frame=ref(null);const frameHeight=ref('1000px');let frameObserver=null;
function fitFrame(){
 // #ifdef H5
 frameObserver?.disconnect();const el=frame.value,d=el?.contentDocument;if(!d?.body)return;d.documentElement.style.overflow='hidden';d.body.style.overflow='hidden';
 const resize=()=>{const height=Math.ceil(d.body.getBoundingClientRect().height)+4;if(height>0&&frameHeight.value!==height+'px')frameHeight.value=height+'px'};
 frameObserver=new ResizeObserver(resize);frameObserver.observe(d.body);resize();
 // #endif
}
onBeforeUnmount(()=>frameObserver?.disconnect());const url=ref('/modules/learning/');onLoad(o=>{if(o.view==='honors')url.value+='?view=honors';else if(/^(QQB|LYS|SZZ|LDY|JZY)$/.test(o.group||''))url.value+='?group='+o.group});onShow(()=>{
// #ifdef H5
setTimeout(()=>frame.value?.contentWindow?.postMessage({type:'yingji-refresh-learning'},location.origin),100);
// #endif
})</script><style>.module-frame{height:100%}.embedded-module{border:0;width:100%;height:100%}</style>
