<template><web-view :src="url" @error="failed"/></template>
<script setup>
import {ref} from 'vue';const url=ref('https://shanhe-youji-20261017.bushystar3.chatgpt.site/panorama/qqb/场景.html');
function failed(){uni.showModal({title:'全景网页未能打开',content:'请检查网络，并在微信小程序后台配置全景网站的HTTPS业务域名。',showCancel:false})}
</script>
