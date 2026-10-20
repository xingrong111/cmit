from pathlib import Path
import json,time
r=Path(__file__).resolve().parents[1];data=json.loads((r/'frontend/src/data/人物肖像.json').read_text(encoding='utf-8'))
assert len(data)==15 and all(x.get('src') for x in data.values())
pending=[x for x in data.values() if x.get('displayApproved') and not x.get('rightsApproved')];assert len(pending)==5
assert '合影' in data['P002']['shortCaption'] and '合影' in data['P006']['shortCaption']
base=(r/'tools/检查合并页面.py').read_text(encoding='utf-8');exec(base.split('results=[]')[0]);shots=r/'docs/全部人物配图截图';shots.mkdir(exist_ok=True);results=[]
for width in [390,1440]:
 size(width)
 for pid in data:
  nav('person/index?id='+pid);wait("document.querySelector('.person-cover-name')?.innerText==="+json.dumps(data[pid]['name']))
  wait("document.querySelector('.portrait-cover .portrait-photo img')?.complete&&document.querySelector('.portrait-cover .portrait-photo img')?.naturalWidth>0")
  assert js('document.documentElement.scrollWidth<='+str(width))
  if pid in ['P002','P006']:assert js("document.querySelector('.portrait-photo-caption')?.innerText.includes('合影')")
  if pid in ['P001','P006','P011','P012','P013']:assert js("document.querySelector('.portrait-credit').innerText.includes('使用待确认')")
  if pid in ['P006','P012']:shot(data[pid]['name']+'-'+str(width)+'.png')
  results.append({'personId':pid,'width':width,'loaded':True})
 nav('people/index');wait("document.querySelector('.archive-controls')")
 js("(()=>{const i=document.querySelector('.search-field input');i.value='';i.dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll('.archive-controls .chips uni-button')[1].click()})()")
 wait("document.querySelectorAll('.people-grid .portrait-photo').length===15")
 assert js("document.querySelectorAll('.people-grid .portrait-placeholder').length===0")
 shot('全部人物卡片-'+str(width)+'.png')
(r/'docs/全部人物配图验证.json').write_text(json.dumps({'checks':results,'pendingUsagePreserved':5,'groupPositionsLabeled':True,'deviceTest':False},ensure_ascii=False,indent=2),encoding='utf-8');print('15人简介及卡片配图、两幅合影位置、待确认状态和双宽度检查通过');ws.close()
