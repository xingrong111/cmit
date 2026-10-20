from pathlib import Path
r=Path(__file__).resolve().parents[1]/'frontend/src'
replacements={
'三类名单合并去重，数字对应收录人物；待独立复核，不代表全国历史总人数。':'三类名单合并去重，数字对应本项目收录人物，不代表全国历史总人数。',
'地区待核 ↗':'未分省人物 ↗','待独立复核 · 按已记籍贯归类 · 待核地区单列':'按来源所记籍贯归类，未分省人物单列',
'地区待核人物也计入总数；不代表审核通过人数或历史总人数。':'未分省人物也计入总数；数字仅表示本项目收录范围。',
"label:'地区待核'":"label:'未分省人物'", "name:'地区待核'":"name:'未分省人物'",
"name:'地区待核'}].map":"name:'未分省人物'}].map",
"?'出生地域待核'":"?'出生地域未载'", "'出生地域待核':name":"'出生地域未载':name",
'按籍贯分省 · 待核验':'按来源所记籍贯分省',"'出生年待补'":"'出生日期未载'",
'有争议的单列待核，不与籍贯混用。':'未载明的单列展示，不与籍贯混用。',
'位收录人物 · 待独立复核':'位收录人物','资料名单 · 非审核通过名单':'按姓名查看资料',
"p.originText||'待补充'":"p.originText||'未载'",'资料包记录 · 待独立复核':'本项目收录条目',
"'来源待补充'":"'来源未载'",'来源线索不等于已经核到名录原件；正式统计仍需独立复核。':'来源正文与字段含义请结合查看。',
'当前条目没有直接来源网址，暂保留资料线索，待补充。':'当前条目未附直接网址，保留已有资料出处。',
'合并收录人物 · 待复核':'本项目收录人物',
'出生地域待核</text>':'出生地域未载</text>'}
for rel in ['components/山河地图.vue','components/人物目录.vue','components/PersonCard.vue','pages/province/index.vue','pages/registry/index.vue','pages/statistics/index.vue']:
 p=r/rel;s=p.read_text(encoding='utf-8')
 for a,b in replacements.items():s=s.replace(a,b)
 if rel=='pages/registry/index.vue':
  s=s.replace('<view class="fact-card"><text class="section-title">资料与依据</text>','<view class="fact-card"><text class="section-title">资料与依据</text><text v-if="person.birthplaceSourceUrl" class="small" selectable>出生地来源：{{person.birthplaceSourceUrl}}</text>') if '出生地来源：' not in s else s
  s=s.replace('person.supplementStatus||person.supplementNotes?.length||person.scopeNote','person.ancestryText||person.birthConflict||person.scopeNote')
  s=s.replace('<text v-if="person.supplementStatus" class="small">{{person.supplementStatus}}</text>','')
  s=s.replace('{{person.regionBasis}}',"{{(person.regionBasis||'未载').replace(/（待[^）]*）|；待[^；。]*|，待[^，。]*/g,'')}}")
 if rel=='pages/statistics/index.vue':
  s=s.replace('地区待核${summary.unassigned}', '未分省${summary.unassigned}').replace('单列地区待核','单列未分省人物')
  a="{title:'统计与审核',text:'保留待复核状态，不因完成软件合并而改为已核验。正式人数发布须核实身份、时间条件、籍贯、名录依据与去重，并记录复核人、日期和直接证据。团体不另增加自然人数量。'}"
  b="{title:'资料与来源',text:'每条人物记录保留资料出处。原始名录、官方人物介绍及二手资料分别记录，不互相替代。出生地、籍贯与祖籍分列；团体按自然人成员去重，缺项如实记为未载。'}"
  s=s.replace(a,b)
 p.write_text(s,encoding='utf-8')
