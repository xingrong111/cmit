from pathlib import Path
import json,time,sys
prefix=Path('E:/CMIT/v2/tools/核对地图与场馆封面.py').read_text(encoding='utf-8').split("call('Page.enable')")[0].replace('9246','9247').replace('docs/地图与场馆封面核对','docs/三图微调核对');exec(prefix)
call('Page.enable');call('Runtime.enable');call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True})
width=int(sys.argv[1]) if len(sys.argv)>1 else 1440
call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False})
results=[]
try:
 for route in ['radar','assistant','learning']:
  call('Page.navigate',{'url':'http://127.0.0.1:3210/#/pages/'+route+'/index'})
  wait("document.querySelector('iframe')?.contentDocument?.querySelector('"+('.ink-map-logo' if route=='radar' else '.web-chat-panel' if route=='assistant' else '.learning-step')+"')")
  if len(sys.argv)>2:js("document.querySelector('iframe').contentDocument.documentElement.classList.add('global-large')")
  if route=='radar':
   info=js("""(()=>{const d=document.querySelector('iframe').contentDocument,i=d.querySelector('.ink-map-logo'),s=d.defaultView.getComputedStyle(d.querySelector('.ink-map-heading h3'));return {logo:i.complete&&i.naturalWidth>0,weight:s.fontWeight,font:s.fontSize,overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()""")
   assert info['logo'] and info['weight']=='900' and not info['overflow'],info
  elif route=='assistant':
   js("""(()=>{const w=document.querySelector('iframe').contentWindow;w.eval('state').messages=Array.from({length:12},(_,i)=>({role:i%2?'assistant':'user',text:'这是一段用于检查对话区滚动的测试文字。'.repeat(10)}));w.assistant()})()""")
   time.sleep(.2)
   info=js("""(()=>{const d=document.querySelector('iframe').contentDocument,c=d.querySelector('.conversation'),b=d.querySelector('.web-chat-panel');c.scrollTop=0;c.scrollTop=100;return {height:b.clientHeight,scrolls:c.scrollTop>0,scrollHeight:c.scrollHeight,clientHeight:c.clientHeight,overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth,font:d.defaultView.getComputedStyle(d.querySelector('.answer-paragraph')).fontSize}})()""")
   assert info['height']>=700 and info['scrolls'] and not info['overflow'],info
  else:
   info=js("""(()=>{const d=document.querySelector('iframe').contentDocument,t=d.querySelector('.learning-step strong'),s=d.querySelector('.learning-step small');return {font:d.defaultView.getComputedStyle(t).fontSize,statusFont:d.defaultView.getComputedStyle(s).fontSize,overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()""")
   assert not info['overflow'] and float(info['font'][:-2])>=20,info
  shot(route+'-'+str(width));results.append({'route':route,'width':width,**info})
 (out/('核对-'+str(width)+'.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(results,ensure_ascii=False))
finally:ws.close()
