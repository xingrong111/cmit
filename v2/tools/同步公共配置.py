from pathlib import Path
import json
r=Path(__file__).resolve().parents[1]
links=json.loads((r/'人物关联.json').read_text(encoding='utf-8-sig'));config=json.loads((r/'部署配置.json').read_text(encoding='utf-8-sig'))
people={x['id']:x['name'] for x in json.loads((r/'services/reading/data/content.json').read_text(encoding='utf-8-sig'))['people']}
for row in links:
 if row['readingId']:assert people.get(row['readingId'])==row['name'],row
for filename,data in [('人物关联.json',links),('部署配置.json',config)]:
 (r/'frontend/src/data'/filename).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
(r/'services/guide/miniprogram/utils/人物关联.json').write_text(json.dumps(links,ensure_ascii=False),encoding='utf-8')
(r/'services/guide/web/关联配置.js').write_text('window.yingjiLinks='+json.dumps(links,ensure_ascii=False)+';',encoding='utf-8')
(r/'docs/导览与人物映射.json').write_text(json.dumps({x['guideId']:x['readingId'] for x in links if x['readingId']},ensure_ascii=False,indent=2),encoding='utf-8')
print('公共配置同步通过')

p=r/'services/学习/levels.json';data=json.loads(p.read_text(encoding='utf-8-sig'));mapping={x['group']:x['readingId'] for x in links}
for level in data['levels']:level['reading_person_id']=mapping[level['group']]
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
