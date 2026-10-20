<template><AppShell>
 <view class="qs-cover">
  <view class="qs-cover-copy">
   <text class="eyebrow">使用指南 / QUICK START</text>
   <text class="page-title">跟着做一遍，比读说明更快。</text>
   <text class="muted">三步上手，再按兴趣出发。不需要登录，也不会打断你的浏览。</text>
  </view>
  <view class="qs-cover-progress"><text class="qs-count">{{doneCount}}<text class="qs-count-total"> / 3</text></text><text class="small">{{allDone?'上手完成':'已完成的步骤'}}</text></view>
 </view>

 <view class="section-heading"><view><text class="eyebrow">01 / 上手三步</text><text class="section-title">读人物、查依据、问小迹</text></view></view>
 <view class="qs-steps">
  <view v-for="s in steps" :key="s.id" class="qs-step" :class="{done:!!tasks[s.id],next:s.id===nextId}">
   <text class="qs-no">{{tasks[s.id]?'✓':s.no}}</text>
   <view class="qs-step-copy"><text class="qs-step-title">{{s.title}}</text><text class="qs-step-text">{{s.copy}}</text></view>
   <button class="qs-step-go" :class="{primary:s.id===nextId}" @tap="go(s.page,s.params||{})">{{tasks[s.id]?'再看看':s.button}}</button>
  </view>
 </view>

 <view class="section-heading"><view><text class="eyebrow">02 / 按目标选路径</text><text class="section-title">你现在想做什么？</text></view></view>
 <view class="qs-paths">
  <view v-for="p in paths" :key="p.title" class="qs-path">
   <image :src="'/static/icons/'+p.icon+'.png'" aria-hidden="true"/>
   <view class="qs-path-copy"><text class="qs-path-title">{{p.title}}</text><text class="qs-path-text">{{p.copy}}</text></view>
   <button class="qs-path-go" @tap="go(p.page,p.params||{})">{{p.button}} ↗</button>
  </view>
 </view>
 <view class="qs-story"><text>想体验一个完整的互动故事？</text><button class="text-button" @tap="go('story')">进入江姐互动故事 ↗</button></view>

 <view class="section-heading"><view><text class="eyebrow">03 / 遇到疑问，再来这里</text><text class="section-title">常见的几个问题</text></view></view>
 <view class="qs-faq"><view v-for="(item,i) in questions" :key="item.q" class="qs-faq-item"><button :aria-expanded="opened===i" @tap="opened=opened===i?-1:i"><text>{{item.q}}</text><text>{{opened===i?'−':'＋'}}</text></button><text v-if="opened===i" class="qs-faq-answer">{{item.a}}</text></view></view>

 <view class="qs-bottom">
  <text class="small">新手提示只出现一次。想重新体验，可以清空进度。</text>
  <view class="qs-bottom-actions"><button class="outline" @tap="restart">重新开始新手提示</button><button class="outline" @tap="go('home')">回到首页</button></view>
 </view>
</AppShell></template>
<script setup>
import {ref,computed} from 'vue';
import AppShell from '../../components/AppShell.vue';
import {go} from '../../lib/navigation.js';
import {onboard,doneCount,allDone,resetOnboard} from '../../lib/新手任务.js';
import {steps,paths,questions} from '../../data/使用指南.js';
const opened=ref(0);
const tasks=computed(()=>onboard.value.tasks);
const nextId=computed(()=>steps.find(s=>!tasks.value[s.id])?.id||'');
function restart(){resetOnboard();uni.showToast({title:'已重置，回到首页可看到上手三步',icon:'none'})}
</script>
