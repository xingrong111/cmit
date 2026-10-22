from pathlib import Path
import json,time,urllib.request
prefix=Path('E:/CMIT/v2/tools/核对地图与场馆封面.py').read_text(encoding='utf-8').split("call('Page.enable')")[0]
prefix=prefix.replace('docs/地图与场馆封面核对','docs/五处页面调整核对')
exec(prefix)
call('Page.enable');call('Runtime.enable');call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True})
call('Emulation.setDeviceMetricsOverride',{'width':1440,'height':1100,'deviceScaleFactor':1,'mobile':False})
results=[]
try:
 call('Page.navigate',{'url':'http://127.0.0.1:3210/#/pages/people/index'})
 wait("document.querySelector('.quick-toggle')")
 js("document.querySelector('.quick-toggle').click()")
 wait("document.querySelector('.quick-row')")
 for large in [False,True]:
  js('document.documentElement.classList.toggle("global-large",'+str(large).lower()+')')
  js("document.querySelector('.quick-directory').scrollIntoView({block:'start'})")
  info=js("""(()=>{const r=document.querySelector('.quick-region'),n=document.querySelector('.dossier-link'),rs=getComputedStyle(r),ns=getComputedStyle(n);return {regionSize:rs.fontSize,nameSize:ns.fontSize,regionWeight:rs.fontWeight,nameWeight:ns.fontWeight,regionColor:rs.color,nameColor:ns.color,songRegion:[...document.querySelectorAll('.quick-row')].find(x=>x.innerText.includes('宋振中'))?.querySelector('.quick-region').innerText}})()""")
  assert info['regionSize']==info['nameSize'] and info['regionWeight']==info['nameWeight'],info
  assert info['regionColor']!=info['nameColor'],info
  assert info['songRegion']=='江苏',info
  shot('人物快速索引'+('大字' if large else '标准'))
  results.append({'page':'人物索引','large':large,**info})
 call('Page.navigate',{'url':'http://127.0.0.1:3210/#/pages/assistant/index'})
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('.guide-welcome')")
 for large in [False,True]:
  js('document.documentElement.classList.toggle("global-large",'+str(large).lower()+');document.querySelector("iframe").contentDocument.documentElement.classList.toggle("global-large",'+str(large).lower()+')')
  time.sleep(.3)
  info=js("""(()=>{const d=document.querySelector('iframe').contentDocument,w=d.querySelector('.guide-welcome'),h=w.querySelector('h3').getBoundingClientRect(),s=w.querySelector('small').getBoundingClientRect(),i=w.querySelector('.guide-character').getBoundingClientRect();return {background:d.defaultView.getComputedStyle(d.querySelector('.assistant-cover')).backgroundImage,motionButtons:d.querySelectorAll('.hero .motion-toggle').length,textOverlap:h.bottom>s.top+1,imageOverlap:s.bottom>i.top+1,overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()""")
  assert not info['textOverlap'] and not info['imageOverlap'] and not info['overflow'],info
  assert not info['motionButtons'] and 'webp' in info['background'],info
  shot('小迹'+('大字' if large else '标准'))
  results.append({'page':'小迹','large':large,**info})
 for route,selector,name in [('radar/index','.hero','足迹'),('learning/index','.learning-cover','学习挑战')]:
  call('Page.navigate',{'url':'http://127.0.0.1:3210/#/pages/'+route})
  wait('document.querySelector("iframe")?.contentDocument?.querySelector('+json.dumps(selector)+')')
  time.sleep(.8)
  info=js("""(()=>{const d=document.querySelector('iframe').contentDocument,c=d.querySelector(%s);return {background:d.defaultView.getComputedStyle(c).backgroundImage,motionButtons:d.querySelectorAll('.hero .motion-toggle').length,requestFailed:d.body.innerText.includes('请求失败'),overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()"""%json.dumps(selector))
  assert 'webp' in info['background'] and not info['motionButtons'] and not info['overflow'],info
  if name=='学习挑战':assert not info['requestFailed'],info
  js("""(async()=>{const d=document.querySelector('iframe').contentDocument,b=d.defaultView.getComputedStyle(d.querySelector(%s)).backgroundImage,u=b.match(/url\([\"']?(.*?)[\"']?\)/)?.[1],i=new d.defaultView.Image();if(u){i.src=u;await i.decode()}await new Promise(r=>setTimeout(r,600));return true})()"""%json.dumps(selector))
  shot(name);results.append({'page':name,**info})
 person=json.load(urllib.request.urlopen('http://127.0.0.1:3210/api/reading/people/P004'))
 assert person['province']=='江苏' and person['origin']=='江苏徐州',person
 (out/'核对结果.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(results,ensure_ascii=False))
finally:ws.close()
