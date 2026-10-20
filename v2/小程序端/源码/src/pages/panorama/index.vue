<template><web-view v-if="url" :src="url" @error="failed"/><view v-else style="padding:24px;line-height:1.9"><text>全景网页版暂未配置发布地址，可先体验完整文字与配音故事。</text><button @tap="go('story')">阅读针线里的黎明</button></view></template>
<script setup>
import {go} from '../../lib/navigation.js';import {ref} from 'vue';const url=ref('https://shanhe-youji-20261017.bushystar3.chatgpt.site/panorama/qqb/场景.html');
import {onLoad} from '@dcloudio/uni-app';onLoad(q=>{const scene=(q.scene||(q.story==='lys'?'LYS':'QQB')).toUpperCase();if(q.story==='jiang'||scene==='JZY'){url.value=import.meta.env.VITE_STORY_ORIGIN?import.meta.env.VITE_STORY_ORIGIN.replace(/\/$/,'')+'/vr/互动故事.html?host=mini':''}else{const valid=['QQB','SZZ','LDY','LYS'].includes(scene)?scene:'QQB';url.value=valid==='LDY'?'https://shanhe-youji-20261017.bushystar3.chatgpt.site/panorama/ldy/场景.html':'https://shanhe-youji-20261017.bushystar3.chatgpt.site/panorama/qqb/场景.html?scene='+valid;uni.setNavigationBarTitle({title:({QQB:'瞿秋白',SZZ:'宋振中',LDY:'陆定一',LYS:'狼牙山五壮士'}[valid])+' · 360°全景'});}
// #ifdef H5
url.value=(q.story==='jiang'||scene==='JZY')?location.origin+'/vr/互动故事.html':location.origin+new URL(url.value).pathname+new URL(url.value).search;
// #endif
});

function failed(){uni.showModal({title:'全景网页未能打开',content:'请检查网络，并在微信小程序后台配置全景网站的HTTPS业务域名。',showCancel:false})}
</script>
