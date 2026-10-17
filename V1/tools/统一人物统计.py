from pathlib import Path
import json,csv,collections
r=Path(__file__).resolve().parents[1]; root=r.parent
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
data=r/'frontend/src/data'; raw=read(data/'研究目录.json'); dossiers=read(data/'详细档案索引.json'); content=read(r/'services/reading/data/content.json'); provinces=read(data/'省份目录.json')
# 原资料明确标为重复候选，且姓名、出生年及经历指向同一抗日将领；保留全部原编号和冲突。
pairs={'P0026':'P0041','P0269':'P0331','P0278':'P0340','P0287':'P0354','P0294':'P0341'}
rows=[]
for p in raw:
 if p['id'] in pairs:continue
 q={k:p.get(k,'') for k in ['id','name','aliases','provinceCode','provinceName','originText','birthText','detailUrl','sourceId']}
 q.update(memberships=['全国名单'],rawIds=[p['id']],reviewStatus='pending',regionBasis='资料包所记籍贯（待复核）')
 for old,new in pairs.items():
  if new==p['id']:
   other=next(x for x in raw if x['id']==old);q['rawIds'].append(old);q['birthText']=q['birthText'] or other.get('birthText','');q['dedupNote']='原资料重复候选合并；出生日期等分歧保留原记录，不据此确认争议字段。'
 rows.append(q)
for d in dossiers:
 matches=[p for p in rows if p['name']==d['name'] or p['name'] in d.get('aliases',[])]
 p=matches[0] if len(matches)==1 else None
 if p is None:
  p=dict(id='D-'+d['id'],name=d['name'],aliases=d['aliases'],provinceCode='',provinceName='地区待核',originText='',birthText='',detailUrl='',sourceId='',memberships=[],rawIds=[],reviewStatus='pending',regionBasis='籍贯待核；详细档案中的出生地不自动改作籍贯');rows.append(p)
 p['readingId']=d['id'];p['memberships'].append('详细档案')
 sources=[s for s in content['sources'] if s.get('person_id')==d['id']]
 if not p['detailUrl'] and sources:p['detailUrl']=next((s.get('final_url') or s.get('original_url') for s in sources if s.get('final_url') or s.get('original_url')),'')
 # 只有现有档案明确写“某地人”或祖籍的，才补籍贯；出生地域继续独立保存。
 p['birthplace']=next(x for x in content['people'] if x['id']==d['id']).get('geography',{}).get('birth') or ''
 if d['name'] in ['史良','张应春','李公朴','瞿秋白'] and not p['provinceCode']:
  p.update(provinceCode='320000',provinceName='江苏省',originText={'史良':'江苏常州','张应春':'吴江北厍','李公朴':'祖籍江苏武进','瞿秋白':'江苏常州'}[d['name']],regionBasis='详细档案已载地域表述（待独立复核）')
groups={'QQB':['瞿秋白'],'LYS':['马宝玉','葛振林','宋学义','胡德林','胡福才'],'SZZ':['宋振中'],'LDY':['陆定一'],'JZY':['江竹筠']}
for group,names in groups.items():
 for name in names:
  p=next((x for x in rows if x['name']==name),None)
  if p is None:
   p=dict(id='IP-'+group+'-'+str(names.index(name)+1),name=name,aliases=['江姐'] if name=='江竹筠' else [],provinceCode='',provinceName='地区待核',originText='',birthText='',detailUrl='',sourceId='',memberships=[],rawIds=[],reviewStatus='pending');rows.append(p)
  p['memberships'].append('IP专项');p['ipGroup']=group
  if group=='LYS':p.update(provinceCode='410000' if name=='宋学义' else '130000',provinceName='河南省' if name=='宋学义' else '河北省',originText={'马宝玉':'河北蔚县','葛振林':'河北曲阳','宋学义':'河南沁阳','胡德林':'河北容城','胡福才':'河北容城'}[name],regionBasis='设计资料包/狼牙山五壮士/01、06；来源S04、S05，待独立复核',detailUrl='https://www.chinanews.com/mil/2019/03-22/8787648.shtml',sourceId='狼牙山-S04/S05')
  if group=='JZY':p.update(provinceCode='510000',provinceName='四川省',originText='四川自贡',regionBasis='设计资料包/江竹筠/01 人物与阶段依据；S01，待独立复核')
