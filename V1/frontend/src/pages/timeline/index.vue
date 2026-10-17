<template><AppShell>
 <view class="page-heading"><text class="eyebrow">山河长卷 / CHRONICLES</text><text class="page-title">循着年代，走进人生</text><text class="muted">按人物与年代展开史料，保留来源中的日期精度。</text></view>
 <view class="timeline-filters"><view class="person-picker"><text class="eyebrow">选择人物</text><picker :range="personOptions" range-key="name" :value="selected" @change="select"><view class="picker-button">{{personOptions[selected]?.name||'全部人物'}} <text>⌄</text></view></picker></view><view class="chips"><button v-for="s in stages" :key="s" :class="{active:stage===s}" @tap="stage=s">{{s}}</button></view><button class="text-button" @tap="list=!list">{{list?'长卷视图':'简洁列表'}} ⇄</button></view>
 <StatePanel v-if="loading||error" :loading="loading" :error="error" @retry="load"/>
 <template v-else><view class="list-summary"><text>{{items.length}} 个阅读片段</text><text>按明确年份排序 · 不等同完整生平</text></view>
 <view v-if="groups.length" class="decade-nav"><text class="small">跳至年代</text><button v-for="g in groups" :key="g.key" @tap="jump(g.key)">{{g.key}}年代</button></view>
 <view v-for="g in groups" :key="g.key" :id="'timeline-year-'+g.key" class="decade-group"><button class="decade-heading" :aria-expanded="!folded[g.key]" @tap="folded[g.key]=!folded[g.key]"><text>{{g.key}}年代</text><text>{{g.items.length}} 个片段 {{folded[g.key]?'＋':'−'}}</text></button><view v-if="!folded[g.key]" class="timeline-scroll" :class="{list}"><view v-for="(e,i) in g.items" :key="e.id" class="timeline-entry" :class="{alternate:i%2===1}"><view class="timeline-year"><text>{{e.sort_year}}</text><text class="timeline-dot"/></view><view class="timeline-card" @tap="go('event',{id:e.id})"><view class="card-date"><text>{{e.date_text}}</text><text>{{e.person_name}}</text></view><text class="timeline-title">{{e.title}}</text><text class="timeline-summary">{{e.summary}}</text><view class="card-foot"><text>{{e.stage}}</text><text>阅读片段 ↗</text></view></view></view></view></view>
 <StatePanel v-if="!items.length" title="该阶段暂无确定日期片段" message="可切换人物或阶段，其他资料仍可在事实与来源中阅读。"/></template>
 </AppShell></template>
<script setup>
import {ref,computed,watch,nextTick} from 'vue';import {onLoad,onShow,onHide,onUnload,onShareAppMessage} from '@dcloudio/uni-app';import AppShell from '../../components/AppShell.vue';import StatePanel from '../../components/StatePanel.vue';import {api} from '../../lib/api.js';import {go} from '../../lib/navigation.js'
const personOptions=ref([{id:'',name:'全部人物'}]),selected=ref(0),stage=ref('全部'),stages=['全部','早年求索','时代风云','革命实践','信念与传承'],list=ref(false),items=ref([]),loading=ref(true),error=ref(''),folded=ref({});let sequence=0,initial=null,initialized=false,booting=false
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
function jump(key){folded.value[key]=false;nextTick(()=>uni.pageScrollTo({selector:'#timeline-year-'+key,duration:220}))}
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
onUnload(()=>{
 // #ifdef H5
 window.removeEventListener('hashchange',routeChanged)
 // #endif
})
onShow(async()=>{if(booting)return;booting=true;try{if(personOptions.value.length===1){const data=await api('people',{limit:100});personOptions.value=[{id:'',name:'全部人物'},...data.items]}const pending=uni.getStorageSync('yingji:timeline-person');uni.removeStorageSync('yingji:timeline-person');const target=reloadContext()||urlContext()||initial||(pending&&typeof pending==='object'?pending:null)||(!initialized?uni.getStorageSync('yingji:timeline-view'):null);initial=null;if(target){const found=personOptions.value.findIndex(p=>p.id===(target.person_id||''));if(found<0)throw new Error('该人物尚未接入阅读档案，请从人物索引重新选择');selected.value=found;stage.value=stages.includes(target.stage)?target.stage:'全部';if(typeof target.list==='boolean')list.value=target.list}initialized=true;await load();saveView()}catch(e){error.value=e.message;loading.value=false}finally{booting=false}})
watch([selected,stage],()=>{if(initialized&&!booting){folded.value={};saveView();load()}});watch(list,saveView);onHide(saveView)
onShareAppMessage(()=>({title:'山河有迹 · 山河长卷',path:'/pages/timeline/index?person_id='+encodeURIComponent(current().person_id)+'&stage='+encodeURIComponent(stage.value)+'&view='+(list.value?'list':'scroll')}))
</script>
