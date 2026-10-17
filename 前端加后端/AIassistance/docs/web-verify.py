import base64,json,time,urllib.request,pathlib
import websocket

out=pathlib.Path('E:/CMIT/output/member4-web');out.mkdir(parents=True,exist_ok=True)
req=urllib.request.Request('http://127.0.0.1:9225/json/new?about:blank',method='PUT')
target=json.load(urllib.request.urlopen(req))
ws=websocket.create_connection(target['webSocketDebuggerUrl'],suppress_origin=True,timeout=25)
counter=0;errors=[]
def command(method,params=None):
 global counter
 counter+=1;key=counter;ws.send(json.dumps({'id':key,'method':method,'params':params or {}}))
 while True:
  r=json.loads(ws.recv())
  if r.get('method')=='Runtime.exceptionThrown':errors.append(r['params']['exceptionDetails'])
  if r.get('id')==key:
   if 'error' in r:raise RuntimeError(r['error'])
   return r.get('result',{})
def evaluate(expr):
 r=command('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':True})
 if r.get('exceptionDetails'):raise RuntimeError(r['exceptionDetails'])
 return r.get('result',{}).get('value')
def screenshot(name):
 r=command('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})
 (out/(name+'.png')).write_bytes(base64.b64decode(r['data']))
command('Page.enable');command('Runtime.enable')
command('Emulation.setDeviceMetricsOverride',{'width':1440,'height':1100,'deviceScaleFactor':1,'mobile':False})
command('Page.navigate',{'url':'http://127.0.0.1:3104/web/'})
time.sleep(1.8)
results={}
for page in ['assistant','radar','route']:
 evaluate('go('+json.dumps(page)+')');time.sleep(.8)
 results[page]=evaluate('({page:state.page,layout:!!document.querySelector(".web-'+('assistant' if page=='assistant' else page)+'-layout"),width:innerWidth,scrollWidth:document.documentElement.scrollWidth,loading:!!document.querySelector("#places.loading,#stops.loading"),title:document.querySelector(".hero h2")?.textContent})')
 screenshot(page+'-desktop')
evaluate("go('radar')");time.sleep(.6)
results['add']=evaluate("document.querySelector('#places [data-action=add]').click();({stops:state.stops.length,badge:document.querySelector('.route-count').textContent})")
evaluate("go('route')");time.sleep(.6)
results['routeCards']=evaluate("document.querySelectorAll('.route-stop').length")
screenshot('route-selected-desktop')
evaluate("place(state.stops[0])");time.sleep(.6)
results['place']=evaluate("({title:document.querySelector('.hero h2').textContent,layout:!!document.querySelector('.web-detail-layout'),sources:document.querySelectorAll('.source').length})")
screenshot('place-desktop')
evaluate("go('assistant')");time.sleep(.2)
# Local deterministic UI response; no actual model call or fabricated historical citation.
evaluate("window.webSavedFetch=window.fetch;window.fetch=(url,options)=>url==='/api/chat'?Promise.resolve(new Response(JSON.stringify({answer:'这是网页对话排版测试回复。',presentation:{kind:'chat',paragraphs:['这是网页对话排版测试回复。']},citations:[],actions:[],modelNotice:'测试响应'}),{status:200,headers:{'Content-Type':'application/json'}})):webSavedFetch(url,options)")
evaluate("ask('测试网页对话')");time.sleep(.3)
results['chat']=evaluate("({messages:state.messages.length,busy:state.busy,text:document.querySelectorAll('.answer-paragraph')[1].textContent,layout:!!document.querySelector('.web-assistant-layout')})")
evaluate("document.querySelector('[data-action=edit-message]').click()")
results['edit']=evaluate("document.querySelector('#question').value")
screenshot('chat-desktop')
command('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
for page in ['assistant','radar','route']:
 evaluate('go('+json.dumps(page)+')');time.sleep(.5)
 results[page+'Mobile']=evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth})')
 screenshot(page+'-mobile')
results['exceptions']=[e for e in errors if not e.get('url','').startswith('chrome-extension://')]
results['externalExtensionExceptions']=[e for e in errors if e.get('url','').startswith('chrome-extension://')]
(out/'浏览器验证.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results,ensure_ascii=False));ws.close()