# 显式地域证据表覆盖自动转换缺失；出生字段不充当籍贯。
regionEvidence=read(data/'省份归属补证.json')
for evidence in regionEvidence:
 p=next(x for x in rows if x['name']==evidence['name'])
 p.update(provinceCode=evidence['provinceCode'],provinceName=evidence['provinceName'],originText=evidence['originText'],regionBasis=evidence['basis'],regionEvidence=evidence)
supplement=data/'本轮人物补充.json'
if supplement.exists():
 for item in read(supplement):
  p=next(x for x in rows if x['id']==item['id'])
  assert p['name']==item['name']
  p.update(item['fields']);p['supplementNotes']=item.get('notes',[]);p['supplementUrls']=item.get('sourceUrls',[])
  if item.get('birthSourceUrl'):p['birthSourceUrl']=item['birthSourceUrl']
  if item['fields']:p['supplementStatus']='补充资料已回填，待独立复核'
codes={p['code'] for p in provinces};eligible=[p for p in rows if p.get('statEligible') is not False];counts=collections.Counter(p['provinceCode'] for p in eligible if p['provinceCode'] in codes)
summary=dict(total=len(eligible),directoryTotal=len(rows),excluded=len(rows)-len(eligible),nationalRaw=len(raw),nationalUnique=len(raw)-len(pairs),dossiers=len(dossiers),ipGroups=5,ipPeople=9,duplicateRows=len(pairs),added=len(rows)-(len(raw)-len(pairs)),assigned=sum(counts.values()),unassigned=sum(p['provinceCode'] not in codes for p in eligible),provinceCounts=dict(counts),status='合并资料目录，待独立核验；不是全国历史总人数或审核通过人数')
assert summary['assigned']+summary['unassigned']==summary['total'];assert len({p['id'] for p in rows})==len(rows)
write(data/'合并人物目录.json',rows);write(data/'人物统计摘要.json',summary)
out=r/'docs/合并人物统计';out.mkdir(exist_ok=True)
write(out/'统计摘要.json',summary)
with (out/'逐人合并明细.csv').open('w',encoding='utf-8-sig',newline='') as f:
 keys=['id','name','provinceName','originText','regionBasis','regionEvidence','birthText','birthplace','ancestryText','birthConflict','statEligible','scopeNote','supplementNotes','supplementUrls','birthSourceUrl','memberships','rawIds','readingId','ipGroup','detailUrl','sourceId','reviewStatus','dedupNote'];w=csv.DictWriter(f,fieldnames=keys,extrasaction='ignore');w.writeheader();w.writerows(rows)
(out/'统计口径.md').write_text('# 合并统计口径\n\n全国原始375条，合并5组重复候选后370人；与15份详细档案及5组IP涉及的9名自然人合并，再按已建立的人物身份关联去重。所有来源类别保留在逐人明细中。\n\n总目录 '+str(summary['total'])+' 人；可分省 '+str(summary['assigned'])+' 人；地区待核 '+str(summary['unassigned'])+' 人。地区待核也计入总目录，不硬填省份。\n\n5组重复候选：'+str(pairs)+'。这些属于资料目录去重，不等于独立史料审核通过。原始375条及日期冲突不删除。\n\n详细档案的出生地不自动作为籍贯。未取得籍贯依据的人物暂列地区待核。地图数字表示收集范围，不宣称满足全部官方名录及时间审核条件。',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=True))
with (out/'统计口径.md').open('a',encoding='utf-8') as f:
 f.write('\n\n完整研究目录'+str(summary['directoryTotal'])+'人，其中明确区间外排除'+str(summary['excluded'])+'人；地图人数为'+str(summary['total'])+'人。罗福星1914年就义，不纳入1919—1949区间地图统计。所有补充字段仍待独立复核，详见资料更新-20261017/更新说明.md。')
