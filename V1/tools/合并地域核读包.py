from pathlib import Path
import json,csv,re,collections
r=Path(__file__).resolve().parents[1];out=r/'docs/地域回填-20261018';data=r/'frontend/src/data'
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
dump=lambda p,x:p.write_text(json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
incoming=load(next((out/'原始附件').rglob('回填结果-85条.json')))
rows=load(data/'合并人物目录.json')
if not (out/'合并前目录.json').exists():dump(out/'合并前目录.json',rows)
rows=load(out/'合并前目录.json');byraw={rid:p for p in rows for rid in p.get('rawIds',[])}
provinceMap={p['code']:p['name'] for p in load(data/'省份目录.json')}
# 仅按本人籍贯字段归省，出生地和祖籍不参与此映射。
mapping={
'P0014':'370000','P0023':'220000','P0057':'210000','P0058':'210000','P0063':'330000',
'P0070':'440000','P0071':'510000','P0073':'410000','P0077':'210000','P0079':'360000',
'P0081':'610000','P0083':'360000','P0086':'130000','P0087':'510000','P0090':'610000',
'P0091':'370000','P0095':'210000','P0096':'220000','P0101':'230000','P0103':'340000',
'P0105':'210000','P0106':'430000','P0109':'430000','P0113':'210000','P0114':'430000',
'P0116':'360000','P0118':'370000','P0119':'610000','P0120':'430000','P0121':'370000',
'P0122':'210000','P0124':'510000','P0128':'220000','P0129':'220000','P0130':'370000',
'P0131':'370000','P0132':'210000','P0135':'220000','P0136':'520000','P0139':'210000',
'P0143':'410000','P0145':'210000','P0147':'360000','P0149':'420000','P0150':'370000',
'P0151':'370000','P0153':'370000','P0157':'110000','P0158':'420000','P0159':'230000'}
weakHosts=['wikipedia.org','newton.com.tw','people.isgoodgood.com','m1.rw.ttdm.cn','sohu.com']
audit=[];patches=[];evidenceTable=[]
def valid(v):return isinstance(v,str) and v.strip() not in ['', '未找到','未取得','待核验','未载']
for x in incoming:
 rid=x['记录编号'];p=byraw.get(rid)
 if p is None or p['name']!=x['姓名']:raise ValueError(('人物编号/姓名不匹配',rid,x['姓名'],p and p['name']))
 fields={};evs=[]
 for key,target,kind in [('新出生地区','birthplace','出生地区'),('新籍贯','originText','籍贯'),('新祖籍','ancestryText','祖籍')]:
  value=x.get(key,'')
  if not valid(value):continue
  candidates=[e for e in x.get('证据明细',[]) if e.get('直接支持字段')==kind and e.get('短摘录') and e.get('最终URL')]
  good=[e for e in candidates if not any(h in e['最终URL'] for h in weakHosts)]
  # 收录为有出处的资料转录，不将附件自述的核读当成本轮独立原件审核。
  if not good or rid=='P0142' or (rid=='P0080'):
   audit.append(dict(编号=rid,姓名=p['name'],字段=kind,处理='保留候选，未覆盖',原因='仅弱/聚合资料，或籍贯来源存在实质差异',候选值=value));continue
  ev=good[-1]
  if kind=='籍贯' and rid not in mapping and rid not in ['P0012','P0074','P0148']:
   audit.append(dict(编号=rid,姓名=p['name'],字段=kind,处理='保留候选，未覆盖',原因='省级归属尚无明确映射',候选值=value));continue
  fields[target]=value;evs.append((kind,ev))
  if kind=='籍贯':
   code=mapping.get(rid,'');fields.update(provinceCode=code,provinceName=provinceMap.get(code,'境外籍贯'),regionBasis='来源记载的本人地域表述；按现行省级区划检索')
  audit.append(dict(编号=rid,姓名=p['name'],字段=kind,处理='采用资料转录',原值=p.get(target,''),新值=value,依据=ev['最终URL'],核验范围='附件证据对照，非本轮逐站原件复核'))
 if not fields:continue
 patches.append(dict(id=p['id'],name=p['name'],fields=fields,evidence=[dict(field=k,**e) for k,e in evs]))
 p.update(fields)
 region=next((e for k,e in evs if k=='籍贯'),None)
 if region:p['regionEvidence']={'title':region.get('标题','地域资料'),'url':region['最终URL'],'excerpt':region['短摘录'],'location':region.get('位置','')}
 birth=next((e for k,e in evs if k=='出生地区'),None)
 if birth:p['birthplaceSourceUrl']=birth['最终URL']
 for k,e in evs:evidenceTable.append(dict(编号=rid,姓名=p['name'],字段=k,**e))
dump(out/'字段合并记录.json',patches);dump(out/'逐项处理.json',audit);dump(out/'来源证据表.json',evidenceTable)
dump(out/'合并后完整目录.json',rows)
# 前端去掉工作流记录，完整旧值、证据及审核状态仍保存在上述审计目录。
for p in rows:
 for key in ['supplementNotes','supplementStatus','supplementUrls'] :p.pop(key,None)
 for key in ['birthText','originText','birthplace']:
  if p.get(key) in ['待核验','待核','未取得','未找到']:p[key]=''
summary=load(data/'人物统计摘要.json');codes=set(provinceMap);eligible=[p for p in rows if p.get('statEligible') is not False]
counts=collections.Counter(p['provinceCode'] for p in eligible if p['provinceCode'] in codes)
summary.update(total=len(eligible),directoryTotal=len(rows),excluded=len(rows)-len(eligible),assigned=sum(counts.values()),unassigned=sum(p['provinceCode'] not in codes for p in eligible),provinceCounts=dict(counts),status='本项目收录目录；未分省记录单列，不代表全国历史总人数')
assert summary['assigned']+summary['unassigned']==summary['total']
assert len({p['id'] for p in rows})==len(rows)
for name,x in [('合并人物目录.json',rows),('人物统计摘要.json',summary)]:
 (data/name).write_text(json.dumps(x,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
dump(r/'docs/合并人物统计/统计摘要.json',summary)
with (r/'docs/合并人物统计/逐人合并明细.csv').open('w',encoding='utf-8-sig',newline='') as f:
 keys=['id','name','birthText','birthplace','originText','provinceCode','provinceName','rawIds','statEligible','regionEvidence'];w=csv.DictWriter(f,fieldnames=keys,extrasaction='ignore');w.writeheader();w.writerows(rows)
before=load(out/'合并前目录.json');beforeCounts=collections.Counter(p['provinceCode'] for p in before if p.get('statEligible') is not False and p['provinceCode'] in codes)
with (out/'分省变化.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['省份','原人数','现人数','变化'])
 for code,name in provinceMap.items():w.writerow([name,beforeCounts[code],counts[code],counts[code]-beforeCounts[code]])
report={'附件人数':len(incoming),'字段更新人数':len(patches),'采用字段数':sum(len(p['evidence']) for p in patches),'保留候选字段数':sum(a['处理'].startswith('保留') for a in audit),'统计':summary}
dump(out/'更新摘要.json',report)
(out/'更新说明.md').write_text('# 地域资料合并说明\n\n'+json.dumps(report,ensure_ascii=False,indent=2)+'\n\n## 审核边界\n附件明确记载全部待独立复核；本次完成编号、姓名、字段含义与证据对应核对，并抽查原网页，不称85人均已完成独立原件审核。附件中的历史阶段报告不作为最终值覆盖最新回填表。三名身份不明确者不回填；弱来源、异名身份与相互矛盾的地域仍保留候选。未载字段保持空缺，不以出生地、祖籍或活动地归为籍贯。原名录资格和时间审核状态不提升为已通过。\n\n前端删除内部工作流提示，保留未载字段、日期另载、图片使用依据等事实边界。完整附件、旧值、候选和证据保存在本目录。\n\n重新生成源目录时，在统一人物统计.py之后运行合并地域核读包.py；脚本使用本次快照与原附件生成，不重复新增人物。',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
