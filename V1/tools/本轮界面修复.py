from pathlib import Path
import json
r=Path(__file__).resolve().parents[1]
backup=r/'docs/界面修复前备份'
def update(relative,fn):
 p=r/relative;old=p.read_text(encoding='utf-8-sig');new=fn(old)
 if new!=old:
  b=backup/relative;b.parent.mkdir(parents=True,exist_ok=True)
  if not b.exists():b.write_text(old,encoding='utf-8')
  p.write_text(new,encoding='utf-8')
timeline='''<template><AppShell>
 <view class="page-heading"><text class="eyebrow">山河长卷 / CHRONICLES</text><text class="page-title">循着年代，走进人生</text><text class="muted">按人物与年代展开史料，保留来源中的日期精度。</text></view>
 <view class="timeline-filters"><view class="person-picker"><text class="eyebrow">选择人物</text><picker :range="personOptions" range-key="name" :value="selected" @change="select"><view class="picker-button">{{personOptions[selected]?.name||'全部人物'}} <text>⌄</text></view></picker></view><view class="chips"><button v-for="s in stages" :key="s" :class="{active:stage===s}" @tap="stage=s">{{s}}</button></view><button class="text-button" @tap="list=!list">{{list?'长卷视图':'简洁列表'}} ⇄</button></view>
 <StatePanel v-if="loading||error" :loading="loading" :error="error" @retry="load"/>
 <template v-else><view class="list-summary"><text>{{items.length}} 个阅读片段</text><text>按明确年份排序 · 不等同完整生平</text></view>
 <view v-if="groups.length" class="decade-nav"><text class="small">跳至年代</text><button v-for="g in groups" :key="g.key" @tap="jump(g.key)">{{g.key}}年代</button></view>
 <view v-for="g in groups" :key="g.key" :id="'timeline-year-'+g.key" class="decade-group"><button class="decade-heading" :aria-expanded="!folded[g.key]" @tap="folded[g.key]=!folded[g.key]"><text>{{g.key}}年代</text><text>{{g.items.length}} 个片段 {{folded[g.key]?'＋':'−'}}</text></button><view v-if="!folded[g.key]" class="timeline-scroll" :class="{list}"><view v-for="(e,i) in g.items" :key="e.id" class="timeline-entry" :class="{alternate:i%2===1}"><view class="timeline-year"><text>{{e.sort_year}}</text><text class="timeline-dot"/></view><view class="timeline-card" @tap="go('event',{id:e.id})"><view class="card-date"><text>{{e.date_text}}</text><text>{{e.person_name}}</text></view><text class="timeline-title">{{e.title}}</text><text class="timeline-summary">{{e.summary}}</text><view class="card-foot"><text>{{e.stage}}</text><text>阅读片段 ↗</text></view></view></view></view></view>
 <StatePanel v-if="!items.length" title="该阶段暂无确定日期片段" message="可切换人物或阶段，其他资料仍可在事实与来源中阅读。"/></template>
 </AppShell></template>
<script setup>
import {ref,computed,watch,nextTick} from 'vue';import {onLoad,onShow,onHide,onShareAppMessage} from '@dcloudio/uni-app';import AppShell from '../../components/AppShell.vue';import StatePanel from '../../components/StatePanel.vue';import {api} from '../../lib/api.js';import {go} from '../../lib/navigation.js'
const personOptions=ref([{id:'',name:'全部人物'}]),selected=ref(0),stage=ref('全部'),stages=['全部','早年求索','时代风云','革命实践','信念与传承'],list=ref(false),items=ref([]),loading=ref(true),error=ref(''),folded=ref({});let sequence=0,initial=null,initialized=false,booting=false
const groups=computed(()=>{const result=[];for(const e of items.value){const key=Math.floor(e.sort_year/10)*10;let g=result.find(x=>x.key===key);if(!g){g={key,items:[]};result.push(g)}g.items.push(e)}return result})
function current(){return {person_id:personOptions.value[selected.value]?.id||'',stage:stage.value,list:list.value}}
function saveView(){uni.setStorageSync('yingji:timeline-view',current())}
async function load(){const token=++sequence;loading.value=true;error.value='';try{const data=await api('timeline',{person_id:current().person_id,stage:stage.value==='全部'?'':stage.value,limit:100});if(token===sequence)items.value=data.items}catch(e){if(token===sequence)error.value=e.message}finally{if(token===sequence)loading.value=false}}
function select(e){selected.value=Number(e.detail.value)}
function jump(key){folded.value[key]=false;nextTick(()=>uni.pageScrollTo({selector:'#timeline-year-'+key,duration:220}))}
onLoad(o=>{if(Object.prototype.hasOwnProperty.call(o,'person_id'))initial={person_id:o.person_id,stage:o.stage,list:o.view==='list'}})
onShow(async()=>{if(booting)return;booting=true;try{if(personOptions.value.length===1){const data=await api('people',{limit:100});personOptions.value=[{id:'',name:'全部人物'},...data.items]}const pending=uni.getStorageSync('yingji:timeline-person');uni.removeStorageSync('yingji:timeline-person');const target=initial||(pending&&typeof pending==='object'?pending:null)||(!initialized?uni.getStorageSync('yingji:timeline-view'):null);initial=null;if(target){const found=personOptions.value.findIndex(p=>p.id===(target.person_id||''));if(found<0)throw new Error('该人物尚未接入阅读档案，请从人物索引重新选择');selected.value=found;stage.value=stages.includes(target.stage)?target.stage:'全部';if(typeof target.list==='boolean')list.value=target.list}initialized=true;await load();saveView()}catch(e){error.value=e.message;loading.value=false}finally{booting=false}})
watch([selected,stage],()=>{if(initialized&&!booting){folded.value={};saveView();load()}});watch(list,saveView);onHide(saveView)
onShareAppMessage(()=>({title:'山河有迹 · 山河长卷',path:'/pages/timeline/index?person_id='+encodeURIComponent(current().person_id)+'&stage='+encodeURIComponent(stage.value)+'&view='+(list.value?'list':'scroll')}))
</script>
'''
update('frontend/src/pages/timeline/index.vue',lambda s:s if 'decade-group' in s else timeline)
def me(s):
 if 'account-overview' in s:return s
 a=s.index('<view class="card"><text class="section-title">账户与学习交流');b=s.index('<view class="reader-layout">',a)
 s=s[:a]+'''<view class="account-overview"><view><text class="eyebrow">我的空间 / MY JOURNEY</text><text class="section-title">阅读有记录，学习有回响</text><text class="small">书签与历史保存在本机；学习进度和评论随账户保存。</text></view><button class="primary" @tap="go('account')">账户管理 ↗</button></view><view class="account-menu"><button @tap="go('learning')"><text class="menu-symbol">学</text><view><text>学习挑战与称号</text><text class="small">回顾进度，继续学习</text></view><text>↗</text></button><button @tap="go('my-comments')"><text class="menu-symbol">言</text><view><text>我的评论</text><text class="small">查看审核状态与反馈</text></view><text>↗</text></button><button @tap="go('account')"><text class="menu-symbol">人</text><view><text>账户与权限</text><text class="small">登录、注册与审核入口</text></view><text>↗</text></button></view>'''+s[b:]
 return s
