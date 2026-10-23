<template><image :src="src" mode="aspectFit" aria-label="国风人物头像"/></template>
<script setup>
import {ref,watch} from 'vue';import {landscapeAvatar,renderAvatar} from '../lib/avatar.js';
const props=defineProps({avatarKey:{type:String,default:'山河读者'}});const src=ref('');let sequence=0;
watch(()=>props.avatarKey,key=>{const current=++sequence;src.value=landscapeAvatar(key);
// #ifdef H5
renderAvatar(key).then(url=>{if(current===sequence)src.value=url}).catch(()=>{});
// #endif
},{immediate:true});
</script>
