from pathlib import Path
import json,collections,hashlib,subprocess,sys
sys.stdout.reconfigure(encoding='utf-8')
r=Path(__file__).resolve().parents[1];out=r/'docs/资料更新-20261017';data=r/'frontend/src/data'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
rows=read(data/'合并人物目录.json');old=read(out/'更新前目录.json');summary=read(data/'人物统计摘要.json');raw=read(data/'研究目录.json')
assert len(rows)==len(old)==390
assert {x['id'] for x in rows}=={x['id'] for x in old}
assert {i for x in rows for i in x['rawIds']}=={x['id'] for x in raw}
assert sum('详细档案' in x['memberships'] for x in rows)==15
assert sum('IP专项' in x['memberships'] for x in rows)==9
assert len({x['id'] for x in rows})==390
eligible=[x for x in rows if x.get('statEligible') is not False]
counts=collections.Counter(x['provinceCode'] for x in eligible if x['provinceCode'])
assert summary['total']==len(eligible)==389
assert counts==summary['provinceCounts']
assert sum(counts.values())==summary['assigned']==217
assert sum(not x['provinceCode'] for x in eligible)==summary['unassigned']==172
assert counts['320000']==17 and counts['130000']==12
byraw={i:x for x in rows for i in x['rawIds']}
for id,birth in {'P0173':'1905','P0343':'1898','P0344':'1888','P0345':'1918','P0356':'1905','P0379':'1886-02-24'}.items():
 assert byraw[id]['birthText']==birth and byraw[id]['birthSourceUrl'].startswith('http')
assert byraw['P0026']['id']==byraw['P0041']['id']
assert byraw['P0287']['id']==byraw['P0354']['id']
for id in ['P0234','P0245','P0251','P0302']:
 assert byraw[id]['birthplace']
 assert byraw[id]['provinceCode']==next(x for x in old if id in x['rawIds'])['provinceCode'],id
assert byraw['P0379']['statEligible'] is False and byraw['P0379']['birthplace']=='印度尼西亚雅加达'
assert all(x['reviewStatus']=='pending' for x in rows)
assert len(read(out/'逐条处理.json'))==166
# 重跑统计生成器，验证回填不会丢失、重复追加或改变去重结果。
snapshot=(data/'合并人物目录.json').read_bytes()
subprocess.run([sys.executable,str(r/'tools/统一人物统计.py')],check=True,stdout=subprocess.DEVNULL)
assert snapshot==(data/'合并人物目录.json').read_bytes(),'统计生成器非幂等'
report=dict(tasks=166,peopleCovered=153,peopleWithFieldUpdates=71,directoryTotal=390,mapTotal=389,assigned=217,unassigned=172,excluded=1,jiangsu=17,hebei=12,rawIdsPreserved=375,duplicateCounting=False,sourceReview='回填证据对应检查；外部网页未全部独立复核',idempotent=True)
(out/'数据检查结果.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
