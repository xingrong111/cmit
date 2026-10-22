<template>
 <view v-if="visible" class="entry-gate" role="dialog" aria-modal="true" aria-label="欢迎来到山河有迹">
  <view class="entry-layout">
   <view class="entry-intro"><image class="entry-logo" src="/static/山河有迹Logo.png" mode="aspectFit"/><text class="entry-brand">山河有迹</text><text class="entry-title">循山河，读人物</text><text class="entry-description">让历史走近生活，<br/>让每一次探索留下印记。</text><text class="entry-motto">循迹 · 读人 · 见史</text></view>
   <view class="entry-panel"><text class="entry-welcome">欢迎来到山河有迹</text><text class="entry-caption">登录或注册，开启你的山河之旅</text><AccountSection :entry="true" @authenticated="enter"/><view class="entry-divider"><text>也可以先看看</text></view><button class="entry-guest" @tap="guest">以游客身份浏览 →</button><text class="entry-guest-note">游客可浏览人物、长卷与历史足迹；评论、领取文创等功能需登录。</text></view>
  </view>
 </view>
</template>
<script setup>
import {ref,onMounted,onBeforeUnmount} from 'vue';
import {onShow} from '@dcloudio/uni-app';
import AccountSection from './AccountSection.vue';
import {go} from '../lib/navigation.js';
const visible=ref(!sessionStorage.getItem('yingji:entry-choice')&&!localStorage.getItem('yingji_token'));
function display(value){visible.value=value;document.documentElement.classList.toggle('entry-open',value);}
function enter(){sessionStorage.setItem('yingji:entry-choice','member');display(false);go('home');}
function guest(){sessionStorage.setItem('yingji:entry-choice','guest');display(false);go('home');}
function requireEntry(){sessionStorage.removeItem('yingji:entry-choice');display(true);}
async function verify(){
 const token=localStorage.getItem('yingji_token');
 if(!token){if(sessionStorage.getItem('yingji:entry-choice')!=='guest')requireEntry();return;}
 try{const response=await fetch('/api/account/me',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(8000)});if(localStorage.getItem('yingji_token')!==token)return;if(response.status===401){localStorage.removeItem('yingji_token');localStorage.removeItem('yingji_user_id');requireEntry();}else if(response.ok){const data=await response.json();if(!data.user){localStorage.removeItem('yingji_token');localStorage.removeItem('yingji_user_id');requireEntry();}}}catch{/* An existing session remains usable while the network recovers. */}
}
onShow(()=>{display(!localStorage.getItem('yingji_token')&&sessionStorage.getItem('yingji:entry-choice')!=='guest');verify();});
onMounted(()=>{display(visible.value);window.addEventListener('yingji:entry-required',requireEntry);});
onBeforeUnmount(()=>{window.removeEventListener('yingji:entry-required',requireEntry);document.documentElement.classList.remove('entry-open');});
</script>
