<template>
 <view id="my-account" class="my-account-section">
  <view v-if="!entry" class="section-heading"><view><text class="eyebrow">ACCOUNT / 我的账户</text><text class="section-title">{{user?'你好，'+user.nickname:'让每次学习，都留下印记'}}</text></view><text v-if="user" class="account-role" :class="user.role==='admin'?'admin':'reader'">{{user.role==='admin'?'小迹管理员':'山河读者'}}</text></view>
  <template v-if="user">
   <view class="account-identity"><ThemedAvatar class="account-avatar account-landscape-avatar" :avatar-key="user.avatarKey||user.nickname"/><view class="account-identity-copy"><text class="muted">{{user.email}}</text><text class="account-permission-note">{{user.role==='admin'?'管理评论审核、处理反馈，维护有据可循的交流空间。':'发表评论、查看审核反馈，继续你的阅读与学习之旅。'}}</text></view></view><view v-if="metrics.length" class="account-metrics"><view v-for="item in metrics" :key="item.label" class="account-metric"><text class="account-metric-number">{{item.value}}</text><text class="account-metric-label">{{item.label}}</text></view></view>
   <view class="my-account-actions"><button v-if="user.role==='admin'" class="primary" @tap="go('admin')">进入评论审核工作台</button><button class="outline" @tap="go('my-comments')">我的评论</button><button class="outline" @tap="logout">退出登录</button></view>
  </template>
  <template v-else>
   <view class="account-tabs"><button :class="{active:mode==='login'}" @tap="mode='login';error=''">邮箱登录</button><button :class="{active:mode==='register'}" @tap="mode='register';error=''">邮箱注册</button></view>
   <text v-if="!entry" class="muted">普通用户可学习、评论和领取文创；管理员登录后会显示审核入口。</text>
   <view class="account-form">
    <label v-if="mode==='register'">昵称<input v-model="form.nickname" maxlength="20" placeholder="2—20字的昵称"/></label>
    <label>邮箱<input v-model="form.email" type="text" inputmode="email" placeholder="请输入邮箱"/></label>
    <label v-if="mode==='register'">邮箱验证码<view class="code-field"><input v-model="form.code" type="number" maxlength="6" placeholder="6位验证码"/><button class="outline" :disabled="sending||countdown>0" @tap="sendCode">{{sending?'发送中…':countdown>0?countdown+'秒后重发':'获取验证码'}}</button></view></label>
    <label>密码<input v-model="form.password" :password="true" maxlength="128" placeholder="至少8位密码"/></label>
    <label v-if="mode==='register'">确认密码<input v-model="form.confirm" :password="true" maxlength="128" placeholder="再次输入密码"/></label>
    <label v-if="mode==='register'" class="agreement-row"><switch :checked="form.agreement" @change="form.agreement=$event.detail.value" color="#354d43"/><text>我同意账户保存邮箱、密码哈希、昵称及学习记录。验证码仅用于验证邮箱所有权。</text></label>
    <text v-if="error" class="account-error" role="alert">{{error}}</text><text v-if="notice" class="account-notice" role="status">{{notice}}</text>
    <button class="primary auth-submit" :disabled="busy||sending" @tap="submit">{{busy?'处理中…':mode==='register'?'验证邮箱并注册':'登录'}}</button>
    <text v-if="mode==='register'" class="small">验证码5分钟内有效。管理员资格由服务端指定，不开放自行选择。</text>
   </view>
  </template>
 </view>
