from pathlib import Path
from PIL import Image
import json,time,urllib.request
r=Path(__file__).resolve().parents[1];data=json.loads((r/'docs/国风图标/图标清单.json').read_text(encoding='utf-8'));icons=data['icons']
for name in icons:
 p=r/('frontend/src/static/icons/'+name+'.png');im=Image.open(p);assert im.size==(80,80)
for name in ['home','people','pin','assistant','bookmark']:
 a=r/('frontend/src/static/icons/'+name+'.png');b=r/('frontend/src/static/icons/'+name+'-active.png');assert a.read_bytes()!=b.read_bytes()
base=(r/'tools/检查合并页面.py').read_text(encoding='utf-8');exec(base.split('results=[]')[0]);shots=r/'docs/国风图标/页面截图';shots.mkdir(exist_ok=True);results=[]
def loaded(selector):return "[...document.querySelectorAll("+json.dumps(selector)+")].every(i=>i.complete&&i.naturalWidth>0)"
for width in [390,1440]:
 size(width);nav('home/index');wait("document.querySelectorAll('.module-grid uni-image').length===6")
 wait(loaded('.module-grid img'));assert js('document.documentElement.scrollWidth<='+str(width))
 js("document.querySelector('.module-grid').scrollIntoView({block:'center'})");time.sleep(.3);shot('首页功能图标-'+str(width)+'.png')
 nav('person/index?id=P009');wait("document.querySelectorAll('.shortcut-icon').length===4")
 wait(loaded('.shortcut-icon img'));assert js('document.documentElement.scrollWidth<='+str(width))
 js("document.querySelector('.person-shortcuts').scrollIntoView({block:'center'})");shot('人物快捷入口-'+str(width)+'.png')
 js("document.querySelectorAll('.person-shortcuts uni-button')[1].click()")
 wait("location.hash.includes('/pages/graph/index')&&document.querySelector('.graph-ready')")
 nav('me/index');wait("document.querySelectorAll('.menu-feature-icon').length===3")
 wait(loaded('.menu-feature-icon img'));shot('我的图标-'+str(width)+'.png')
 for route,selector,count in [('assistant/index','.scene-icon',3),('radar/index','.module-feature-icon',1),('learning/index?group=SZZ','.learning-title-icon',1),('account/index','.account-title-icon',1)]:
  nav(route);wait('document.querySelector("iframe")?.contentDocument?.querySelectorAll('+json.dumps(selector)+').length==='+str(count))
  wait('(()=>{let d=document.querySelector("iframe").contentDocument;return [...d.querySelectorAll('+json.dumps(selector)+')].every(i=>i.complete&&i.naturalWidth>0)})()')
  assert js('document.querySelector("iframe").contentDocument.documentElement.scrollWidth<='+str(width)),route
 results.append({'width':width,'homeFeatures':6,'personShortcuts':4,'myMenu':3,'guideScenes':3,'moduleHeaders':True,'routesUnchanged':True,'noOverflow':True})
call('Page.navigate',{'url':'file:///E:/CMIT/V1/docs/'+urllib.parse.quote('国风图标')+'/'+urllib.parse.quote('图标总览.html')});size(1280)
wait("document.querySelectorAll('article img').length===19")
wait(loaded('article img'));time.sleep(.3);shot('原创图标总览.png')
(r/'docs/国风图标/图标验证.json').write_text(json.dumps({'icons':19,'navigationStatesDistinct':True,'checks':results,'deviceTest':False},ensure_ascii=False,indent=2),encoding='utf-8');print('图标资源、导航状态、双宽度布局、跨模块加载和入口跳转检查通过');ws.close()
