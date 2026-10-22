<template><view class="account-module-stage" :style="{height:height+'px'}"><iframe ref="frame" :src="src" :title="title" scrolling="no" @load="fit"></iframe></view></template>
<script setup>
import {ref,onBeforeUnmount} from 'vue';
defineProps({src:String,title:{type:String,default:'账户与讨论'}});
const frame=ref(null),height=ref(900);let observer;
function fit(){
 observer?.disconnect();const doc=frame.value?.contentDocument;if(!doc?.body)return;
 doc.body.classList.add('account-embedded');
 const resize=()=>{doc.documentElement.style.setProperty('--account-viewport',window.innerHeight+'px');const content=doc.querySelector('#app>.content');const next=Math.ceil(content?content.offsetTop+content.offsetHeight:doc.body.getBoundingClientRect().height)+2;if(next>0&&Math.abs(next-height.value)>2)height.value=next;};
 observer=new ResizeObserver(resize);observer.observe(doc.body);resize();
}
onBeforeUnmount(()=>observer?.disconnect());
</script>
<style>.account-module-stage{width:100%;min-height:400px}.account-module-stage iframe{display:block;width:100%;height:100%;border:0}</style>
