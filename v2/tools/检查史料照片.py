from pathlib import Path
import json,time
r=Path(__file__).resolve().parents[1]
index=json.loads((r/'frontend/src/data/人物肖像.json').read_text(encoding='utf-8'))
photos=[p for p in index.values() if p.get('identityVerified') and p.get('rightsApproved') and p.get('src')]
assert len(photos)==10
for p in photos:assert (r/'frontend/src'/p['src'].lstrip('/')).is_file() and p['sourceUrl'] and p['rightsEvidence']
base=(r/'tools/检查合并页面.py').read_text(encoding='utf-8');exec(base.split('results=[]')[0]);shots=r/'docs/人物照片补全/页面截图';shots.mkdir(exist_ok=True)
results=[]
for width in [390,1440]:
 size(width)
 for pid in ['P002','P003','P004','P005','P007','P008','P009','P010','P014','P015']:
  nav('person/index?id='+pid);wait("document.querySelector('.person-cover-name')?.innerText==="+json.dumps(index[pid]['name']))
  wait("document.querySelector('.portrait-cover .portrait-photo')")
  wait("document.querySelector('.portrait-cover .portrait-photo img')?.complete&&document.querySelector('.portrait-cover .portrait-photo img')?.naturalWidth>0")
  assert js("document.querySelector('.portrait-cover .portrait-credit').innerText.includes('史料照片')")
  assert js('document.documentElement.scrollWidth<='+str(width))
  if pid=='P002':assert js("document.querySelector('.portrait-photo-caption').innerText.includes('左起第二人')");shot('史良照片-'+str(width)+'.png')
  if pid in ['P004','P009','P014']:
   js("document.querySelector('.portrait-mode').click()")
   wait("document.querySelector('.portrait-cover .portrait-credit').innerText.includes('艺术化IP')")
   js("document.querySelector('.portrait-mode').click()")
   wait("document.querySelector('.portrait-cover .portrait-credit').innerText.includes('史料照片')")
   shot(index[pid]['name']+'照片-'+str(width)+'.png')
  results.append({'width':width,'personId':pid,'photoLoaded':True,'sourceCredit':True,'noOverflow':True})
(r/'docs/人物照片补全/照片页面验证.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print('10人历史照片双宽度展示、合影图注及史料/IP切换通过');ws.close()
