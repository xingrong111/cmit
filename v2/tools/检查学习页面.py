import urllib.request,json,websocket,time,base64,pathlib
root=pathlib.Path(__file__).resolve().parents[1];info=json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:9227/json/new?about:blank',method='PUT'),timeout=10));ws=websocket.create_connection(info['webSocketDebuggerUrl'],suppress_origin=True,timeout=20);seq=0

def call(method,params={}):
 global seq
 seq+=1;ws.send(json.dumps({'id':seq,'method':method,'params':params}))
 while True:
  x=json.loads(ws.recv())
  if x.get('id')==seq:return x.get('result',{})
def js(s):return call('Runtime.evaluate',{'expression':s,'awaitPromise':True,'returnByValue':True}).get('result',{}).get('value')
call('Emulation.setDeviceMetricsOverride',{'width':390,'height':900,'deviceScaleFactor':1,'mobile':True});call('Page.navigate',{'url':'http://127.0.0.1:3110/?learningcheck=1#/pages/learning/index'});time.sleep(1);js("localStorage.removeItem('yingji_token')");call('Page.reload',{});time.sleep(1)
for i in range(40):
 if js("!!document.querySelector('iframe')?.contentDocument?.querySelector('[data-level]')&&document.querySelector('iframe').contentDocument.body.innerText.includes('学习挑战')"):break
 time.sleep(.2)
assert js("document.querySelector('iframe').contentDocument.body.innerText.includes('学习挑战')")
(root/'docs/页面截图/学习大厅.png').write_bytes(base64.b64decode(call('Page.captureScreenshot',{})['data']))
js("document.querySelector('iframe').contentDocument.querySelector('[data-level]').click()");time.sleep(.8)
for i in range(30):
 if js("!!document.querySelector('iframe')?.contentDocument?.querySelector('#loginBtn')"):break
 time.sleep(.2)
assert js("!!document.querySelector('iframe').contentDocument.querySelector('#loginBtn')")
js("(()=>{const d=document.querySelector('iframe').contentDocument;d.querySelector('#email').value='learner@yingji.local';d.querySelector('#password').value='LearnMe!2026';d.querySelector('#loginBtn').click()})()");time.sleep(1)
for i in range(30):
 if js("document.querySelector('iframe')?.src?.includes('/modules/learning/')"):break
 time.sleep(.2)
assert js("document.querySelector('iframe').src.includes('/modules/learning/')")
assert js('document.documentElement.scrollWidth<=390')
(root/'docs/学习页面检查.json').write_text(json.dumps({'lobbyLoaded':True,'anonymousChallengeOpensLogin':True,'loginReturnsToLearning':True,'mobileNoHorizontalOverflow':True,'deviceTest':False},indent=2),encoding='utf-8');print('learning web checks passed');ws.close()
