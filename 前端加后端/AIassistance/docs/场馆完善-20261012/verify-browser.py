import json,base64,time,pathlib,urllib.request
import websocket
out=pathlib.Path('E:/CMIT/output/venue-improvements-20261012');out.mkdir(parents=True,exist_ok=True)
target=json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:9225/json/new?about:blank',method='PUT')))
ws=websocket.create_connection(target['webSocketDebuggerUrl'],suppress_origin=True,timeout=20);seq=0;errors=[]
def cmd(name,p=None):
 global seq
 seq+=1;ws.send(json.dumps({'id':seq,'method':name,'params':p or {}}))
 while True:
  r=json.loads(ws.recv())
  if r.get('method')=='Runtime.exceptionThrown':
   e=r['params']['exceptionDetails']
   if not e.get('url','').startswith('chrome-extension://'):errors.append(e)
  if r.get('id')==seq:return r.get('result',{})
def ev(x):
 r=cmd('Runtime.evaluate',{'expression':x,'returnByValue':True,'awaitPromise':True})
 if r.get('exceptionDetails'):raise RuntimeError(r['exceptionDetails'])
 return r.get('result',{}).get('value')
def shot(name):
 ev('scrollTo(0,0)');(out/(name+'.png')).write_bytes(base64.b64decode(cmd('Page.captureScreenshot',{'format':'png'})['data']))
cmd('Page.enable');cmd('Runtime.enable');cmd('Emulation.setDeviceMetricsOverride',{'width':1440,'height':1100,'deviceScaleFactor':1,'mobile':False})
cmd('Page.navigate',{'url':'http://127.0.0.1:3104/web/#place/PLACE-CZ-QQB'});time.sleep(1)
for _ in range(20):
 if ev("typeof state!=='undefined' && state.current?.id==='PLACE-CZ-QQB'"):break
 time.sleep(.2)
results={'directLink':ev("({page:state.page,id:state.current?.id})")}
for pid in ['PLACE-CZ-QQB','PLACE-CZ-ZTL','PLACE-WX-ZWT','PLACE-WX-LDY','PLACE-WX-QBC']:
 ev('place('+json.dumps(pid)+')');time.sleep(.25)
 results[pid]=ev("({serviceRows:document.querySelectorAll('.venue-service-row').length,contacts:document.querySelectorAll('.venue-call').length,hasPhoto:!!document.querySelector('.venue-photo img'),imageLoaded:document.querySelector('.venue-photo img')?.naturalWidth||0,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,navigationReady:state.current.navigationReady})")
 btn=ev("!!document.querySelector('[data-action=visitor-source]')")
 if btn:
  ev("document.querySelector('[data-action=visitor-source]').click()")
  results[pid]['sourceOpen']=ev("!document.querySelector('#visitor-evidence').hidden && document.querySelector('#visitor-evidence details').open")
 if pid in ['PLACE-CZ-QQB','PLACE-WX-ZWT']:shot(pid+'-desktop')
cmd('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
ev("place('PLACE-CZ-QQB')");time.sleep(.4);shot('qqb-mobile');results['mobile']=ev("({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,imageLoaded:document.querySelector('.venue-photo img').naturalWidth})")
cmd('Page.navigate',{'url':'http://127.0.0.1:3100/'});time.sleep(.5);ev("place('PLACE-CZ-QQB')");time.sleep(.4);shot('original-preview-qqb');results['originalPreview']=ev("({rows:document.querySelectorAll('.venue-service-row').length,imageLoaded:document.querySelector('.venue-photo img')?.naturalWidth||0})")
results['exceptions']=errors;(out/'浏览器验证.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(results,ensure_ascii=False));ws.close()
