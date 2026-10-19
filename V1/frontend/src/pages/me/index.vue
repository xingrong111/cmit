<template>
  <AppShell>
    <view class="my-space">
      <view class="my-cover">
        <image class="my-cover-art" src="/static/青绿山水.jpg" mode="aspectFill"/>
        <view class="page-heading"><text class="eyebrow">我的阅读 / READING ROOM</text><text class="page-title"><text class="my-title-line">让读过的故事，</text><text class="my-title-line">留在这里</text></text><text class="muted">本机书签、最近阅读与字号偏好。可游客阅读；登录账户的本机记录分开保存。</text></view>
        <text class="my-cover-seal">阅过山河</text>
        <view class="my-reading-stats"><view><text class="my-stat-number">{{saved.length}}</text><text>珍藏书签</text></view><view><text class="my-stat-number">{{recent.length}}</text><text>最近阅读</text></view><view><text class="my-stat-number my-stat-word">{{size==='large'?'大字':'标准'}}</text><text>阅读字号</text></view></view>
      </view>
      <view class="account-overview"><view><text class="eyebrow">我的空间 / MY JOURNEY</text><text class="section-title">常用功能</text><text class="small">学习、交流与账户管理，从这里继续。</text></view></view>
      <view class="account-menu">
        <button @tap="go('learning')"><image class="menu-feature-icon" src="/static/icons/learning.png" aria-hidden="true"/><view><text>学习挑战</text><text class="small">回顾进度，继续学习</text></view><text>↗</text></button>
        <button @tap="goHonors"><image class="menu-feature-icon" src="/static/icons/learning.png" aria-hidden="true"/><view><text>荣誉称号</text><text class="small">查看已获得与下一目标</text></view><text>↗</text></button>
        <button @tap="go('my-comments')"><image class="menu-feature-icon" src="/static/icons/comment.png" aria-hidden="true"/><view><text>我的评论</text><text class="small">查看审核状态与反馈</text></view><text>↗</text></button>
        <button @tap="go('account')"><image class="menu-feature-icon" src="/static/icons/account.png" aria-hidden="true"/><view><text>账户管理</text><text class="small">登录、注册与账户设置</text></view><text>↗</text></button>
        <button @tap="openGuide"><image class="menu-feature-icon" src="/static/icons/home.png"/><view><text>使用指南</text><text class="small">了解功能，重新导览</text></view><text>↗</text></button>
      </view>
      <view class="reader-layout">
        <view class="reading-collection">
          <view class="section-heading compact"><view><text class="eyebrow">BOOKMARKS</text><text class="section-title">我的书签</text></view><text class="small">{{saved.length}} 段阅读</text></view>
          <view class="reading-list"><button v-for="row in saved" :key="row.kind+row.id" @tap="go(row.kind,{id:row.id})"><view><text class="tag">{{row.kind==='person'?'人物':'事件'}}</text><text class="row-title">{{row.title}}</text></view><text>↗</text></button><view v-if="!saved.length" class="empty-paper"><text class="serif">把喜欢的片段，轻轻折一角</text><text class="muted">阅读人物或事件时，可添加本机书签。</text><button class="text-button" @tap="go('people')">去读一位人物 ↗</button></view></view>
          <view class="section-heading compact recent-heading"><view><text class="eyebrow">RECENTLY READ</text><text class="section-title">最近阅读</text></view><button class="recent-toggle" :aria-expanded="recentOpen" aria-controls="recent-reading-list" @tap="recentOpen=!recentOpen">{{recentOpen?'收起':'展开'}} {{recent.length}} 条 <text aria-hidden="true">{{recentOpen?'⌃':'⌄'}}</text></button></view>
          <view v-if="recentOpen" id="recent-reading-list" class="reading-list recent-list"><view v-if="recent.length" class="recent-tools"><text class="small">选择一条继续阅读</text><button class="text-button" @tap="clear">清空记录</button></view><button v-for="row in recent" :key="row.kind+row.id" @tap="go(row.kind,{id:row.id})"><view><text class="row-title">{{row.title}}</text><text class="small">{{row.kind==='person'?'人物档案':'历史片段'}}</text></view><text>↗</text></button><text v-if="!recent.length" class="muted">还没有阅读记录，故事从第一次打开开始。</text></view>
        </view>
        <view class="preference-card"><text class="eyebrow">阅读偏好</text><text class="block-title">让文字更适合你</text><text class="muted">调整全站正文、按钮与提示文字的字号。</text><view class="chips"><button :class="{active:size==='normal'}" @tap="change('normal')">标准字号</button><button :class="{active:size==='large'}" @tap="change('large')">大字号</button></view><text class="preference-sample" :class="{'reading-large':size==='large'}">山河有迹，史料为据。</text><view class="boundary-note"><text>书签和记录不会上传服务器，清除应用数据后可能丢失。本机内容已按账户隔离，暂不支持跨设备同步。</text></view></view>
      </view>
    </view>
  </AppShell>
</template>
<script setup>
import {ref} from 'vue';
import {onShow} from '@dcloudio/uni-app';
import AppShell from '../../components/AppShell.vue';
import {go} from '../../lib/navigation.js';
import {history,bookmarks,prefs,setSize,clearHistory} from '../../lib/reading.js';
const saved=ref([]),recent=ref([]),size=ref('normal'),recentOpen=ref(false);
function refresh(){saved.value=bookmarks();recent.value=history();size.value=prefs().size;}
function change(value){setSize(value);size.value=value;}
function clear(){uni.showModal({title:'清空本机阅读记录',content:'书签会保留，最近阅读记录将被清空。',success:r=>{if(r.confirm){clearHistory();refresh();}}});}
function openGuide(){go('guide');}
function goHonors(){
  // #ifdef MP-WEIXIN
  uni.navigateTo({url:'/pages/honors/honors'});
  // #endif
  // #ifdef H5
  go('learning',{view:'honors'});
  // #endif
}
onShow(refresh);
</script>
<style scoped>
.recent-heading{align-items:center}.recent-toggle{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:auto;min-height:44px;padding:8px 14px;margin:0;border:1px solid #c7a166;border-radius:10px;background:#fffcf5;color:#9c3029;font-size:14px;line-height:1.5}.recent-toggle:after{border:0}.recent-toggle text{font-size:19px;line-height:1}.recent-tools{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0}.recent-tools .text-button{width:auto;min-height:40px;margin:0}.recent-list{padding-bottom:12px}
@media(max-width:600px){.recent-heading{gap:8px}.recent-toggle{min-width:104px;flex-shrink:0;font-size:13px}.recent-tools{flex-wrap:wrap}}
</style>
