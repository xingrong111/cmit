<template>
  <AppShell>
    <view class="my-space">
      <view class="my-cover">
        <image class="my-cover-art" src="/static/青绿山水.jpg" mode="aspectFill"/>
        <view class="page-heading"><text class="eyebrow">我的阅读 / READING ROOM</text><text class="page-title"><text class="my-title-line">让读过的故事，</text><text class="my-title-line">留在这里</text></text></view>
        <text class="my-cover-seal">阅过山河</text>
        <view class="my-reading-stats"><view><text class="my-stat-number">{{saved.length}}</text><text>珍藏书签</text></view><view><text class="my-stat-number">{{recent.length}}</text><text>最近阅读</text></view><view><text class="my-stat-number my-stat-word">{{size==='large'?'大字':'标准'}}</text><text>阅读字号</text></view></view>
      </view>
      <AccountSection @change="refresh"/><view class="account-overview">
        <view class="journey-heading"><text class="eyebrow">我的旅程 / MY JOURNEY</text><text class="section-title">继续探索</text></view>
        <view class="journey-intro"><text class="small">从学习挑战出发，回看获得的荣誉，收藏喜欢的山河故事。</text></view>
      </view>
      <view class="account-menu journey-menu">
        <button @tap="go('learning')"><image class="menu-feature-icon" src="/static/icons/learning.png" aria-hidden="true"/><view><text>学习挑战</text><text class="small">回顾进度，继续学习</text></view><text>↗</text></button>
        <button @tap="goHonors"><image class="menu-feature-icon" src="/static/icons/learning.png" aria-hidden="true"/><view><text>荣誉称号</text><text class="small">查看已获得与下一目标</text></view><text>↗</text></button>
        <button @tap="go('wenchuang')"><image class="menu-feature-icon" src="/static/icons/bookmark.png" aria-hidden="true"/><view><text>数字文创馆</text><text class="small">解锁作品，领取与查看收藏</text></view><text>↗</text></button>
      </view>
      <view class="utility-heading"><text class="eyebrow">ACCOUNT & HELP</text><text>账户与帮助</text></view>
      <view class="account-menu utility-menu">
        <button @tap="go('my-comments')"><image class="menu-feature-icon" src="/static/icons/comment.png" aria-hidden="true"/><view><text>我的评论</text><text class="small">查看审核状态与反馈</text></view><text>↗</text></button>

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
</template><script setup>
import {ref} from 'vue';
import {onShow} from '@dcloudio/uni-app';
import AppShell from '../../components/AppShell.vue';
import AccountSection from '../../components/AccountSection.vue';
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
.my-space .my-cover{padding:40px 44px 30px;border-color:#d8c39e;background:linear-gradient(110deg,#fff8ec 0%,#f4e9d4 72%,#e8dfca 100%)}
.my-space .my-cover .page-heading{max-width:66%}
.my-space .my-cover .eyebrow,.my-space .account-overview .eyebrow,.utility-heading .eyebrow{font-size:12px;letter-spacing:.13em;color:#9b693f}
.my-space .my-cover .page-title{font-size:38px;line-height:1.42;font-weight:600;letter-spacing:.025em;margin:12px 0}
.my-space .my-cover .muted{font-size:15px;line-height:1.8;max-width:560px;color:#655544}
.my-space .my-reading-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;max-width:655px;margin-top:28px;padding:0;border:0;background:transparent}
.my-space .my-reading-stats>view{display:flex;align-items:baseline;justify-content:flex-start;gap:9px;padding:13px 16px!important;border:1px solid #e0d0b5!important;border-radius:10px;background:#fffaf1e8}
.my-space .my-reading-stats text{font-size:13px;color:#735f4a}
.my-space .my-reading-stats .my-stat-number{font-size:29px;font-weight:600;color:#982b28}
.my-space .account-overview{margin-top:38px;padding-bottom:17px}
.my-space .account-overview .section-title{font-size:29px;line-height:1.4;margin:6px 0}
.my-space .account-overview .small{font-size:14px;line-height:1.75}
.my-space .journey-menu,.my-space .utility-menu{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.my-space .journey-menu{margin-bottom:24px}
.my-space .journey-menu button{position:relative;display:grid;grid-template-columns:52px minmax(0,1fr) auto;align-items:center;gap:15px!important;min-height:146px;padding:23px 21px!important;border-radius:16px;overflow:hidden}
.my-space .journey-menu button:before{content:'';position:absolute;inset:0 auto 0 0;width:4px;background:#ad7145}
.my-space .journey-menu button:first-child:before{background:#436457}
.my-space .journey-menu button:nth-child(2):before{background:#ae8a48}
.my-space .journey-menu .menu-feature-icon{width:36px;height:36px;padding:9px;border-radius:13px}
.my-space .journey-menu button>view>text:first-child{font-size:21px;font-weight:600;line-height:1.45}
.my-space .journey-menu .small{font-size:13px;line-height:1.6;margin-top:7px}
.utility-heading{display:flex;align-items:baseline;gap:13px;margin:14px 0 15px;padding-bottom:10px;border-bottom:1px solid #dcccaf}
.utility-heading>text:last-child{font:21px/1.4 STSong,SimSun,serif;color:#354d43}
.my-space .utility-menu{margin-bottom:34px}
.my-space .utility-menu button{min-height:88px;padding:16px 19px!important;border-radius:12px;box-shadow:none}
.my-space .utility-menu .menu-feature-icon{width:27px;height:27px;padding:7px;border-radius:9px}
.my-space .utility-menu button>view>text:first-child{font-size:17px;font-weight:600}
.my-space .utility-menu .small{font-size:12px;margin-top:2px}
.my-space .reader-layout{grid-template-columns:minmax(0,1.55fr) minmax(300px,1fr);gap:20px}
.my-space .reading-collection,.my-space .preference-card{padding:28px;border-radius:16px;border:1px solid #ddc9aa;box-shadow:0 8px 26px #6b51300a}
.my-space .reading-collection .section-heading .section-title,.my-space .preference-card .block-title{font-size:25px;font-weight:600}
.my-space .section-heading .eyebrow,.my-space .preference-card .eyebrow{font-size:11px;letter-spacing:.11em}
.my-space .reading-list>button{min-height:68px;padding:14px 8px;border-bottom-color:#e2d4bb}
.my-space .reading-list>button .row-title{font-size:18px;font-weight:600}
.my-space .reading-list>button .small,.my-space .reading-list>.muted{font-size:13px}
.my-space .empty-paper .serif{font-size:21px;font-weight:600}
.my-space .empty-paper .muted,.my-space .preference-card .muted{font-size:14px}
.my-space .preference-card{background:#f7f0e2}
.my-space .preference-card .chips button{font-size:14px;min-height:45px}
.my-space .preference-sample{font-size:21px;padding:20px 12px}
.my-space .boundary-note{font-size:12px;line-height:1.75}
.recent-heading{align-items:center}.recent-toggle{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:auto;min-height:42px;padding:7px 13px;margin:0;border:1px solid #d9c5a4;border-radius:9px;background:#fffaf1;color:#982b28;font-size:14px;font-weight:600;line-height:1.5}.recent-toggle:after{border:0}.recent-toggle text{font-size:18px;line-height:1}.recent-tools{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0}.recent-tools .text-button{width:auto;min-height:40px;margin:0}.recent-list{padding-bottom:12px}
.my-space .account-overview{display:grid;grid-template-columns:minmax(220px,auto) minmax(0,1fr);align-items:end;gap:24px;min-height:0;margin:38px 0 20px;padding:0 2px 16px!important;border:0!important;border-bottom:1px solid #bca37e!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
.my-space .account-overview>view{min-width:0;flex:none}
.my-space .journey-heading{padding-left:15px;border-left:4px solid #982b28}
.my-space .journey-heading .eyebrow{font-size:12px;line-height:1.4;color:#896944;letter-spacing:.11em}
.my-space .journey-heading .section-title{font-size:31px;line-height:1.35;margin:5px 0 0;color:#2e493f;white-space:nowrap}
.my-space .journey-intro{justify-self:end;max-width:490px;padding-bottom:2px;text-align:right}
.my-space .journey-intro .small{font-size:15px;line-height:1.7;color:#67533f}
@media(max-width:980px){.my-space .journey-menu,.my-space .utility-menu{grid-template-columns:repeat(2,minmax(0,1fr))}.my-space .reader-layout{grid-template-columns:1fr}}
@media(max-width:700px){.my-space .account-overview{grid-template-columns:1fr;gap:7px;margin:29px 0 18px;padding-bottom:13px!important}.my-space .journey-heading .section-title{font-size:26px}.my-space .journey-intro{justify-self:start;max-width:none;padding-left:19px;text-align:left}.my-space .journey-intro .small{font-size:13px}}
@media(max-width:600px){.my-space .my-cover{padding:25px 21px 22px}.my-space .my-cover .page-heading{max-width:100%}.my-space .my-cover .page-title{font-size:29px}.my-space .my-cover .muted{font-size:13px;max-width:93%}.my-space .my-reading-stats{gap:6px;margin-top:22px}.my-space .my-reading-stats>view{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:9px 8px!important}.my-space .my-reading-stats .my-stat-number{font-size:24px}.my-space .my-reading-stats .my-stat-word{font-size:17px}.my-space .my-reading-stats text{font-size:10px}.my-space .journey-menu,.my-space .utility-menu{grid-template-columns:1fr;gap:10px}.my-space .journey-menu button{min-height:95px;padding:17px!important;grid-template-columns:44px minmax(0,1fr) auto}.my-space .journey-menu .menu-feature-icon{width:29px;height:29px;padding:7px}.my-space .journey-menu button>view>text:first-child{font-size:19px}.my-space .journey-menu .small{font-size:12px;margin-top:3px}.my-space .utility-menu button{min-height:72px;padding:13px 16px!important}.my-space .reading-collection,.my-space .preference-card{padding:21px 19px}.my-space .reading-collection .section-heading .section-title,.my-space .preference-card .block-title{font-size:22px}.recent-heading{gap:8px}.recent-toggle{min-width:104px;flex-shrink:0;font-size:13px}.recent-tools{flex-wrap:wrap}}
</style>
