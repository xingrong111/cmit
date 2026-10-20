<template>
  <AppShell>
    <view class="wc-page-intro">
      <text class="eyebrow">山河有迹 · 数字文创</text>
      <text class="wc-page-title">文创馆</text>
      <text class="muted">读人物、完成学习挑战，收藏属于自己的山河纪念。</text>
    </view>
    <!-- #ifdef H5 -->
    <view class="wc-module" :style="{height: frameHeight + 'px'}">
      <iframe ref="frame" :src="url" title="山河有迹文创馆" scrolling="no" @load="fitFrame"></iframe>
    </view>
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <view class="wc-native-link">
      <text>文创馆可在网页端查看、领取和保存数字作品。</text>
    </view>
    <!-- #endif -->
  </AppShell>
</template>
<script setup>
import {ref,onBeforeUnmount} from 'vue';
import {onLoad} from '@dcloudio/uni-app';
import AppShell from '../../components/AppShell.vue';
const frame=ref(null),frameHeight=ref(1100),url=ref('/modules/wenchuang/');
let observer;
onLoad(params=>{if(/^WC\d{3}$/.test(params?.id||''))url.value='/modules/wenchuang/#/detail/'+params.id;else if(params?.view==='collection')url.value='/modules/wenchuang/#/collection'});
function fitFrame(){
  // #ifdef H5
  observer?.disconnect();const doc=frame.value?.contentDocument;if(!doc?.body)return;
  doc.documentElement.style.overflow='hidden';doc.body.style.overflow='hidden';doc.body.classList.add('wc-embedded');
  const resize=()=>{const height=Math.ceil(doc.body.getBoundingClientRect().height)+8;if(height>0)frameHeight.value=height};
  observer=new ResizeObserver(resize);observer.observe(doc.body);resize();
  // #endif
}
onBeforeUnmount(()=>observer?.disconnect());
</script>
<style scoped>
.wc-page-intro{display:flex;flex-direction:column;gap:10px;padding:26px 30px 20px;border:1px solid #e6d5b9;border-radius:20px;background:rgba(255,251,243,.88);margin-bottom:20px}
.wc-page-title{font-family:serif;color:#304b41;font-size:42px;line-height:1.25}.wc-module{width:100%;min-height:600px}.wc-module iframe{display:block;width:100%;height:100%;border:0}.wc-native-link{padding:24px;color:#304b41;background:#fffaf2;border-radius:16px}
@media(max-width:600px){.wc-page-intro{padding:20px}.wc-page-title{font-size:34px}}
</style>
