from pathlib import Path
import urllib.request, json, websocket, time, base64, hashlib

out=Path('E:/CMIT/v2/docs/v2.2核对')
out.mkdir(parents=True,exist_ok=True)
target=json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:9251/json/new?about:blank',method='PUT'),timeout=10))
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

call('Page.enable');call('Runtime.enable')
def nav(route,sel):
 call('Page.navigate',{'url':'http://127.0.0.1:3210/#/pages/'+route});time.sleep(.2);call('Page.reload');time.sleep(.5);wait("document.querySelector("+json.dumps(sel)+")");time.sleep(.5)
try:
 nav('home/index','.app-shell');js("sessionStorage.setItem('yingji:entry-choice','guest')");call('Page.reload');time.sleep(1)
 result=[]
 for width in [1440,390]:
  call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False})
  nav('province/index?code=320000','.province-name-grid .name-record')
  info=js("({overflow:document.documentElement.scrollWidth>innerWidth,cards:[...document.querySelectorAll('.province-name-grid .registry-name')].map(e=>({text:e.innerText,width:e.clientWidth,height:e.clientHeight}))})")
  assert not info['overflow'],info
  assert all(x['width']>50 and x['height']<90 for x in info['cards']),info
  shot('province-'+str(width));result.append({'width':width,'province':info})
  nav('sources/index?id=P009','.source-card');assert not js("document.querySelector('.source-card-boundary')");assert not js('document.documentElement.scrollWidth>innerWidth');shot('sources-'+str(width))
  nav('person/index?id=P003','#person-next');assert js("document.querySelector('#person-next').innerText.includes('发表评论')");assert not js("document.querySelector('.site-note')")
 for g in ['QQB','LYS','SZZ','LDY','JZY']:
  nav('ip/index?group='+g,'#ip-intro');wait("document.querySelector('#ip-intro').nextElementSibling.innerText.length>20")
  info=js("({group:"+json.dumps(g)+",text:document.querySelector('#ip-intro').nextElementSibling.innerText,scene:document.querySelector('.person-panorama-frame,iframe')?.getAttribute('src'),facts:document.querySelectorAll('.fact-card').length})")
  assert info['scene'] and info['facts']>0,info;result.append(info)
 nav('learning/index','iframe');wait("document.querySelector('iframe').contentDocument?.querySelector('[data-discussion]')")
 js("document.querySelector('iframe').contentDocument.querySelector('[data-discussion]').click()");wait("location.hash.includes('/pages/discussion/')");result.append({'learningCommentNavigation':True})
 (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8');print('v2.2 directory, sources, five IP text/VR and comment entry passed',flush=True)
finally:ws.close()
