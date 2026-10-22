<template>
 <view v-if="text&&!seen" class="page-tip" role="note">
  <text class="page-tip-tag">小提示</text>
  <text class="page-tip-text">{{text}}</text>
  <button class="page-tip-close" aria-label="关闭提示" @tap="dismissTip(page)">知道了</button>
 </view>
</template>
<script setup>
import {computed} from 'vue';
import {onboard,dismissTip} from '../lib/新手任务.js';
import {pageTips} from '../data/使用指南.js';
const props=defineProps({page:{type:String,default:''}});
const text=computed(()=>pageTips[props.page]||'');
const seen=computed(()=>!!onboard.value.tips[props.page]);
</script>
<style>
.page-tip{display:flex;align-items:center;gap:12px;margin:0 0 16px;padding:9px 12px 9px 14px;background:#f6f1e3;border:1px solid #e6dbc3;border-radius:10px}
.page-tip-tag{flex-shrink:0;padding:2px 8px;font-size:12px;line-height:1.6;color:#982b28;background:#fffaf1;border:1px solid #e0cba4;border-radius:6px}
.page-tip-text{flex:1;min-width:0;font-size:13px;line-height:1.7;color:#534433}
.page-tip-close{margin:0;flex-shrink:0;min-height:30px;padding:3px 10px;font-size:12px;line-height:1.6;color:#6d5b45;background:transparent;border:0}
.page-tip-close:after{border:0}
@media(max-width:600px){.page-tip{align-items:flex-start;flex-wrap:wrap;gap:6px 10px}.page-tip-text{flex-basis:calc(100% - 70px)}.page-tip-close{margin-left:auto}}
</style>
