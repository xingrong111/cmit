from pathlib import Path
import json,time,sys
exec(Path('E:/CMIT/v2/tools/核对地图与场馆封面.py').read_text(encoding='utf-8').split("call('Page.enable')")[0].replace('9246','9249').replace('docs/地图与场馆封面核对','docs/标题地图长卷合并核对'))
call('Page.enable');call('Runtime.enable');call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True});width=int(sys.argv[1]) if len(sys.argv)>1 else 1440;base=sys.argv[2] if len(sys.argv)>2 else 'http://127.0.0.1:3210'
call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False});results=[]
def nav(path,selector,frame=False):
 call('Page.navigate',{'url':base+'/#/pages/'+path});time.sleep(.3);wait(("document.querySelector('iframe')?.contentDocument?.querySelector(" if frame else 'document.querySelector(')+json.dumps(selector)+')');time.sleep(.5)
def size(selector,frame=False):return js("""(()=>{const d=%s,e=d.querySelector(%s),t=[e,...e.querySelectorAll('*')].find(n=>[...n.childNodes].some(c=>c.nodeType===3&&c.textContent.trim()))||e;return parseFloat(d.defaultView.getComputedStyle(t).fontSize)})()"""%("document.querySelector('iframe').contentDocument" if frame else 'document',json.dumps(selector)))
try:
 nav('me/index','.preference-card');js("[...document.querySelectorAll('.preference-card uni-button')].find(e=>e.innerText.includes('标准字号')).click()");time.sleep(.4)
 nav('home/index','.slide-title');home=size('.slide-title');stats=js("[...document.querySelectorAll('.scope-metrics .count-number')].map(e=>getComputedStyle(e.querySelector('span')||e).fontSize)")
 for path,sel,frame in [('people/index','.people-cover-heading .page-title',False),('timeline/index?person_id=P003','.timeline-cover-heading .page-title',False),('assistant/index','.assistant-cover h2',True),('me/index','.my-cover .page-title',False),('wenchuang/index','.wc-banner .page-title',True)]:
  nav(path,sel,frame);time.sleep(1.5 if frame else .2);actual=size(sel,frame);assert abs(actual-home)<.2,(path,home,actual)
  info=js("""(()=>{const d=%s;return {overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth,visibleEyebrows:[...d.querySelectorAll('.people-cover-heading>.eyebrow,.timeline-cover-heading>.eyebrow,.my-cover .page-heading>.eyebrow,.assistant-cover>.eyebrow,.wc-banner>.eyebrow')].filter(e=>d.defaultView.getComputedStyle(e).display!=='none').length}})()"""%("document.querySelector('iframe').contentDocument" if frame else 'document'))
  assert not info['overflow'] and info['visibleEyebrows']==0,info
  if path=='people/index':
   values=js("[...document.querySelectorAll('.archive-stat')].map(e=>getComputedStyle(e.querySelector('span')||e).fontSize)");assert values==stats,(values,stats)
  results.append({'page':path,'titleSize':actual,**info});shot(path.split('/')[0]+'-'+str(width))
 nav('radar/index','#places .place-title',True)
 info=js("""(()=>{const d=document.querySelector('iframe').contentDocument,c=d.querySelector('.web-map-column'),card=d.querySelector('#places .card');return {mapHeight:c.clientHeight,cardHeight:card.clientHeight,overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()""")
 assert info['mapHeight']<=630 and info['cardHeight']<(520 if width<650 else 420) and not info['overflow'],info
 results.append(info);shot('足迹紧凑-'+str(width))
 nav('person/index?id=P003','.detail-main .fact-card')
 assert size('.detail-main .fact-card .reading-body')>=20
 nav('timeline/index?person_id=P003','.chronicle-photo')
 wait("[...document.querySelectorAll('.chronicle-photo img')].some(e=>e.naturalWidth>0)")
 info=js("""(()=>{const photos=[...document.querySelectorAll('.chronicle-photo')];return {photos:photos.length,loaded:photos.some(e=>e.querySelector('img')?.naturalWidth>0),overflow:document.documentElement.scrollWidth>innerWidth}})()""")
 if width<650:
  widths=js("[...document.querySelectorAll('.chronicle-card')].map(e=>Math.round(e.getBoundingClientRect().width))");assert max(widths)-min(widths)<3,widths
 assert info['photos']>=3 and info['loaded'] and not info['overflow'],info
 js("document.querySelector('.chronicle-photo').scrollIntoView({block:'center'})");shot('长卷配图-'+str(width));results.append(info)
 js("[...document.querySelectorAll('.chronicle-view-switch uni-button')].find(e=>e.innerText==='简明年表').click()")
 wait("document.querySelector('.is-compact')");assert not js("document.querySelector('.chronicle-photo')")
 for route,sel,frame in [('person/index?id=P003','.detail-main .fact-card .reading-body',False),('timeline/index?person_id=P003','.chronicle-summary',False),('wenchuang/index','.wc-banner .page-title',True)]:
  nav(route,sel,frame);time.sleep(1);normal=size(sel,frame)
  nav('me/index','.preference-card');js("[...document.querySelectorAll('.preference-card uni-button')].find(e=>e.innerText.includes('大字号')).click()");time.sleep(.4)
  nav(route,sel,frame);time.sleep(1);large=size(sel,frame);assert large>=normal*1.15,(route,normal,large)
  results.append({'largeFont':route,'normal':normal,'large':large})
  nav('me/index','.preference-card');js("[...document.querySelectorAll('.preference-card uni-button')].find(e=>e.innerText.includes('标准字号')).click()");time.sleep(.4)
 nav('person/index?id=P003','.detail-main .fact-card');js("document.querySelector('.detail-main .fact-card').scrollIntoView({block:'center'})");shot('史料摘读-'+str(width))
 (out/('结果-'+str(width)+'.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(results,ensure_ascii=False))
finally:ws.close()