update('frontend/src/pages/me/index.vue',me)
def person(s):
 if 'reading-chapters' in s:return s
 s=s.replace('<view class="detail-layout">','<view class="reading-chapters"><button @tap="section(\'person-intro\')">人物概览</button><button @tap="section(\'person-chronicle\')">生平片段</button><button @tap="section(\'person-evidence\')">史料依据</button><button @tap="section(\'person-next\')">继续循迹</button></view><view class="detail-layout">',1)
 s=s.replace('<view class="section-heading compact"><view><text class="eyebrow">01','<view id="person-intro" class="section-heading compact"><view><text class="eyebrow">01',1).replace('<view class="section-heading compact"><view><text class="eyebrow">02','<view id="person-chronicle" class="section-heading compact"><view><text class="eyebrow">02',1).replace('<view class="section-heading compact"><view><text class="eyebrow">03','<view id="person-evidence" class="section-heading compact"><view><text class="eyebrow">03',1).replace('<view class="next-actions">','<view id="person-next" class="next-actions">',1)
 s=s.replace('function save(){','function section(id){uni.pageScrollTo({selector:\'#\'+id,duration:220})}\nfunction save(){')
 return s.replace("+' · 英迹'","+' · 山河有迹'")
update('frontend/src/pages/person/index.vue',person)
def graph(s):
 if 'const measured=ref(false)' in s:return s
 s=s.replace('<view class="graph-grid" />','<view class="graph-grid"/><view v-if="!measured" class="graph-loading">正在展开人物关系…</view>')
 s=s.replace('class="graph-stage" :style="stageStyle"','class="graph-stage" :class="{\'graph-ready\':measured}" :style="stageStyle"')
 s=s.replace('const scale = ref(0.5)','const measured=ref(false)\nconst scale = ref(0.5)')
 s=s.replace('onMounted, ref, watch','onMounted, onBeforeUnmount, ref, watch')
 s=s.replace('function measure() {\n  nextTick', 'function measure() {\n  measured.value=false\n  nextTick')
 s=s.replace('    resetView()\n  }).exec())','    resetView();measured.value=true\n  }).exec())')
 s=s.replace('onMounted(measure)','onMounted(()=>{measure();uni.onWindowResize(measure)})\nonBeforeUnmount(()=>uni.offWindowResize(measure))')
 s=s.replace('.relation-graph {','.graph-stage{opacity:0}.graph-stage.graph-ready{opacity:1}.graph-loading{position:absolute;inset:0;z-index:4;background:var(--paper);display:flex;align-items:center;justify-content:center;color:var(--muted)}\n.relation-graph {',1)
 return s
update('frontend/src/components/RelationGraph.vue',graph)
def guide(s):
 if "screen.classList.toggle('has-conversation'" in s:return s
 s=s.replace("真实地图需浏览器地图Key；地图终点为场馆附近，开放与预约单独确认。","导航终点为场馆附近；开放与预约请以场馆最新公告为准。")
 s=s.replace("  const welcome=screen.querySelector('.guide-welcome');","  const welcome=screen.querySelector('.guide-welcome');\n  if(welcome){const heading=welcome.querySelector('h3,.heading');if(heading)heading.textContent='小迹陪你循迹';}\n  screen.classList.toggle('has-conversation',state.messages.length>0);")
 return s
update('services/guide/web/app.js',guide)
update('services/guide/preview/app.js',lambda s:s.replace('英迹 · 山河英雄谱','山河有迹').replace('你好，我是小迹','小迹陪你循迹'))
update('services/guide/miniprogram/pages/assistant/index.wxml',lambda s:s.replace('AI导览助手','小迹导览').replace('你好，我是小迹','小迹陪你循迹'))
for p in (r/'services/guide/miniprogram/pages').glob('*/index.wxml'):
 update(str(p.relative_to(r)),lambda s:s.replace('英迹 · 山河英雄谱','山河有迹'))
print('本轮页面结构修复已应用')
