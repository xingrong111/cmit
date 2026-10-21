<template><AppShell>
<view class="page-heading"><text class="eyebrow">山河长卷 / CHRONICLES</text><text class="page-title">沿着时间，读懂一个人</text><text class="muted">一段人生，与时代相连。每个片段保留资料中的日期与出处。</text></view>
<view class="chronicle-controls"><view class="person-picker"><text class="eyebrow">正在阅读</text><picker :range="personOptions" range-key="name" :value="selected" @change="select"><view class="picker-button">{{chosen?.name||'选择人物'}} <text>⌄</text></view></picker></view><view class="chronicle-view-switch"><button :class="{active:!list}" :aria-pressed="!list" @tap="list=false">故事长卷</button><button :class="{active:list}" :aria-pressed="list" @tap="list=true">简明年表</button></view></view>
<StatePanel v-if="loading||error" :loading="loading" :error="error" @retry="load"/>
<template v-else><view class="chronicle-person"><view v-if="photo" class="chronicle-portrait"><image :src="photo.src" mode="aspectFit"/><text>{{photo.shortCaption||'人物资料配图'}}</text></view><view class="chronicle-intro"><text class="eyebrow">{{chosen?.id?'人物独立长卷':'跨人物年代总览'}}</text><text class="chronicle-name">{{chosen?.name}}</text><text class="chronicle-bio">{{chosen?.bio||'将已收录的事件放回年代中，对照人物与时代阅读。总览只显示已有明确年份的片段。'}}</text><view class="chronicle-stats"><text>{{spanText}}</text><text>{{items.length}} 个片段</text><text>{{sourceCount}} 份引用来源</text></view><button v-if="chosen?.id" class="text-button" @tap="go('person',{id:chosen.id})">人物档案 ↗</button></view></view>
<scroll-view scroll-x class="chronicle-stage-scroll"><view class="chips chronicle-stages"><button v-for="s in stages" :key="s" :class="{active:stage===s}" @tap="stage=s">{{s}}</button></view></scroll-view>
<view v-if="groups.length" class="chronicle-decades"><text class="small">年代定位</text><scroll-view scroll-x class="decade-track"><view class="decade-buttons"><button v-for="g in groups" :key="g.key" :class="{active:activeDecade===g.key}" @tap="jump(g.key)">{{g.key}}<text>年代</text></button></view></scroll-view><text class="chronicle-count">{{items.length}} 个片段</text></view>
<text class="chronicle-boundary">展示范围为当前已收录片段，不等同完整生平；同年条目排列不表示已确定月日先后。</text>
<view :class="['chronicle-body',{'is-compact':list}]"><view v-for="g in groups" :key="g.key" :id="'timeline-year-'+g.key" class="decade-group"><button class="chronicle-decade-title" :aria-expanded="!folded[g.key]" @tap="folded[g.key]=!folded[g.key]"><view><text class="decade-numeral">{{g.key}}</text><text>年代 · {{g.items.length}} 个片段</text></view><text>{{folded[g.key]?'展开 ＋':'收起 −'}}</text></button>
<view v-if="!folded[g.key]" class="chronicle-axis"><view v-for="(e,i) in g.items" :key="e.id" :class="['chronicle-entry',{right:items.indexOf(e)%2===1,spotlight:i===0}]"><view class="chronicle-year"><text>{{e.sort_year}}</text><text class="chronicle-dot"/></view><view v-if="!list && timelinePhotos[e.id]" class="chronicle-photo" :style="{backgroundColor:timelinePhotos[e.id].background}"><image :src="timelinePhotos[e.id].src" mode="aspectFit" :aria-label="timelinePhotos[e.id].label" :alt="timelinePhotos[e.id].label" lazy-load/></view><view class="chronicle-card"><view class="chronicle-card-top"><text class="chronicle-date">{{e.date_text}}</text><text class="chronicle-stage">{{e.stage}}</text></view><text v-if="!chosen?.id" class="chronicle-person-label">{{e.person_name}}</text><text class="chronicle-event-title">{{e.title}}</text><text class="chronicle-summary">{{e.summary}}</text><view class="chronicle-card-actions"><button class="chronicle-read" @tap="go('event',{id:e.id})">阅读片段 <text>↗</text></button><button v-if="e.source_ids?.length" class="chronicle-source" @tap="sourceId=e.source_ids[0]">查看出处</button></view></view></view></view></view></view>
<StatePanel v-if="!items.length" title="该阶段暂无确定日期片段" message="可切换人物或阶段，其他资料仍可在事实与来源中阅读。"/><view v-else class="chronicle-end"><text>卷有尽处，阅读未止。</text><button v-if="chosen?.id" class="text-button" @tap="go('sources',{id:chosen.id})">继续查阅人物来源 ↗</button><button v-else class="text-button" @tap="go('people')">走近人物档案 ↗</button></view></template>
<SourceSheet :source-id="sourceId" @close="sourceId=''"/>
</AppShell></template>
<script setup>
import timelinePhotos from '../../data/长卷事件配图.json';
import {ref,computed,watch,nextTick} from 'vue';import {onLoad,onShow,onHide,onUnload,onShareAppMessage,onPageScroll} from '@dcloudio/uni-app';import AppShell from '../../components/AppShell.vue';import StatePanel from '../../components/StatePanel.vue';import {api} from '../../lib/api.js';import {go} from '../../lib/navigation.js';import SourceSheet from '../../components/SourceSheet.vue';import portraits from '../../data/人物肖像.json';import {accountKey} from '../../lib/storage.js'
const personOptions=ref([{id:'',name:'跨人物总览'}]),selected=ref(0),stage=ref('全部'),stages=['全部','早年求索','时代风云','革命实践','信念与传承'],list=ref(false),items=ref([]),loading=ref(true),error=ref(''),folded=ref({});let sequence=0,initial=null,initialized=false,booting=false
const activeDecade=ref(null),sourceId=ref('');let scrollTop=0,scrollTimer=0;
const chosen=computed(()=>personOptions.value[selected.value]),photo=computed(()=>{const p=portraits[chosen.value?.id];return p?.identityVerified&&(p.rightsApproved||p.displayApproved)?p:null});
const sourceCount=computed(()=>new Set(items.value.flatMap(e=>e.source_ids||[])).size);
const spanText=computed(()=>{const years=items.value.map(e=>e.sort_year).filter(Number.isFinite);return years.length?Math.min(...years)+'—'+Math.max(...years):'暂无年代片段'});
function savePosition(){if(initialized)uni.setStorageSync(accountKey('yingji:timeline-scroll'),{...current(),top:scrollTop,folded:folded.value})}
async function restorePosition(){const saved=uni.getStorageSync(accountKey('yingji:timeline-scroll'));if(saved&&saved.person_id===current().person_id&&saved.stage===stage.value&&saved.list===list.value){folded.value=saved.folded||{};await nextTick();uni.pageScrollTo({scrollTop:Number(saved.top)||0,duration:0})}}
onPageScroll(e=>{scrollTop=e.scrollTop;if(scrollTimer)return;scrollTimer=setTimeout(()=>{scrollTimer=0;uni.createSelectorQuery().selectAll('.decade-group').boundingClientRect(rects=>{if(!rects?.length)return;const visible=rects.filter(x=>x.top<=150);activeDecade.value=groups.value[(visible.length?visible.length:1)-1]?.key}).exec()},140)});
const groups=computed(()=>{const result=[];for(const e of items.value){const key=Math.floor(e.sort_year/10)*10;let g=result.find(x=>x.key===key);if(!g){g={key,items:[]};result.push(g)}g.items.push(e)}return result})
function current(){return {person_id:personOptions.value[selected.value]?.id||'',stage:stage.value,list:list.value}}
function saveView(){uni.setStorageSync('yingji:timeline-view',current())}
function reloadContext(){
 // #ifdef H5
 if(!initialized&&performance.getEntriesByType('navigation')[0]?.type==='reload'){const saved=uni.getStorageSync('yingji:timeline-view'),url=urlContext();if(saved&&(!url||saved.person_id===url.person_id))return saved}
 // #endif
 return null
}
async function load(){const token=++sequence;loading.value=true;error.value='';try{const data=await api('timeline',{person_id:current().person_id,stage:stage.value==='全部'?'':stage.value,limit:100});if(token===sequence)items.value=data.items}catch(e){if(token===sequence)error.value=e.message}finally{if(token===sequence)loading.value=false}}
function select(e){selected.value=Number(e.detail.value)}
function jump(key){activeDecade.value=key;folded.value[key]=false;nextTick(()=>uni.pageScrollTo({selector:'#timeline-year-'+key,offsetTop:-100,duration:220}))}
function urlContext(){
 // #ifdef H5
 const [route,query]=location.hash.split('?');if(route==='#/pages/timeline/index'){const p=new URLSearchParams(query||'');if(p.has('person_id'))return {person_id:p.get('person_id')||'',stage:p.get('stage')||'全部',list:p.get('view')==='list'}}
 // #endif
 return null
}
function routeChanged(){if(!initialized||booting)return;const target=urlContext();if(!target)return;const found=personOptions.value.findIndex(p=>p.id===target.person_id);if(found<0){error.value='该人物尚未接入阅读档案，请从人物索引重新选择';return}selected.value=found;stage.value=stages.includes(target.stage)?target.stage:'全部';list.value=target.list;load()}
onLoad(o=>{if(Object.prototype.hasOwnProperty.call(o,'person_id'))initial={person_id:o.person_id,stage:o.stage,list:o.view==='list'}
 // #ifdef H5
 window.addEventListener('hashchange',routeChanged)
 // #endif
})
onUnload(()=>{savePosition();clearTimeout(scrollTimer);
 // #ifdef H5
 window.removeEventListener('hashchange',routeChanged)
 // #endif
})
onShow(async()=>{if(booting)return;booting=true;try{if(personOptions.value.length===1){const data=await api('people',{limit:100});personOptions.value=[{id:'',name:'跨人物总览'},...data.items]}const pending=uni.getStorageSync('yingji:timeline-person');uni.removeStorageSync('yingji:timeline-person');const target=reloadContext()||urlContext()||initial||(pending&&typeof pending==='object'?pending:null)||(!initialized?uni.getStorageSync('yingji:timeline-view'):null);initial=null;if(target){const found=personOptions.value.findIndex(p=>p.id===(target.person_id||''));if(found<0)throw new Error('该人物尚未接入阅读档案，请从人物索引重新选择');selected.value=found;stage.value=stages.includes(target.stage)?target.stage:'全部';if(typeof target.list==='boolean')list.value=target.list}if(!target&&selected.value===0&&personOptions.value.length>1)selected.value=1;initialized=true;await load();saveView();await restorePosition()}catch(e){error.value=e.message;loading.value=false}finally{booting=false}})
watch([selected,stage],()=>{if(initialized&&!booting){folded.value={};activeDecade.value=null;scrollTop=0;saveView();load()}});watch(list,saveView);onHide(()=>{saveView();savePosition()})
onShareAppMessage(()=>({title:'山河有迹 · 山河长卷',path:'/pages/timeline/index?person_id='+encodeURIComponent(current().person_id)+'&stage='+encodeURIComponent(stage.value)+'&view='+(list.value?'list':'scroll')}))
</script>
