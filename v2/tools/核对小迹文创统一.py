from pathlib import Path
import json,time
prefix=Path('E:/CMIT/v2/tools/核对地图与场馆封面.py').read_text(encoding='utf-8').split("call('Page.enable')")[0].replace('docs/地图与场馆封面核对','docs/小迹文创统一核对')
exec(prefix.replace('9246','9247'))
call('Page.enable');call('Runtime.enable');call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True})
results=[]
try:
 for width in [1440,390]:
  call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False})
  for route,sel in [('people','.people-cover-heading'),('radar','.hero'),('assistant','.assistant-cover'),('learning','.learning-cover'),('wenchuang','.wc-banner')]:
   call('Page.navigate',{'url':'http://127.0.0.1:3210/#/pages/'+route+'/index'})
   if route=='people':wait('document.querySelector(".people-cover-heading")')
   else:wait('document.querySelector("iframe")?.contentDocument?.querySelector('+json.dumps(sel)+')')
   time.sleep(.5)
   info=js("""(()=>{const d=document.querySelector('iframe')?.contentDocument||document,e=d.querySelector(%s),h=e.querySelector('h1,h2,.page-title'),s=d.defaultView.getComputedStyle(h||e);return {title:h?.innerText,size:s.fontSize,weight:s.fontWeight,background:d.defaultView.getComputedStyle(e).backgroundImage,overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()"""%json.dumps(sel))
   assert not info['overflow'],(route,width,info)
   shot(route+'-'+str(width));results.append({'route':route,'width':width,**info})
   if route=='assistant':
    js("""(()=>{const w=document.querySelector('iframe').contentWindow;w.eval('state').messages=[{role:'user',text:'你好，请介绍一下你能帮我做什么。'},{role:'assistant',text:'你好，我是小迹，可以陪你阅读人物资料、探索文化地点，帮助你找到学习与收藏入口。',presentation:{kind:'chat',paragraphs:['你好，我是小迹，可以陪你阅读人物资料、探索文化地点，帮助你找到学习与收藏入口。']}}];w.assistant();const i=w.document.querySelector('#question');i.value='你好';i.dispatchEvent(new Event('input',{bubbles:true}));})()""")
    time.sleep(.3)
    info=js("""(()=>{const d=document.querySelector('iframe').contentDocument,b=d.querySelector('.send-icon'),i=d.querySelector('#question'),t=d.querySelector('.answer-paragraph'),s=d.defaultView.getComputedStyle(b.querySelector('span'));return {font:d.defaultView.getComputedStyle(t).fontSize,input:d.defaultView.getComputedStyle(i).fontSize,enabled:!b.disabled,mask:s.maskImage,button:b.getBoundingClientRect().toJSON(),overlap:i.getBoundingClientRect().right>b.getBoundingClientRect().left,overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()""")
    assert info['enabled'] and info['mask']!='none' and not info['overlap'] and not info['overflow'],info
    shot('对话-'+str(width));results.append({'route':'chat','width':width,**info})
 (out/'核对结果.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(results,ensure_ascii=False))
finally:ws.close()
