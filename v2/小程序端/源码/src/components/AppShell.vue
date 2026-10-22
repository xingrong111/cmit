<template><view class="app-shell" :class="[{'global-large':fontSize==='large'},'reference-page reference-'+active]"><!-- #ifdef H5 --><EntryGate/><!-- #endif --><view class="masthead"><view class="brand" @tap="go('home')"><image class="brand-logo" src="/static/山河有迹Logo.png" mode="aspectFit" aria-label="山河有迹Logo"/><view><text class="brand-title">山河有迹</text><text class="brand-sub">循迹 · 读人 · 见史</text></view></view><view class="desktop-nav"><button v-for="item in links" :key="item.page" :class="{'nav-current':active===item.page}" @tap="go(item.page)"><image class="desktop-nav-icon" :src="'/static/icons/'+item.icon+'.png'" aria-hidden="true"/>{{item.title}}</button></view><text class="edition">山河有迹 · 合并预览</text></view><view class="shell-body"><view v-if="active && active!=='home'" class="page-return"><template v-if="active==='assistant'"><button class="crumb-link" @tap="go('home')">首页</button><text class="crumb-sep">›</text><text class="crumb-current">小迹</text></template><template v-else><button @tap="backOr(parentPage)">‹ 返回上一页</button><text>{{parentLabel}}</text></template></view><PageTip :page="active"/><slot/></view><PageCompanion corner="right" :copy="ballHint"/></view></template>
<script setup>
import {ref,computed,onMounted,onBeforeUnmount} from 'vue';import {onShow} from '@dcloudio/uni-app';import {go,backOr} from '../lib/navigation.js'
// #ifdef H5
import EntryGate from './EntryGate.vue'
// #endif
import {prefs} from '../lib/reading.js'
import {applyReadingFont} from '../lib/reading-font.js'
import PageCompanion from './页面小人物.vue'
import PageTip from './页面提示.vue'
import {onboard,markTask} from '../lib/新手任务.js'
const fontSize=ref(prefs().size);
function refreshFont(){fontSize.value=prefs().size;
// #ifdef H5
applyDocumentFont(document);document.querySelectorAll('iframe').forEach(f=>{try{if(f.contentDocument?.head)applyDocumentFont(f.contentDocument)}catch{}});
// #endif
}
// #ifdef H5
function applyDocumentFont(doc){doc.documentElement.style.setProperty('--page-cover-title',(window.innerWidth<=650?30:Math.min(48,Math.max(34,window.innerWidth*.027)))+'px');applyReadingFont(doc,fontSize.value==='large');if(!doc.getElementById('global-reading-font')){const link=doc.createElement('link');link.id='global-reading-font';link.rel='stylesheet';link.href='/static/全局字号.css';doc.head.append(link);}}
const boundFrames=new Set();let fontObserver;
onMounted(()=>{window.addEventListener('resize',refreshFont);const bind=()=>{document.querySelectorAll('iframe').forEach(f=>{if(!boundFrames.has(f)){boundFrames.add(f);f.addEventListener('load',refreshFont)}});refreshFont()};fontObserver=new MutationObserver(bind);fontObserver.observe(document.querySelector('.app-shell'),{childList:true,subtree:true});bind()});
// #endif
uni.$on('yingji:font-size',refreshFont);onBeforeUnmount(()=>{uni.$off('yingji:font-size',refreshFont);
// #ifdef H5
window.removeEventListener('resize',refreshFont);fontObserver?.disconnect();boundFrames.forEach(f=>f.removeEventListener('load',refreshFont));
// #endif
});
const active=ref(''),links=[{page:'home',icon:'home',title:'首页'},{page:'people',icon:'people',title:'人物'},{page:'timeline',icon:'timeline',title:'长卷'},{page:'radar',icon:'pin',title:'足迹'},{page:'assistant',icon:'assistant',title:'小迹'},{page:'learning',icon:'learning',title:'学习'},{page:'me',icon:'bookmark',title:'我的'}]
const parentPage=computed(()=>({ip:'people',person:'people',registry:'people',province:'home',event:'timeline',graph:'people',sources:'people',source:'radar',place:'radar',route:'radar',guide:'me',account:'me',admin:'me','my-comments':'me',discussion:'people',privacy:'me',statistics:'home',wenchuang:'me'}[active.value]||'home'))
const parentLabel=computed(()=>({people:'人物索引',home:'山河首页',timeline:'时间长卷',radar:'历史足迹',me:'我的'}[parentPage.value]||'山河首页'))
// 首次进入时在小迹圆球旁给一句轻提示；点开小迹或完成“问小迹”后不再出现
const ballHint=computed(()=>{const o=onboard.value;return o.cardClosed||o.tips.ball||o.tasks.ask?'':'第一次来？问问小迹'})
// 上手三步按真实行为自动打勾，不打断浏览
function trackTasks(){if(active.value==='person')markTask('person');if(active.value==='sources'||active.value==='source')markTask('source')}
// #ifdef H5
function onAsked(e){if(e.data&&e.data.type==='xiaoji:asked')markTask('ask')}
onMounted(()=>window.addEventListener('message',onAsked));onBeforeUnmount(()=>window.removeEventListener('message',onAsked));
// #endif
onShow(()=>{refreshFont();active.value=getCurrentPages().slice(-1)[0]?.route?.split('/')[1]||'';trackTasks()})
</script>

<style scoped>
.page-return{position:relative;z-index:80;display:flex;align-items:center;gap:10px;margin:0 0 18px;padding:8px 0;border-bottom:1px solid #e8dcc8}.page-return button{margin:0;padding:7px 12px;font-size:14px;line-height:1.5;color:#982b28;background:#f7efdf;border-radius:8px;min-height:36px}.page-return button:after{border:0}.page-return text{font-size:12px;line-height:1.5;color:#534433}.crumb-link{background:transparent!important;padding:0 2px!important;min-height:auto!important;color:#982b28}.crumb-sep{color:#8a7358;padding:0 2px}.crumb-current{color:#35281d;font-size:14px}@media(max-width:600px){.page-return{margin-bottom:12px}}
</style>

<style scoped>.brand-logo{display:block;width:64px;height:64px;flex-shrink:0;margin-right:16px}@media(max-width:650px){.brand-logo{width:44px;height:44px;margin-right:10px}}</style>
