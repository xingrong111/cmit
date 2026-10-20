<template><view class="story-native">
<!-- #ifdef H5 -->
<iframe src="/vr/互动故事.html" title="针线里的黎明互动故事" class="story-frame" allow="fullscreen; autoplay"></iframe>
<!-- #endif -->
<!-- #ifndef H5 -->
<text class="story-title">针线里的黎明 · 文字阅读</text><text class="story-note">{{story.notice}}</text>
<view class="story-card"><text class="story-name">{{node.type==='dialogue'?story.speakers[node.speakerId]:'旁白'}} · 第{{state.act||1}}幕</text><scroll-view scroll-y class="story-copy" @scrolltolower="read"><text>{{node.text}}</text></scroll-view><button v-if="!state.read" @tap="read">已读完本段</button>
<button v-if="node.type==='hotspot'" :disabled="state.busy" @tap="controller.hotspot(node.triggerHotspotId)">{{node.actionLabel||node.text}}</button>
<button v-for="choice in node.choices" :key="choice.id" :disabled="state.busy||!state.read" @tap="controller.choose(choice.id)">{{choice.text}}</button>
<button v-if="node.nextId&&!['hotspot','choice'].includes(node.type)" :disabled="state.busy||!state.read" @tap="controller.next()">继续</button>
<button v-if="node.type==='ending'" :disabled="state.busy||!state.read||state.finished" @tap="controller.finish()">{{state.finished?'已完成阅读':'完成阅读'}}</button></view>
<view class="story-controls"><button :disabled="state.busy" @tap="voice.replay()">重听当前句</button><button @tap="toggleVoice">配音：{{voiceEnabled?'开':'关'}}</button><text class="story-note" role="status">{{voiceStatus}}</text><button :disabled="state.busy||!state.cursor" @tap="controller.previous()">上一句</button><button :disabled="state.busy" @tap="controller.skip()">跳过本段</button><button @tap="replay">重播第一幕</button><picker :range="history" range-key="label" @change="jump"><button>跳到已读段落</button></picker><button @tap="openPanorama">尝试全景网页版</button><button @tap="go('registry',{id:'IP-JZY-1'})">返回江竹筠资料</button><button @tap="go('learning',{group:'JZY'})">学习挑战</button><button @tap="go('story-sources')">内容与来源说明</button></view><text class="story-note" role="status">{{status}}</text>
<!-- #endif -->
</view></template>
<script setup>
import {ref,computed} from 'vue';import {onLoad,onShow,onHide,onUnload} from '@dcloudio/uni-app';import {story} from '../../story/剧情配置.mjs';import {StoryController} from '../../story/剧情控制.mjs';import {go} from '../../lib/navigation.js';
// #ifndef H5
import {createMiniVoice} from '../../story/小程序配音.mjs';
// #endif
const voiceEnabled=ref(true),voiceStatus=ref('');
const state=ref({}),node=ref(story.nodes[0]),status=ref('准备阅读……');let controller,account='guest';
const history=computed(()=>story.nodes.filter(n=>state.value.completed?.includes(n.id)).map(n=>({id:n.id,label:n.id+' '+n.text.slice(0,10)})));
// #ifndef H5
const voice=createMiniVoice({createAudio:()=>uni.createInnerAudioContext(),loadPackage:name=>new Promise((resolve,reject)=>wx.loadSubpackage({name,success:resolve,fail:reject})),onStatus:text=>voiceStatus.value=text});
function toggleVoice(){voiceEnabled.value=voice.toggle();}
const storage={getItem:key=>uni.getStorageSync(key)||null,setItem:(key,value)=>uni.setStorageSync(key,value)};
const view={loadScene:async()=>{voice.stop();return {status:'unavailable'};},enterTextMode(){},dispose(){voice.dispose();}};
const reader={render(n,s){node.value=n;state.value=s;voice.show(n);},update(s){state.value=s;},setBusy(b){state.value={...state.value,busy:b};},status(text){status.value=text;}};
function currentAccount(){return String(uni.getStorageSync('yingji:user-id')||'guest');}
onLoad(async()=>{account=currentAccount();controller=new StoryController({story,view,reader,storage,account});await controller.start();await controller.setMode('text');});
onShow(async()=>{voice.showPage();if(controller&&account!==currentAccount()){account=currentAccount();await controller.switchAccount(account);await controller.setMode('text');}});
onHide(()=>voice.hide());
onUnload(()=>controller?.dispose());
// #endif
function read(){controller?.markRead();}
function jump(e){const item=history.value[Number(e.detail.value)];if(item)controller.jumpTo(item.id);}
function replay(){uni.showModal({title:'重播第一幕',content:'将替换本账户在当前设备上的故事进度。',success:r=>{if(r.confirm)controller.replay().then(()=>controller.setMode('text'));}});}
function openPanorama(){go('panorama',{scene:'jzy'});}
</script>
<style scoped>.story-native{min-height:100vh;background:#f6efdf;color:#294638;padding:16px;box-sizing:border-box}.story-title{font:24px serif;display:block;margin:12px 0}.story-note{display:block;font-size:12px;line-height:1.8;margin:12px 0;color:#756b55}.story-card{border:1px solid #baa879;padding:18px;border-radius:12px;background:#fff9ed}.story-name{color:#973c32}.story-copy{height:220px;margin:14px 0;line-height:1.9}.story-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}button{font-size:14px;color:#294638;background:#f6efdf;border:1px solid #baa879;margin:5px 0;min-height:44px}.story-frame{position:fixed;inset:0;width:100%;height:100dvh;border:0}</style>
