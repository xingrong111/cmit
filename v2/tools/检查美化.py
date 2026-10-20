import urllib.request,json,websocket,time,base64,pathlib
root=pathlib.Path(__file__).resolve().parents[1];info=json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:9226/json/new?about:blank',method='PUT')));ws=websocket.create_connection(info['webSocketDebuggerUrl'],suppress_origin=True,timeout=20);seq=0

def call(method,params={}):
 global seq
 seq+=1;ws.send(json.dumps({'id':seq,'method':method,'params':params}))
 while True:
  x=json.loads(ws.recv())
  if x.get('id')==seq:return x.get('result',{})
def js(s):return call('Runtime.evaluate',{'expression':s,'awaitPromise':True,'returnByValue':True}).get('result',{}).get('value')
def visit(page,width=390):
 call('Emulation.setDeviceMetricsOverride',{'width':width,'height':900,'deviceScaleFactor':1,'mobile':width<500});call('Page.navigate',{'url':'http://127.0.0.1:3110/?test='+str(time.time())+'#/pages/'+page});time.sleep(2)
 for _ in range(30):
  if js("!!document.querySelector('iframe')?.contentDocument?.querySelector('#screen')"):break
  time.sleep(.25)
rows=[]
for width in [390,1440]:
 visit('assistant/index',width)
 row=js("(()=>{const f=document.querySelector('iframe'),d=f.contentDocument,q=d.querySelector('#question'),r=q?.getBoundingClientRect();return {viewport:innerWidth,outerWidth:document.documentElement.scrollWidth,frameWidth:d.documentElement.scrollWidth,frameViewport:f.clientWidth,textarea:q?.tagName,composerWidth:d.querySelector('.composer')?.getBoundingClientRect().width,questionWidth:r?.width,bottomNavVisible:!!document.querySelector('uni-tabbar')&&getComputedStyle(document.querySelector('uni-tabbar')).display!=='none',preferencesFolded:!d.querySelector('.preference-panel')?.open};})()")
 assert row['textarea']=='TEXTAREA';assert row['outerWidth']<=width;assert row['frameWidth']<=row['frameViewport'];rows.append(row)
 (root/'docs/页面截图'/('小迹美化-'+str(width)+'.png')).write_bytes(base64.b64decode(call('Page.captureScreenshot',{})['data']))
visit('radar/index')
js("document.querySelector('iframe').contentWindow.eval(\"state.stops=['PLACE-WX-QBC','PLACE-WX-ZWT'];go('route');\")");time.sleep(2)
assert js("document.querySelector('iframe').contentDocument.querySelector('[data-action=down]')!==null")
js("document.querySelector('iframe').contentDocument.querySelector('[data-action=down]').click()");time.sleep(.6)
assert js("document.querySelector('iframe').contentWindow.eval(\"state.stops[0]==='PLACE-WX-ZWT'\")")
assert js("document.querySelector('iframe').contentDocument.querySelector('.ink-map-origin')!==null")
(root/'docs/页面截图/路线美化.png').write_bytes(base64.b64decode(call('Page.captureScreenshot',{})['data']))
# Synthetic GPS checks the client workflow without requesting the tester's real position or spending provider quota.
js("document.querySelector('iframe').contentWindow.eval(\"const originalAPI=api;api=(p,o)=>p==='position'?(window.gpsInput=JSON.parse(o.body),Promise.resolve({latitude:31.574,longitude:120.3,type:'gcj02'})):originalAPI(p,o);navigator.geolocation.getCurrentPosition=success=>success({coords:{latitude:31.57,longitude:120.29,accuracy:20}});locateBrowser();\")");time.sleep(.8)
assert js("document.querySelector('iframe').contentWindow.eval(\"gpsInput.type==='wgs84'&&state.routeOrigin.type==='gcj02'\")")
(root/'docs/美化页面检查.json').write_text(json.dumps({'layouts':rows,'routeDownReorders':True,'originConfirmationPresent':True,'browserGPSWorkflowWithSyntheticData':True,'realGPS':False},ensure_ascii=False,indent=2),encoding='utf-8');print('visual and workflow checks passed');ws.close()
