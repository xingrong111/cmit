from pathlib import Path
import time,json
exec(Path('E:/CMIT/v2/tools/核对地图与场馆封面.py').read_text(encoding='utf-8').split("call('Page.enable')")[0].replace('9246','9251').replace('docs/地图与场馆封面核对','docs/登录文字五幕大字核对'))
call('Page.enable');call('Runtime.enable');call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True})
def nav(route,selector,frame=False):
 call('Page.navigate',{'url':'http://127.0.0.1:3210/#/pages/'+route});time.sleep(.2);call('Page.reload');time.sleep(.4)
 wait(("document.querySelector('iframe')?.contentDocument?.querySelector(" if frame else 'document.querySelector(')+json.dumps(selector)+')');time.sleep(.6)
try:
 nav('me/index','.preference-card');js("sessionStorage.setItem('yingji:entry-choice','guest');localStorage.removeItem('yingji_token');localStorage.removeItem('yingji_user_id')");call('Page.reload');time.sleep(.6);wait("document.querySelector('.preference-card')")
 results=[]
 for width in [1440,1024,390]:
  call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False})
  nav('me/index','.preference-card');js("[...document.querySelectorAll('.preference-card uni-button')].find(e=>e.innerText.includes('大字号')).click()");time.sleep(.4)
  info=js("({height:document.querySelector('.account-form uni-input').clientHeight,subtitle:!!document.querySelector('.my-cover .page-heading>.muted')})");assert info['height']>=50 and not info['subtitle'],info
  for route,selector,frame in [('home/index','.slide-title',False),('people/index','.people-cover-heading',False),('timeline/index','.chronicle-name',False),('radar/index','#places .place-title',True),('assistant/index','.guide-copy h3',True),('learning/index','.learning-cover',True),('me/index','.preference-card',False),('wenchuang/index','.wc-banner',True),('person/index?id=P003','.detail-main',False)]:
   nav(route,selector,frame)
   wait("document.querySelector('iframe').contentDocument.documentElement.classList.contains('global-large')" if frame else "document.documentElement.classList.contains('global-large')")
   info=js("""(()=>{const d=%s;return {overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth,large:d.documentElement.classList.contains('global-large'),height:d.documentElement.scrollHeight}})()"""%("document.querySelector('iframe').contentDocument" if frame else 'document'))
   assert not info['overflow'] and info['large'],(width,route,info)
   if route=='home/index':assert not js("document.body.innerText.includes('三类名单合并去重')||document.body.innerText.includes('按来源所记籍贯归类')||document.querySelector('.slide-0 .slide-note')")
   if route=='assistant/index':
    assert not js("(()=>{const d=document.querySelector('iframe').contentDocument;return d.body.innerText.includes('待独立复核')||d.querySelector('.guide-welcome').innerText.includes('原创')||d.querySelector('.guide-welcome').innerText.includes('AI生成形象')})()")
   if route=='radar/index' and width>1000:
    assert not js("(()=>{const d=document.querySelector('iframe').contentDocument;return [...d.querySelectorAll('#places article')].some(e=>Math.max(e.querySelector('figure').getBoundingClientRect().bottom,e.querySelector('.place-head').getBoundingClientRect().bottom)>e.querySelector('p.small').getBoundingClientRect().top+2)})()")
   results.append({'width':width,'route':route,**info});(out/'布局结果.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
  nav('me/index','.preference-card');js("[...document.querySelectorAll('.preference-card uni-button')].find(e=>e.innerText.includes('标准字号')).click()");time.sleep(.3)
 nav('home/index','.slide-tabs');js("document.querySelectorAll('.slide-tabs uni-button')[2].click()");time.sleep(.4);js("document.querySelector('.slide-2 .slide-action').click()");wait("document.querySelector('.story-frame')");assert '/vr/' in js("document.querySelector('.story-frame').getAttribute('src')")
 wait("document.querySelector('.story-frame').contentDocument?.querySelector('#storyScene')")
 acts=js("(async()=>{const s=await(await fetch('/vr/剧情配置.mjs')).text();return [...new Set([...s.matchAll(/\"act\":\\s*(\\d+)/g)].map(x=>Number(x[1])))].filter(x=>x>0).sort()})()");assert acts==[1,2,3,4,5],acts
 results.append({'homeEntryFiveActs':acts});(out/'结果.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print('Nine pages at 1440/1024/390: large-font layout, removed text, taller fields and five-act entry passed',flush=True)
finally:ws.close()
