from pathlib import Path
import json,collections
r=Path(__file__).resolve().parents[1];d=r/'frontend/src/data'
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
rows=load(d/'合并人物目录.json');by={p['id']:p for p in rows}
for patch in load(r/'data/地域补证.json'):
 p=by[patch['id']];assert p['name']==patch['name'];assert not any(k in patch['fields'] for k in ['name','id','birthText','statEligible','reviewStatus']);p.update(patch['fields'])
codes={p['code'] for p in load(d/'省份目录.json')};eligible=[p for p in rows if p.get('statEligible') is not False];counts=collections.Counter(p['provinceCode'] for p in eligible if p.get('provinceCode') in codes)
summary=load(d/'人物统计摘要.json');summary.update(total=len(eligible),assigned=sum(counts.values()),unassigned=len(eligible)-sum(counts.values()),provinceCounts=dict(counts))
assert summary['assigned']+summary['unassigned']==summary['total']
(d/'合并人物目录.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
for p in [d/'人物统计摘要.json',r/'docs/合并人物统计/统计摘要.json']:p.write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print('地域补证已更新：',summary['total'],summary['assigned'],summary['unassigned'])
