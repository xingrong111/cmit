from pathlib import Path
import csv,json,re
r=Path(__file__).resolve().parents[1]
rows=list(csv.DictReader((r.parent/'output/第一部分审核/统计资料/02_人物逐条明细.csv').open(encoding='utf-8-sig')))
assert len(rows)==375 and len({x['人物编号'] for x in rows})==375
regions=json.loads((r/'frontend/src/data/省份目录.json').read_text(encoding='utf-8'))
codes={p['name']:p['code'] for p in regions}
records=[{'id':x['人物编号'],'name':x['姓名'],'aliases':[a for a in x['别名'].replace('、','/').split('/') if a],'provinceCode':codes.get(x['主归属省级地区'],''),'provinceName':x['主归属省级地区'],'originText':x['籍贯原文'],'birthText':x['出生年份'],'sourceId':x['来源编号'],'detailUrl':x['个人官方详情链接'],'status':'待独立核验'} for x in rows]
supplements=json.loads((r.parent/'output/256人重新核查/逐人核查记录.json').read_text(encoding='utf-8-sig'))
byid={x['记录编号']:x for x in supplements}
for item in records:
 extra=byid.get(item['id'])
 if not extra or extra.get('姓名')!=item['name']:continue
 if extra.get('分省归属') in codes:
  item['provinceName']=extra['分省归属'];item['provinceCode']=codes[extra['分省归属']]
 if extra.get('籍贯原文') not in ['',None,'待核验']:item['originText']=extra['籍贯原文']
 if extra.get('出生日期') not in ['',None,'待核验']:item['birthText']=extra['出生日期'];item['datePrecision']=extra.get('日期精度','')
 item['supplementEvidence']={k:extra.get(k,'') for k in ['状态','字段来源','补充来源列表','证据位置','原始链接','必要短摘录','访问日期']}
