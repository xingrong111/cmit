<template>
 <view v-if="show" class="onboard-card" role="region" aria-label="新手上手三步">
  <view class="onboard-head">
   <view class="onboard-title">
    <text class="onboard-eyebrow">{{allDone?'上手完成':'第一次来？三步上手'}}</text>
    <text class="onboard-sub">{{allDone?'你已经走完一遍主线，接下来按兴趣继续探索。':'不用先读说明，跟着做一遍就会了。'}}</text>
   </view>
   <view class="onboard-progress" :aria-label="'已完成 '+doneCount+' / 3'"><view class="onboard-bar"><view :style="{width:(doneCount/3*100)+'%'}"/></view><text>{{doneCount}} / 3</text></view>
   <view class="onboard-actions">
    <button class="onboard-link" @tap="go('guide')">使用指南 ↗</button>
    <button class="onboard-close" aria-label="关闭上手提示" @tap="close">{{allDone?'完成':'不再提示'}}</button>
   </view>
  </view>
  <view v-if="!allDone" class="onboard-steps">
   <view v-for="s in steps" :key="s.id" class="onboard-step" :class="{done:!!tasks[s.id],next:s.id===nextId}">
    <text class="onboard-no">{{tasks[s.id]?'✓':s.no}}</text>
    <view class="onboard-copy"><text class="onboard-step-title">{{s.title}}</text></view>
    <button class="onboard-go" :class="{primary:s.id===nextId}" @tap="go(s.page,s.params||{})">{{tasks[s.id]?'再看看':s.button}}</button>
   </view>
  </view>
  <view v-else class="onboard-next">
   <button @tap="go('learning')">试一次学习挑战</button>
   <button @tap="go('radar')">看看历史足迹</button>
  </view>
 </view>
</template>
<script setup>
import {computed} from 'vue';
import {go} from '../lib/navigation.js';
import {onboard,doneCount,allDone,closeTaskCard} from '../lib/新手任务.js';
import {steps} from '../data/使用指南.js';
const tasks=computed(()=>onboard.value.tasks);
const show=computed(()=>!onboard.value.cardClosed);
const nextId=computed(()=>steps.find(s=>!tasks.value[s.id])?.id||'');
function close(){closeTaskCard()}
</script>
<style>
.onboard-card{margin:0 0 22px;padding:16px 20px;background:#f6f1e3;border:1px solid #e1d5bb;border-radius:14px;display:flex;flex-direction:column;gap:14px}
.onboard-head{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.onboard-title{display:flex;flex-direction:column;gap:3px;flex:1;min-width:200px}
.onboard-eyebrow{font:18px/1.5 STSong,SimSun,serif;color:#354d43}
.onboard-sub{font-size:13px;line-height:1.6;color:#6d5b45}
.onboard-progress{display:flex;align-items:center;gap:10px;font-size:12px;color:#6d5b45}
.onboard-bar{width:96px;height:6px;border-radius:6px;background:#e4d9c2;overflow:hidden}
.onboard-bar>view{height:100%;background:#982b28;border-radius:6px;transition:width .25s ease}
.onboard-actions{display:flex;align-items:center;gap:8px}
.onboard-link,.onboard-close{margin:0;min-height:34px;padding:5px 12px;font-size:13px;line-height:1.5;border-radius:8px}
.onboard-link{color:#982b28;background:#fffaf1;border:1px solid #d6bf94}
.onboard-close{color:#6d5b45;background:transparent;border:0}
.onboard-link:after,.onboard-close:after,.onboard-go:after,.onboard-next>button:after{border:0}
.onboard-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.onboard-step{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fffaf1;border:1px solid #e8dcc4;border-radius:10px}
.onboard-step.next{border-color:#d6bf94;background:#fffdf6}
.onboard-no{width:24px;height:24px;flex-shrink:0;border-radius:50%;background:#ece6d3;color:#58705a;font-size:12px;line-height:24px;text-align:center}
.onboard-step.done .onboard-no{background:#61775d;color:#fffaf1}
.onboard-step.done .onboard-step-title{color:#7a6a55}
.onboard-copy{flex:1;min-width:0}
.onboard-step-title{display:block;font-size:14px;line-height:1.5;color:#354d43}
.onboard-go{margin:0;flex-shrink:0;min-height:32px;padding:4px 10px;font-size:12px;line-height:1.5;border-radius:8px;color:#6d5b45;background:#f4edde;border:1px solid #e4d6bd}
.onboard-go.primary{background:#982b28;border-color:#982b28;color:#fffaf1}
.onboard-next{display:flex;gap:10px;flex-wrap:wrap}
.onboard-next>button{margin:0;min-height:36px;padding:6px 14px;font-size:13px;border-radius:8px;color:#982b28;background:#fffaf1;border:1px solid #d6bf94}
@media(max-width:700px){.onboard-card{padding:14px;gap:12px}.onboard-steps{grid-template-columns:minmax(0,1fr)}.onboard-eyebrow{font-size:16px}.onboard-progress{order:3}.onboard-actions{margin-left:auto}}
</style>
