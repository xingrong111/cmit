from pathlib import Path
import json,collections
r=Path(__file__).resolve().parents[1]
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
d=r/'frontend/src/data';a=read(d/'合并人物目录.json');s=read(d/'人物统计摘要.json');raw=read(d/'研究目录.json')
assert len(a)==s['total']==390
assert len({x['id'] for x in a})==390
assert collections.Counter(i for x in a for i in x['rawIds'])==collections.Counter(x['id'] for x in raw)
assert sum('详细档案' in x['memberships'] for x in a)==15
assert sum('IP专项' in x['memberships'] for x in a)==9
assert len({x['ipGroup'] for x in a if x.get('ipGroup')})==5
assert not any(x['name']=='狼牙山五壮士' for x in a)
for name in ['瞿秋白','宋振中','陆定一']:
 p=[x for x in a if x['name']==name];assert len(p)==1 and {'详细档案','IP专项'}<=set(p[0]['memberships'])
assert len([x for x in a if x.get('ipGroup')=='LYS' and x['provinceCode']=='130000'])==4
assert len([x for x in a if x.get('ipGroup')=='LYS' and x['provinceCode']=='410000'])==1
counts=collections.Counter(x['provinceCode'] for x in a if x['provinceCode']);assert dict(counts)==s['provinceCounts']
assert sum(counts.values())+s['unassigned']==s['total']
assert all(x['reviewStatus']=='pending' for x in a)
jiangsu=[x for x in a if x['provinceCode']=='320000']
assert len(jiangsu)==16
assert {x['name'] for x in jiangsu}=={'张建生','高云','恽代英','陈三才','徐佳标','史砚芬','史良','张太雷','张应春','李公朴','瞿秋白','秦邦宪','许晓轩','郭纲琳','陆定一','顾正红'}
assert sum('详细档案' in x['memberships'] for x in jiangsu)==12
for name in ['史砚芬','张太雷','秦邦宪','许晓轩','郭纲琳','陆定一','顾正红']:
 p=next(x for x in jiangsu if x['name']==name);assert p['regionEvidence']['url'].startswith('https://') and p['regionEvidence']['excerpt'] and p['regionEvidence']['location']
assert next(x for x in a if x['name']=='周恩来')['provinceCode']=='330000'
assert all(not next(x for x in a if x['name']==name)['provinceCode'] for name in ['宋振中','钱振标'])
print('通过：三类目录合并、原375条完整映射、15档案、9名IP成员、重合去重、分省合计与待核合计一致。')
