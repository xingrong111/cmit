from pathlib import Path
import urllib.request, json, websocket, time, base64, hashlib

out=Path('E:/CMIT/v2/docs/路线阅读修复核对')
out.mkdir(parents=True,exist_ok=True)
target=json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:9252/json/new?about:blank',method='PUT'),timeout=10))
ws=websocket.create_connection(target['webSocketDebuggerUrl'],suppress_origin=True,timeout=30)
seq=0
def call(method,params=None):
 global seq
 seq+=1
 ws.send(json.dumps({'id':seq,'method':method,'params':params or {}}))
 while True:
  r=json.loads(ws.recv())
  if r.get('id')==seq:
   if 'error' in r:raise RuntimeError(r['error'])
   return r.get('result',{})
def js(code):
 r=call('Runtime.evaluate',{'expression':code,'returnByValue':True,'awaitPromise':True})
 if 'exceptionDetails' in r:raise RuntimeError(r['exceptionDetails'])
 return r.get('result',{}).get('value')
def wait(code):
 for _ in range(100):
  if js('Boolean('+code+')'):return
  time.sleep(.15)
 raise AssertionError(code)
def shot(name):
 (out/(name+'.png')).write_bytes(base64.b64decode(call('Page.captureScreenshot',{})['data']))

call('Page.enable');call('Runtime.enable');call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True})
call('Page.navigate',{'url':'http://127.0.0.1:3210/#/pages/home/index'});time.sleep(1);js("sessionStorage.setItem('yingji:entry-choice','guest')");call('Page.reload');time.sleep(1)
result=[]
for width in [1440,390]:
 call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False})
 for route,selector in [('sources/index?id=P009','.source-card'),('event/index','.event-reading'),('guide/index','.qs-steps')]:
  call('Page.navigate',{'url':'http://127.0.0.1:3210/#/pages/'+route});time.sleep(.3);call('Page.reload');wait("document.querySelector("+json.dumps(selector)+")");time.sleep(.5)
  info=js("({width:innerWidth,scroll:document.documentElement.scrollWidth})");assert info['scroll']<=info['width'],(route,info)
  if route.startswith('sources'):assert js("parseInt(getComputedStyle(document.querySelector('.source-title')).fontWeight)>=600") and not js("document.querySelector('.source-card-boundary')")
  if route.startswith('event'):print(js("({note:document.body.innerText.includes('书签仅存本机'),size:getComputedStyle(document.querySelector('.event-cover-meta uni-text')).fontSize})"),flush=True);assert not js("document.body.innerText.includes('书签仅存本机')");assert js("parseFloat(getComputedStyle(document.querySelector('.event-cover-meta uni-text')).fontSize)>=19");js("document.querySelector('.event-context').scrollIntoView({block:'center'})")
  if route.startswith('guide'):assert js("parseInt(getComputedStyle(document.querySelector('.qs-step-title')).fontWeight)>=600")
  shot(route.split('/')[0]+'-'+str(width));result.append({'route':route,**info})
(out/'reading-check.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8');print('Sources/event/guide typography, removals and responsive widths passed');ws.close()
