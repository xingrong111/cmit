import urllib.request,json,websocket,time,base64,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
info=json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:9226/json/new?about:blank',method='PUT')));ws=websocket.create_connection(info['webSocketDebuggerUrl'],suppress_origin=True,timeout=20);seq=0
def call(method,params={}):
 global seq
 seq+=1;ws.send(json.dumps({'id':seq,'method':method,'params':params}))
 while True:
  x=json.loads(ws.recv())
  if x.get('id')==seq:return x.get('result',{})
def js(s):return call('Runtime.evaluate',{'expression':s,'awaitPromise':True,'returnByValue':True}).get('result',{}).get('value')
def visit(page,width=390):
 call('Emulation.setDeviceMetricsOverride',{'width':width,'height':900,'deviceScaleFactor':1,'mobile':width<500});call('Page.navigate',{'url':'http://127.0.0.1:3110/?check='+str(time.time())+'#/pages/'+page});time.sleep(2)
for page in ['home/index','radar/index','assistant/index']:
 visit(page);assert js('document.documentElement.scrollWidth<=390');assert js('document.querySelectorAll("uni-tabbar .uni-tabbar__item").length===5')
visit('discussion/index?topicId=NO-TOPIC');assert js("document.querySelector('iframe').contentDocument.body.innerText.includes('该主题不存在')")
js("location.hash='/pages/discussion/index?topicId=P014'");time.sleep(2);assert js("document.querySelector('iframe').contentDocument.body.innerText.includes('陆定一')")
js("document.querySelector('iframe').contentWindow.eval(\"go('login')\")");time.sleep(.6)
js("(()=>{const d=document.querySelector('iframe').contentDocument;d.querySelector('#email').value='learner@yingji.local';d.querySelector('#password').value='LearnMe!2026';d.querySelector('#loginBtn').click()})()");time.sleep(.8)
assert js("document.querySelector('iframe').contentDocument.querySelector('#commentText')!==null")
assert js("document.querySelector('iframe').contentDocument.body.innerText.includes('陆定一')")
(root/'docs/页面截图/讨论修复.png').write_bytes(base64.b64decode(call('Page.captureScreenshot',{})['data']))
(root/'docs/功能复查.json').write_text(json.dumps({'tabs':5,'mobileOverflow':False,'invalidTopicDoesNotFallback':True,'correctPersonTopic':True,'topicSwitchWithoutReload':True,'loginReturnsToDiscussion':True,'nativeDeviceTest':False},indent=2),encoding='utf-8');print('browser functional checks passed');ws.close()
