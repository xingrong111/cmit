from pathlib import Path
import json,collections
r=Path(__file__).resolve().parents[1];d=r/'frontend/src/data'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
rows=read(d/'合并人物目录.json');before=read(r/'docs/地域回填-20261018/合并前目录.json');summary=read(d/'人物统计摘要.json');raw={rid:p for p in rows for rid in p['rawIds']};old={rid:p for p in before for rid in p['rawIds']}
assert len(rows)==len(before)==390
assert len({p['id'] for p in rows})==390
for p in rows:
 q=next(x for x in before if x['id']==p['id']);assert p['birthText']==('' if q.get('birthText') in ['待核验','待核','未取得','未找到'] else q.get('birthText',''))
for rid in ['P0005','P0009','P0010','P0142']:
 for k in ['provinceCode','originText','birthplace']:
  actual=raw[rid].get(k,'');previous=old[rid].get(k,'')
  assert actual==('' if previous in ['待核验','待核','未取得','未找到'] else previous),(rid,k)
assert raw['P0074']['provinceCode']=='' and raw['P0148']['provinceCode']==''
assert raw['P0150']['provinceCode']=='370000'
assert raw['P0085']['provinceCode']==old['P0085']['provinceCode'],'仅补出生地不能改变籍贯归省'
assert sum(summary['provinceCounts'].values())+summary['unassigned']==summary['total']==389
assert summary['assigned']==267 and summary['unassigned']==122
assert next(p for p in rows if 'P0379' in p['rawIds'])['statEligible'] is False
exec((r/'tools/检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
for width in [390,1440]:
 size(width);nav('people/index');wait("document.querySelector('.archive-controls')")
 assert js("!document.querySelector('.shell-body').innerText.includes('待独立复核')")
 assert js("!document.querySelector('.shell-body').innerText.includes('待核验')")
 assert js('document.documentElement.scrollWidth<=innerWidth')
 nav('registry/index?id='+raw['P0150']['id']);wait("document.querySelector('.identity-grid')")
 assert js("document.querySelector('.identity-grid').innerText.includes('西南海村')")
 assert js("!document.querySelector('.shell-body').innerText.includes('待独立复核')")
 shot('地域回填条目-'+str(width)+'.png')
 nav('home/index');wait("document.querySelector('.scope-metrics')")
 assert js("document.querySelector('.scope-metrics').innerText.includes('267')")
 assert js("document.querySelector('.scope-metrics').innerText.includes('122')")
print('通过：390条身份、389人总计、267分省/122未分省、来源与字段关联、无日期补造，双尺寸页面与工作流提示清理。');ws.close()
(r/'docs/地域回填-20261018/检查结果.json').write_text(json.dumps({'records':390,'total':389,'assigned':267,'unassigned':122,'identityCandidatesUnchanged':True,'birthplaceNotUsedAsOrigin':True,'birthDatesUnchanged':True,'workflowPromptsRemoved':True,'deviceTest':False},ensure_ascii=False,indent=2),encoding='utf-8')
