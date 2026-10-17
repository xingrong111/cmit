from pathlib import Path
import urllib.request,json,websocket,time,base64,sys
sys.stdout.reconfigure(encoding='utf-8')
r=Path(__file__).resolve().parents[1];shots=r/'docs/合并页面截图';shots.mkdir(exist_ok=True)
info=json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:9227/json/new?about:blank',method='PUT'),timeout=10))
ws=websocket.create_connection(info['webSocketDebuggerUrl'],suppress_origin=True,timeout=30);seq=0
def call(method,p=None):
 global seq
 seq+=1;ws.send(json.dumps({'id':seq,'method':method,'params':p or {}}))
 while True:
  result=json.loads(ws.recv())
  if result.get('id')==seq:
   if 'error' in result:raise RuntimeError(result['error'])
   return result.get('result',{})
def js(code):
 result=call('Runtime.evaluate',{'expression':code,'returnByValue':True,'awaitPromise':True})
 if 'exceptionDetails' in result:raise RuntimeError(result['exceptionDetails'])
 return result.get('result',{}).get('value')
def wait(code):
 for _ in range(100):
  if js('Boolean('+code+')'):return
  time.sleep(.15)
 raise AssertionError(code)
def nav(route):call('Page.navigate',{'url':'http://127.0.0.1:3110/?mergecheck=20261015#/pages/'+route});time.sleep(.4)
def size(width):call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':width<650})
def shot(name):(shots/name).write_bytes(base64.b64decode(call('Page.captureScreenshot',{})['data']))
call('Runtime.enable');call('Page.enable')
results=[]
for width in [390,1366]:
 size(width);nav('home/index');wait("document.querySelectorAll('.atlas-directory uni-button').length===34")
 wait("document.querySelector('canvas')?.getContext('2d').getImageData(0,0,document.querySelector('canvas').width,document.querySelector('canvas').height).data.some(x=>x>0)")
 wait("!document.querySelector('.atlas-loading')")
 assert js('document.documentElement.scrollWidth<='+str(width)),('overflow',width)
 js("document.querySelector('.atlas-tools uni-button').click()")
 wait("document.querySelector('.atlas-legend').innerText.includes('135%')")
 js("document.querySelectorAll('.atlas-tools uni-button')[2].click()")
 wait("document.querySelector('.atlas-legend').innerText.includes('100%')")
 shot('首页地图-'+str(width)+'.png')
 js("document.querySelector('.atlas-selection .outline').click()")
 js("[...document.querySelectorAll('.atlas-directory uni-button')].find(b=>b.innerText.includes('江苏')).click()")
 js("document.querySelector('[data-open-province]').click()")
 wait("location.hash.includes('/pages/province/index?code=320000')&&document.querySelector('.registry-grid')")
 assert js("document.querySelector('.registry-cover').innerText.includes('江苏省')")
 assert js("document.querySelector('.registry-grid').querySelectorAll('.registry-card').length>0")
 shot('分省名单-'+str(width)+'.png')
 js("document.querySelector('.registry-card').click()")
 wait("location.hash.includes('/pages/registry/index?id=')&&document.querySelector('.identity-grid')")
 assert js("document.body.innerText.includes('待独立复核')")
 assert js('document.documentElement.scrollWidth<='+str(width))
 for route,title,selector in [('people/index','人物索引','.people-grid'),('person/index?id=P004','人物档案','.person-shortcuts'),('learning/index?group=SZZ','学习挑战','.stage-card'),('radar/index','历史足迹','#places'),('assistant/index','小迹导览','#question'),('account/index','账户','.content')]:
  nav(route)
  if route.startswith(('people','person')):wait('!!document.querySelector('+json.dumps(selector)+')')
  else:
   wait('!!document.querySelector("iframe")?.contentDocument?.querySelector('+json.dumps(selector)+')')
   assert js('document.querySelector("iframe").contentDocument.documentElement.scrollWidth<='+str(width)),(title,'iframe overflow',width)
   css=js("getComputedStyle(document.querySelector('iframe').contentDocument.documentElement).getPropertyValue('--red').trim()")
   assert css.lower()=='#982b28',(title,css)
  assert js('document.documentElement.scrollWidth<='+str(width)),(title,width)
  if route.startswith(('learning','radar','assistant','account')):shot(title+'-'+str(width)+'.png')
  results.append({'width':width,'page':title,'passed':True})
(r/'docs/合并页面验证.json').write_text(json.dumps({'checks':results,'mapCanvasPainted':True,'zoomReset':True,'provinceNavigation':True,'recordNavigation':True,'countDisclaimer':True,'deviceTest':False},ensure_ascii=False,indent=2),encoding='utf-8')
print('页面检查通过：手机和桌面布局、地图缩放、分省名单、人物、学习、足迹、小迹、账户。');ws.close()
