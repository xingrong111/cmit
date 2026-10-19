<template><view class="app-shell" :class="{'global-large':fontSize==='large'}"><view class="masthead"><view class="brand" @tap="go('home')"><text class="seal">迹</text><view><text class="brand-title">山河有迹</text><text class="brand-sub">循迹 · 读人 · 见史</text></view></view><view class="desktop-nav"><button v-for="item in links" :key="item.page" :class="{'nav-current':active===item.page}" @tap="go(item.page)"><image class="desktop-nav-icon" :src="'/static/icons/'+item.icon+'.png'" aria-hidden="true"/>{{item.title}}</button></view><text class="edition">山河有迹 · 合并预览</text></view><view class="shell-body"><view v-if="active && active!=='home'" class="page-return"><button @tap="backOr(parentPage)">‹ 返回上一页</button><text>{{parentLabel}}</text></view><slot/></view><view class="site-note"><text>山河为卷，史料为据</text><text>已核片段持续整理 · 山水为艺术化装饰</text></view></view></template>
<script setup>
import {ref,computed,onMounted,onBeforeUnmount} from 'vue';import {onShow} from '@dcloudio/uni-app';import {go,backOr} from '../lib/navigation.js'
import {prefs} from '../lib/reading.js'
const fontSize=ref(prefs().size);
function refreshFont(){fontSize.value=prefs().size;
// #ifdef H5
applyDocumentFont(document);document.querySelectorAll('iframe').forEach(f=>{try{if(f.contentDocument?.head)applyDocumentFont(f.contentDocument)}catch{}});
// #endif
}
// #ifdef H5
function applyDocumentFont(doc){doc.documentElement.classList.toggle('global-large',fontSize.value==='large');if(!doc.getElementById('global-reading-font')){const link=doc.createElement('link');link.id='global-reading-font';link.rel='stylesheet';link.href='/static/全局字号.css';doc.head.append(link);}}
const boundFrames=new Set();let fontObserver;
onMounted(()=>{const bind=()=>{document.querySelectorAll('iframe').forEach(f=>{if(!boundFrames.has(f)){boundFrames.add(f);f.addEventListener('load',refreshFont)}});refreshFont()};fontObserver=new MutationObserver(bind);fontObserver.observe(document.querySelector('.app-shell'),{childList:true,subtree:true});bind()});
// #endif
uni.$on('yingji:font-size',refreshFont);onBeforeUnmount(()=>{uni.$off('yingji:font-size',refreshFont);
// #ifdef H5
fontObserver?.disconnect();boundFrames.forEach(f=>f.removeEventListener('load',refreshFont));
// #endif
});
const active=ref(''),links=[{page:'home',icon:'home',title:'首页'},{page:'people',icon:'people',title:'人物'},{page:'timeline',icon:'timeline',title:'长卷'},{page:'radar',icon:'pin',title:'足迹'},{page:'assistant',icon:'assistant',title:'小迹'},{page:'learning',icon:'learning',title:'学习'},{page:'me',icon:'bookmark',title:'我的'}]
const parentPage=computed(()=>({ip:'people',person:'people',registry:'people',province:'home',event:'timeline',graph:'people',sources:'people',source:'radar',place:'radar',route:'radar',account:'me',admin:'me','my-comments':'me',discussion:'people',privacy:'me',statistics:'home'}[active.value]||'home'))
const parentLabel=computed(()=>({people:'人物索引',home:'山河首页',timeline:'时间长卷',radar:'历史足迹',me:'我的'}[parentPage.value])+' · 直接打开时返回此处')
onShow(()=>{refreshFont();active.value=getCurrentPages().slice(-1)[0]?.route?.split('/')[1]||''})
</script>

<style scoped>
.page-return{display:flex;align-items:center;gap:14px;margin:0 0 18px;padding:8px 0;border-bottom:1px solid #e8dcc8}.page-return button{margin:0;padding:7px 12px;font-size:14px;line-height:1.5;color:#982b28;background:#f7efdf;border-radius:8px;min-height:36px}.page-return button:after{border:0}.page-return text{font-size:11px;color:#93836c}@media(max-width:600px){.page-return{margin-bottom:12px}.page-return text{display:none}}
</style>
