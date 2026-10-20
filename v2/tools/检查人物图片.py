import urllib.request,json,websocket,time,base64
from pathlib import Path
root=Path(__file__).resolve().parents[1]
info=json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:9227/json/new?about:blank',method='PUT'),timeout=10))
ws=websocket.create_connection(info['webSocketDebuggerUrl'],suppress_origin=True,timeout=30);seq=0
def call(m,p={}):
 global seq
 seq+=1;ws.send(json.dumps({'id':seq,'method':m,'params':p}))
 while True:
  x=json.loads(ws.recv())
  if x.get('id')==seq:return x.get('result',{})
def js(s):return call('Runtime.evaluate',{'expression':s,'returnByValue':True}).get('result',{}).get('value')
def wait(s):
 for _ in range(100):
  if js(s):return
  time.sleep(.2)
 raise AssertionError(s)
def nav(url):call('Page.navigate',{'url':url});time.sleep(.6)
def shot(name):
 time.sleep(.4)
 d=root/'docs/页面截图';d.mkdir(exist_ok=True)
 (d/name).write_bytes(base64.b64decode(call('Page.captureScreenshot',{})['data']))

call('Emulation.setDeviceMetricsOverride',{'width':390,'height':900,'deviceScaleFactor':1,'mobile':True})
nav('http://127.0.0.1:3110/?portraitcheck=1#/pages/people/index')
wait("document.querySelectorAll('.portrait-placeholder').length===15")
assert js("document.querySelectorAll('.portrait-photo').length===0")
assert js("document.documentElement.scrollWidth<=390")
shot('人物索引-肖像占位.png')
nav('http://127.0.0.1:3110/?portraitcheck=2#/pages/person/index?id=P004')
wait("!!document.querySelector('.portrait-cover')")
assert js("document.querySelector('.portrait-cover').getBoundingClientRect().height>=200")
assert js("document.documentElement.scrollWidth<=390")
shot('人物档案-肖像占位.png')
nav('http://127.0.0.1:3110/?portraitcheck=3#/pages/home/index')
wait("document.querySelectorAll('.portrait-panel').length>=3")
(root/'docs/人物图片检查.json').write_text(json.dumps({'index15Placeholders':True,'noUnverifiedPhotos':True,'profilePortraitArea':True,'homeSharedPortrait':True,'mobileNoOverflow':True,'deviceTest':False},indent=2),encoding='utf-8')
print('人物图片页面检查通过');ws.close()
