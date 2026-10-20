<template><web-view :src="url" @error="failed"/></template>
<script setup>
import {ref} from 'vue';const url=ref('https://shanhe-youji-20261017.bushystar3.chatgpt.site/panorama/qqb/场景.html');
import {onLoad} from '@dcloudio/uni-app';onLoad(q=>{const scene=(q.scene||(q.story==='lys'?'LYS':'QQB')).toUpperCase();if(q.story==='jiang'){url.value='https://shanhe-youji-20261017.bushystar3.chatgpt.site/panorama/jiang/第一幕动态版.html'}else{const valid=['QQB','SZZ','LDY','LYS'].includes(scene)?scene:'QQB';url.value='https://shanhe-youji-20261017.bushystar3.chatgpt.site/panorama/qqb/场景.html?scene='+valid;uni.setNavigationBarTitle({title:({QQB:'瞿秋白',SZZ:'宋振中',LDY:'陆定一',LYS:'狼牙山五壮士'}[valid])+' · 360°全景'});}
// #ifdef H5
url.value=location.origin+new URL(url.value).pathname+new URL(url.value).search;
// #endif
});

function failed(){uni.showModal({title:'全景网页未能打开',content:'请检查网络，并在微信小程序后台配置全景网站的HTTPS业务域名。',showCancel:false})}
</script>