</template>
<script setup>
import {ref,reactive,watch,onBeforeUnmount} from 'vue';
import {onShow} from '@dcloudio/uni-app';
import {go} from '../lib/navigation.js';
import ThemedAvatar from './ThemedAvatar.vue';
defineProps({entry:{type:Boolean,default:false}});
const emit=defineEmits(['change','authenticated']);
const metrics=ref([]);
const user=ref(null),mode=ref('login'),error=ref(''),notice=ref(''),busy=ref(false),sending=ref(false),countdown=ref(0);
const form=reactive({email:'',nickname:'',password:'',confirm:'',code:'',agreement:false});let refreshSequence=0;let timer,returnTo='',codeSentTo='',codeSendFailed=false;
watch(()=>form.email,()=>{if(codeSentTo&&normalizedEmail()!==codeSentTo){form.code='';notice.value='邮箱已更改，请为当前邮箱重新获取验证码。';}});
function token(){return localStorage.getItem('yingji_token')||'';}
async function request(path,data){const r=await fetch('/api/account'+path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(token()?{Authorization:'Bearer '+token()}: {})},...(data?{body:JSON.stringify(data)}:{})});const d=await r.json();if(!r.ok)throw Error(d.error?.message||'请求失败，请重试。');return d;}
async function refresh(){
 // #ifdef H5
 const sequence=++refreshSequence,expectedToken=token();
 try{const data=await request('/me');if(sequence!==refreshSequence||token()!==expectedToken)return;user.value=data.user||null;if(!user.value){localStorage.removeItem('yingji_token');localStorage.removeItem('yingji_user_id');}}catch{if(sequence!==refreshSequence||token()!==expectedToken)return;user.value=null;}
 await refreshMetrics();
 const intent=uni.getStorageSync('yingji:account-intent')||JSON.parse(sessionStorage.getItem('yingji:auth-intent')||'null');sessionStorage.removeItem('yingji:auth-intent');if(intent){uni.removeStorageSync('yingji:account-intent');mode.value=intent.mode==='register'?'register':'login';returnTo=intent.returnTo||'';setTimeout(()=>document.querySelector('#my-account')?.scrollIntoView({block:'start',behavior:'smooth'}),150);}
 // #endif
}
async function refreshMetrics(){
 metrics.value=[];if(!user.value)return;
 try{if(user.value.role==='admin'){const d=await request('/admin/dashboard');metrics.value=[{label:'处理中评论',value:d.commentCounts.pending},{label:'已公开评论',value:d.commentCounts.approved},{label:'退回修改',value:d.commentCounts.rejected},{label:'已隐藏评论',value:d.commentCounts.hidden}];}
 else{const d=await request('/my/comments');metrics.value=[{label:'我的评论',value:d.items.length},{label:'处理中',value:d.items.filter(x=>x.status==='pending').length},{label:'已公开',value:d.items.filter(x=>x.status==='approved').length},{label:'需要修改',value:d.items.filter(x=>['rejected','hidden'].includes(x.status)).length}];}}catch{metrics.value=[];}
}
function normalizedEmail(){return form.email.trim().toLowerCase();}
async function sendCode(){
 if(sending.value||countdown.value)return;error.value='';notice.value='';const email=normalizedEmail();
 if(!/^\S+@\S+\.\S+$/.test(email)){error.value='请先填写有效邮箱。';return;}
 sending.value=true;form.code='';codeSendFailed=false;
 try{const d=await request('/auth/email-code',{email});codeSentTo=email;notice.value='验证码已发送至 '+email+'，请使用该邮箱最新一封邮件中的验证码。';countdown.value=d.retryAfter||60;clearInterval(timer);timer=setInterval(()=>{if(--countdown.value<=0)clearInterval(timer);},1000);}
 catch(e){codeSendFailed=true;codeSentTo='';error.value=e.message+' 本次未发送成功，请核对邮箱地址后重新获取。';}
 finally{sending.value=false;}
}
async function submit(){
 if(busy.value)return;error.value='';notice.value='';
 if(!/^\S+@\S+\.\S+$/.test(normalizedEmail())){error.value='请输入有效邮箱。';return;}
 if(form.password.length<8){error.value='密码至少8位。';return;}
 if(mode.value==='register'){
  if(sending.value){error.value='验证码正在发送，请稍候。';return;}
  if(codeSendFailed){error.value='本次验证码未发送成功，请核对邮箱地址并重新获取。';return;}
  if(codeSentTo&&normalizedEmail()!==codeSentTo){error.value='验证码发送至 '+codeSentTo+'，与当前邮箱不一致，请重新获取。';return;}
  if(form.nickname.trim().length<2){error.value='昵称应为2—20字。';return;}
  if(!/^\d{6}$/.test(form.code)){error.value='请输入邮箱收到的6位验证码。';return;}
  if(form.password!==form.confirm){error.value='两次输入的密码不一致。';return;}
  if(!form.agreement){error.value='请先同意账户数据说明。';return;}
 }
 busy.value=true;
 try{
  if(mode.value==='register')await request('/auth/register',{email:normalizedEmail(),nickname:form.nickname.trim(),password:form.password,emailCode:form.code,agreementAccepted:true});
  const d=await request('/auth/login',{email:normalizedEmail(),password:form.password});refreshSequence++;localStorage.setItem('yingji_token',d.token);localStorage.setItem('yingji_user_id',d.user.id);user.value=d.user;await refreshMetrics();form.password='';form.confirm='';form.code='';emit('change');uni.$emit('yingji:account-change');
  emit('authenticated');
  if(returnTo==='learning'){returnTo='';go('learning');}else if(returnTo==='wenchuang'){returnTo='';go('wenchuang');}
 }catch(e){error.value=e.message;}finally{busy.value=false;}
}
async function logout(){refreshSequence++;try{await request('/auth/logout',{});}finally{localStorage.removeItem('yingji_token');localStorage.removeItem('yingji_user_id');user.value=null;metrics.value=[];sessionStorage.removeItem('yingji:entry-choice');emit('change');uni.$emit('yingji:account-change');window.dispatchEvent(new Event('yingji:entry-required'));}}
onShow(refresh);uni.$on('yingji:account-change',refresh);onBeforeUnmount(()=>{clearInterval(timer);uni.$off('yingji:account-change',refresh);});
</script>
<style scoped>
.my-account-section{padding:30px;margin:24px 0;border:1px solid #d8c5a5;border-radius:16px;background:#fffaf2;scroll-margin-top:120px}.account-tabs{display:flex;gap:12px;margin:18px 0}.account-tabs button{margin:0;border:1px solid #d8c5a5;border-radius:10px;padding:10px 24px;font-size:18px;background:#f7f0e3;color:#354d43}.account-tabs .active{background:#354d43;color:#fffaf1}.account-form{max-width:620px;display:grid;gap:18px;margin-top:24px}.account-form label{display:flex;flex-direction:column;gap:9px;font-size:18px;font-weight:700;color:#354d43}.account-form input{padding:12px 14px;min-height:28px;background:#fffef9;border:1px solid #d7c7ad;border-radius:9px;font-size:18px;font-weight:400}.code-field{display:flex;gap:12px;align-items:stretch}.code-field input{flex:1;min-width:0}.code-field button{margin:0;flex:none;font-size:17px;padding:8px 16px}.account-form .agreement-row{flex-direction:row;align-items:flex-start;font-size:15px;line-height:1.8;font-weight:400;gap:10px}.agreement-row switch{transform:scale(.75);transform-origin:top left;flex:none;margin-right:-8px}.auth-submit{margin:0;min-height:50px;font-size:19px;font-weight:700}.account-error{color:#982b28;font-size:17px;line-height:1.7}.account-notice{color:#354d43;font-size:16px;line-height:1.7}.account-role{padding:7px 14px;border:1px solid #baa371;border-radius:20px;color:#354d43;font-size:17px}.my-account-actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:22px}.my-account-actions button{margin:0;font-size:18px;padding:10px 22px}@media(max-width:650px){.my-account-section{padding:22px 18px}.code-field{gap:8px}.code-field button{font-size:15px;padding:8px 10px}.account-tabs button{flex:1;padding:10px}}
</style>