(r/'frontend/src/data/研究目录.json').write_text(json.dumps(records,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
# Only identities already in the reading service get detailed links; registry IDs remain separate.
content=json.loads((r/'services/reading/data/content.json').read_text(encoding='utf-8-sig'))
(r/'frontend/src/data/详细档案索引.json').write_text(json.dumps([{'id':p['id'],'name':p['name'],'aliases':p.get('aliases',[]),'province':p.get('province','待核'),'bio':p.get('bio','')} for p in content['people']],ensure_ascii=False,separators=(',',':')),encoding='utf-8')
p=r/'services/学习/public/app.js';s=p.read_text(encoding='utf-8')
s=s.replace("const view = document", "if(!/^(QQB|LYS|SZZ|LDY|JZY)$/.test(focusGroup))focusGroup='';\nconst view = document",1) if 'test(focusGroup)' not in s else s
if 'const focusedName=' not in s:s=s.replace('const progressGroups=focusGroup?',"const focusedName=groups.find(g=>hallView.items.some(x=>x.group===focusGroup&&x.person_name===g.name))?.name;\n  const progressGroups=focusGroup?",1)
s=s.replace("focusGroup&&visible.length?visible[0].name+' · 主题挑战'", "focusGroup&&focusedName?focusedName+' · 主题挑战'")
s=s.replace("const cards = (focusGroup ? hallView.items.filter(x=>x.group===focusGroup).map", "const cards = (focusGroup ? hallView.items.filter(x=>x.group===focusGroup).filter(x=>hallFilter==='done'?x.completed:hallFilter==='open'?!x.completed:true).map")
if 'class="learning-path"' not in s:s=s.replace('<div class="filters hall-filters">', '${!focusGroup?\'<div class="learning-path"><span>01 阅读人物</span><span>02 入门 · 5题</span><span>03 进阶 · 8题</span></div>\':\'\'}<div class="filters hall-filters">')
s=s.replace('先答完入门关，再开始本组进阶关。入门关抽 5 题，进阶关抽 8 题。题目仍是待核验。','循人物故事，理解历史。每组先完成入门5题，再解锁进阶8题；答完即完成，不设分数线。题目待独立核验。')
s=s.replace('回顾人物史料（保留本次答题）','回顾史料')
s=s.replace("${busy ? 'disabled' : ''}>${feedback ?", "${busy || (!feedback && !picked) ? 'disabled' : ''}>${feedback ?")
s=s.replace('<section class="card"><p class="tag">${escape(question.type)}</p>', '<div class="quiz-meter" aria-label="答题进度"><span style="width:${Math.round(question.index/attempt.total*100)}%"></span></div><section class="card quiz-card"><p class="tag">${escape(question.type)}</p>')
s=s.replace('未答完就返回，这次不记通关。','未答完可返回大厅续答，答完全部题目才记为完成。')
p.write_text(s,encoding='utf-8')
p=r/'services/学习/miniprogram/pages/learn/learn.js';s=p.read_text(encoding='utf-8').replace("allChallenges(){this.focusGroup='';this.paint();}","allChallenges(){this.focusGroup='';this.setData({filter:'all'});this.paint();}")
s=s.replace("stages:(this.levels||[]).filter(x=>x.group===this.focusGroup).map", "stages:(this.levels||[]).filter(x=>x.group===this.focusGroup).filter(x=>this.data.filter==='done'?x.completed:this.data.filter==='open'?!x.completed:true).map")
p.write_text(s,encoding='utf-8')
p=r/'services/学习/miniprogram/pages/learn/learn.wxml';s=p.read_text(encoding='utf-8').replace('先答完入门关，再开始本组进阶关。入门关抽 5 题，进阶关抽 8 题。题目仍是待核验。','循人物故事，理解历史。每组先完成入门5题，再解锁进阶8题；答完即完成，不设分数线。题目待独立核验。').replace('角色挑战','人物主题').replace('完成入门后解锁\' :','尚未解锁\' :')
if 'class="learning-path"' not in s:s=s.replace('<view class="section-head">','<view class="learning-path"><text>01 阅读人物</text><text>02 入门 · 5题</text><text>03 进阶 · 8题</text></view><view class="section-head">',1)
s=s.replace('wx:if="{{!visible.length}}"','wx:if="{{focusName ? !stages.length : !visible.length}}"')
p.write_text(s,encoding='utf-8')
p=r/'services/学习/miniprogram/pages/quiz/quiz.wxml';s=p.read_text(encoding='utf-8').replace('disabled="{{busy}}" bindtap="act"','disabled="{{busy || (!feedback && !picked)}}" bindtap="act"')
p.write_text(s,encoding='utf-8')
print('人物研究目录375条、详细档案索引及双端挑战流程已更新')
p=r/'frontend/src/pages/people/index.vue'
p.write_text('''<template><PeopleDirectory/></template>
<script setup>import PeopleDirectory from '../../components/人物目录.vue';import {onShareAppMessage} from '@dcloudio/uni-app';onShareAppMessage(()=>({title:'山河有迹 · 山河人物',path:'/pages/people/index'}));</script>
''',encoding='utf-8')
p=r/'frontend/src/pages/registry/index.vue';s=p.read_text(encoding='utf-8')
s=re.sub(r"(;import research from '../../data/研究目录.json')+",'',s)
s=s.replace("import {people} from '../../lib/全国收录.js'","import {people} from '../../lib/全国收录.js';import research from '../../data/研究目录.json'")
s=s.replace("person.value=people.find(p=>p.id===o.id)||null", "person.value=o.research==='1'?research.find(p=>p.id===o.id)||null:people.find(p=>p.id===o.id)||null")
s=re.sub(r"(?:person.birthText\?person.birthText\+'年':)+",'',s)
s=s.replace("person.birthYear?person.birthYear+'年':'未载'", "person.birthText|| (person.birthYear?person.birthYear+'年':'未载')")
s=s.replace('{{person.sourceLabel}}','{{person.sourceLabel || (person.sourceId ? \'来源线索：\'+person.sourceId : \'来源待补充\')}}')
p.write_text(s,encoding='utf-8')
