from pathlib import Path
import json,time,sys
prefix=Path('E:/CMIT/v2/tools/核对地图与场馆封面.py').read_text(encoding='utf-8').split("call('Page.enable')")[0].replace('docs/地图与场馆封面核对','docs/足迹地点大字核对').replace('9246','9247')
exec(prefix)
call('Page.enable');call('Runtime.enable');call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True})
results=[]
try:
 for width in [int(sys.argv[1]) if len(sys.argv)>1 else 1440]:
  call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False})
  call('Page.navigate',{'url':'http://127.0.0.1:3210/#/pages/radar/index'})
  wait("document.querySelector('iframe')?.contentWindow?.radar")
  time.sleep(2)
  wait("document.querySelector('iframe')?.contentDocument?.querySelector('#places .place-title')")
  info=js("""(()=>{const d=document.querySelector('iframe').contentDocument,s=e=>{const c=d.defaultView.getComputedStyle(e);return {size:c.fontSize,weight:c.fontWeight}};return {name:s(d.querySelector('.place-title')),address:s(d.querySelector('#places .muted')),overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()""")
  assert not info['overflow'] and info['address']['weight']=='700',info
  results.append({'width':width,'page':'list',**info});shot('地点名单-'+str(width))
  for ident in ['PLACE-WX-LDY','PLACE-WX-QBC','PLACE-CZ-QQB','PLACE-CZ-ZTL','PLACE-WX-ZWT']:
   js('document.querySelector("iframe").contentWindow.place('+json.dumps(ident)+')')
   wait("document.querySelector('iframe')?.contentDocument?.querySelector('.venue-story')")
   info=js("""(()=>{const d=document.querySelector('iframe').contentDocument,p=d.querySelector('.venue-story p'),s=d.defaultView.getComputedStyle(p);return {font:s.fontSize,weight:s.fontWeight,overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()""")
   assert not info['overflow'] and info['weight']=='700',info
   results.append({'width':width,'place':ident,**info})
   shot(ident+'-'+str(width))
 (out/('核对结果-'+str(width)+'.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(results,ensure_ascii=False))
finally:ws.close()
