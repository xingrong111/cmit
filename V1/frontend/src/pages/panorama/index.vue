<template><web-view :src="url" @error="failed"/></template>
<script setup>
import {ref} from 'vue';
import {onLoad} from '@dcloudio/uni-app';
const url=ref('');
onLoad(options=>{
  const scene=options.scene==='ldy'?'ldy':'qqb';
  // #ifdef H5
  url.value=`/panorama/${scene}/场景.html`;
  location.replace(url.value);
  // #endif
  // #ifndef H5
  url.value=`https://shanhe-youji-20261017.bushystar3.chatgpt.site/panorama/${scene}/场景.html`;
  // #endif
});
function failed(){uni.showModal({title:'全景网页未能打开',content:'请检查网络，并在微信小程序后台配置全景网站的HTTPS业务域名。',showCancel:false})}
</script>
