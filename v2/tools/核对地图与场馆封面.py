from pathlib import Path
import urllib.request, json, websocket, time, base64, hashlib

out=Path('E:/CMIT/v2/docs/地图与场馆封面核对')
out.mkdir(parents=True,exist_ok=True)
target=json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:9246/json/new?about:blank',method='PUT'),timeout=10))
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
call('Page.enable');call('Runtime.enable');call('Network.enable')
call('Network.setCacheDisabled',{'cacheDisabled':True})
call('Emulation.setDeviceMetricsOverride',{'width':1440,'height':1000,'deviceScaleFactor':1,'mobile':False})
results=[]
try:
 call('Page.navigate',{'url':'http://127.0.0.1:3210/#/pages/home/index'})
 wait("document.querySelector('.atlas-stage') && !document.querySelector('.atlas-loading')")
 js("document.querySelector('.atlas-stage').scrollIntoView({block:'center'})")
 time.sleep(.4)
 r=js("(()=>{const r=document.querySelector('.atlas-stage').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()")
 call('Input.dispatchMouseEvent',{'type':'mouseWheel','x':r['x'],'y':r['y'],'deltaY':-180,'deltaX':0})
 wait("document.querySelector('.atlas-legend').innerText.includes('112%')")
 before=js("document.querySelector('canvas').toDataURL()")
 call('Input.dispatchMouseEvent',{'type':'mousePressed','x':r['x'],'y':r['y'],'button':'left','clickCount':1})
 call('Input.dispatchMouseEvent',{'type':'mouseMoved','x':r['x']+80,'y':r['y']+35,'button':'left','buttons':1})
 call('Input.dispatchMouseEvent',{'type':'mouseReleased','x':r['x']+80,'y':r['y']+35,'button':'left','clickCount':1})
 time.sleep(.4)
 assert before!=js("document.querySelector('canvas').toDataURL()"),'地图拖动未重绘'
 js("document.querySelector('[aria-label=复位地图]').click()")
 wait("document.querySelector('.atlas-legend').innerText.includes('100%')")
 js("document.querySelector('[aria-label=切换全屏]').click()")
 wait("document.querySelector('.atlas-fallback-full')")
 time.sleep(.4)
 rect=js("(()=>{const r=document.querySelector('.atlas-stage').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()")
 assert abs(rect['width']-1440)<2 and abs(rect['height']-1000)<2 and abs(rect['y'])<2,rect
 shot('首页地图全屏')
 call('Input.dispatchKeyEvent',{'type':'keyDown','key':'Escape','code':'Escape','windowsVirtualKeyCode':27})
 wait("!document.querySelector('.atlas-fallback-full')")
 assert not js('document.documentElement.scrollWidth>innerWidth')
 shot('首页地图')
 results.append({'page':'首页地图','wheelZoom':True,'drag':True,'reset':True,'fullscreen':True,'escapeExit':True})
 call('Page.navigate',{'url':'http://127.0.0.1:3210/#/pages/radar/index'})
 wait("document.querySelector('iframe')?.contentWindow?.place")
 for ident,name in [('PLACE-WX-LDY','陆定一祖居'),('PLACE-WX-QBC','秦邦宪故居'),('PLACE-CZ-QQB','瞿秋白纪念馆'),('PLACE-CZ-ZTL','张太雷纪念馆'),('PLACE-WX-ZWT','张闻天旧居')]:
  js('document.querySelector("iframe").contentWindow.place('+json.dumps(ident)+')')
  wait("document.querySelector('iframe').contentDocument.querySelector('.venue-cover-custom')")
  wait("document.querySelector('iframe').contentDocument.querySelector('.venue-cover-custom img')?.naturalWidth>0")
  time.sleep(.3)
  info=js("""(()=>{const d=document.querySelector('iframe').contentDocument,c=d.querySelector('.venue-cover-custom'),i=c.querySelector('img'),r=c.getBoundingClientRect();return {name:c.innerText,height:r.height,image:i.getAttribute('src'),imageWidth:i.naturalWidth,overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth,maskOpacity:getComputedStyle(c,':before').opacity}})()""")
  assert info['height']>=299,info
  assert not info['overflow'],info
  font=js("document.querySelector('iframe').contentDocument.fonts.load('56px 中华薪火体').then(x=>x.length)")
  assert font>0,'定制标题字体未加载'
  shot(name)
  results.append({'page':name,**info,'fontLoaded':True})
 (out/'核对结果.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(results,ensure_ascii=False))
finally:
 ws.close()
