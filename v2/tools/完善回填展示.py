from pathlib import Path
import json,csv,collections
r=Path(__file__).resolve().parents[1];data=r/'frontend/src/data';out=r/'docs/资料更新-20261017'
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
p=r/'frontend/src/pages/registry/index.vue';t=p.read_text(encoding='utf-8')
t=t.replace("import {people} from '../../lib/全国收录.js'","import {allRecords as people} from '../../lib/全国收录.js'")
marker='<view class="fact-card"><text class="section-title">资料与依据</text>'
extra='<view v-if="person.supplementStatus||person.supplementNotes?.length||person.scopeNote" class="fact-card"><text class="section-title">补充资料说明</text><text v-if="person.supplementStatus" class="small">{{person.supplementStatus}}</text><text v-if="person.ancestryText" class="reading-body">祖籍：{{person.ancestryText}}（与本人籍贯分别记录）</text><text v-if="person.birthConflict" class="tag">出生日期有另载 · 尚未定论</text><text v-if="person.scopeNote" class="reading-body">{{person.scopeNote}}</text><text v-for="(note,i) in person.supplementNotes" :key="i" class="small">{{note}}</text><text v-if="person.birthSourceUrl" class="small" selectable>出生日期补充来源：{{person.birthSourceUrl}}</text><text v-for="u in person.supplementUrls" :key="u" class="small" selectable>回填来源线索：{{u}}</text></view>'
if '补充资料说明' not in t:t=t.replace(marker,extra+marker)
t=t.replace('出生年份</text>','出生日期</text>')
p.write_text(t,encoding='utf-8')
p=r/'frontend/src/pages/province/index.vue';t=p.read_text(encoding='utf-8')
t=t.replace('全国原名单5人，详细档案新增11人，IP中的江苏人物已包含在详细档案中，共16人，不重复计数。',"全国名单{{nationalCount}}人，详细档案新增{{detailAdded}}人，共{{total}}人。IP中的同一人物不重复计数。")
t=t.replace("function select(e)","const nationalCount=computed(()=>list(code.value).filter(p=>p.memberships.includes('全国名单')).length),detailAdded=computed(()=>list(code.value).filter(p=>!p.memberships.includes('全国名单')&&p.memberships.includes('详细档案')).length)\nfunction select(e)") if 'const nationalCount=' not in t else t
p.write_text(t,encoding='utf-8')
old=load(out/'更新前目录.json');new=load(data/'合并人物目录.json');summary=load(data/'人物统计摘要.json');lookup={p['id']:p for p in old}
changes=[]
for p in new:
 for field in ['birthText','birthplace','originText','provinceCode','provinceName','ancestryText','birthConflict','statEligible']:
  before=lookup[p['id']].get(field,'');after=p.get(field,'')
  if before!=after:changes.append(dict(编号=p['id'],姓名=p['name'],字段=field,原值=before,新值=after,状态='待独立复核' if field!='statEligible' else '区间外排除'))
with (out/'字段变更表.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=['编号','姓名','字段','原值','新值','状态']);w.writeheader();w.writerows(changes)
audits=load(out/'逐条处理.json');counter=collections.Counter(x['处理'] for x in audits)
lines=['# 补充资料更新说明','', '本次处理40条Excel记录、85份人物回填和41项出生年/冲突任务，共166项任务，涉及153名去重人物。原始附件保持不变。','',
'## 更新结果','',f"- 原目录390人完整保留；地图统计389人，明确区间外排除1人（罗福星）。",f"- 可分省217人（原178人）；地区待核172人。江苏17人，河北12人。",'- 71人有字段补充；6人补充出生日期，其中罗福星保留精确日，其余只记年。','- 新补充字段仍为待独立复核，并未变更成审核通过或官方名录原件已核。','',
'## 使用边界','', '- 本轮核查回填文本、字段和证据对应，不代表已独立打开并复核所有外部网页。回填自述的访问日期不当成本轮独立访问日期。','- 出生地、籍贯、祖籍分列；仅有出生地的观杰、叶发青、茆健群、刘曙华等，不据此新增籍贯归省。','- “某地人”保留为地域表述，不反推具体出生地点。历史地名保留原文，省级换算不扩充未经核实的村镇。','- 搜索摘要、未取得正文、非官方辅助汇编、身份存疑等留作候选，不覆盖主字段；例如王祯祥身份问题、白凤翔搜索摘要、朱学勉缺少辅助链接。','- 既有来源存在年份冲突的保留原值并显示另载提醒；不拼接不同来源的年份、月份，不根据年龄倒推。','- 罗福星1886-02-24生、1914年就义，依据回填的中国军网载人民政协报稿；保留条目，但本研究区间人数不纳入。广东为其祖籍，不再冒充本人籍贯。','- 全国原始375条、5组去重关联、15份深度档案和5组IP人物关联均保留。原始375条并非375名已审核通过的人。','',
'## 交付文件','', '- 字段变更表.csv：每一处改动的前后值。','- 逐条处理.json：166项任务采用或暂缓的原因。','- 来源与回填原文.json：原始表格字段与85份文档、出生年任务的来源全文记录。','- 字段更新完整记录.json：按去重人物汇总的字段和证据。','- 原始回填提取.json：附件提取结果；更新前目录.json：更新前快照。','', '## 任务处理分类','']
lines += [f'- {k}：{v}项。' for k,v in counter.items()]
(out/'更新说明.md').write_text('\n'.join(lines),encoding='utf-8')
scope=r/'docs/合并人物统计/统计口径.md';scope.write_text(scope.read_text(encoding='utf-8')+'\n\n2026-10-17回填：完整研究目录390人，其中罗福星明确早于区间，排除1人；地图展示389人，分省217人、地区待核172人。新增回填均待独立复核，详见资料更新-20261017/更新说明.md。',encoding='utf-8')
print('展示与报告已更新；变更字段',len(changes))
