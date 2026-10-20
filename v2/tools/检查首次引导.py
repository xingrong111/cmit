"""在独立测试浏览器9235中验证引导；不创建学习、账户或荣誉记录。"""
import urllib.request,json,websocket,time,base64
from pathlib import Path

out=Path(__file__).resolve().parents[1]/'docs/首次引导检查'
out.mkdir(exist_ok=True)
op=urllib.request.build_opener(urllib.request.ProxyHandler({}))
info=json.load(op.open(urllib.request.Request('http://127.0.0.1:9235/json/new?about:blank',method='PUT'),timeout=5))
ws=websocket.create_connection(info['webSocketDebuggerUrl'],suppress_origin=True,timeout=20,http_no_proxy=['127.0.0.1','localhost'])
seq=0
def cmd(method,params=None):
 global seq
 seq+=1;ws.send(json.dumps({'id':seq,'method':method,'params':params or {}}))
 while True:
  row=json.loads(ws.recv())
  if row.get('id')==seq:
   if 'error' in row:raise RuntimeError(row['error'])
   return row.get('result',{})
def js(code):
 row=cmd('Runtime.evaluate',{'expression':code,'returnByValue':True,'awaitPromise':True})
 if 'exceptionDetails' in row:raise RuntimeError(row['exceptionDetails'])
 return row.get('result',{}).get('value')
def wait(code):
 for _ in range(80):
  if js('Boolean('+code+')'):return
  time.sleep(.12)
 raise AssertionError(code)
def click(code):
 js(code+'.click()');time.sleep(.15)
def size(width,height):
 cmd('Emulation.setDeviceMetricsOverride',{'width':width,'height':height,'deviceScaleFactor':1,'mobile':width<650})
def shot(name):
 (out/name).write_bytes(base64.b64decode(cmd('Page.captureScreenshot')['data']))
cmd('Page.enable')
cmd('Page.navigate',{'url':'http://127.0.0.1:3110/#/pages/guide/index'})
wait('document.querySelector(".handbook-cover")')
print('指南页已加载',flush=True)
backup=js('Object.fromEntries(["shanhe:guide:v1","shanhe:guide:v2","shanhe:guide:open"].map(k=>[k,localStorage.getItem(k)]))')
try:
 js('["shanhe:guide:v1","shanhe:guide:v2","shanhe:guide:open"].forEach(k=>localStorage.removeItem(k))')
 cmd('Page.navigate',{'url':'http://127.0.0.1:3110/#/pages/home/index'})
 wait('document.querySelector(".welcome-dialog")')
 original=js('location.hash');size(1366,900);shot('四步欢迎-1366.png')
 click('document.querySelector(".welcome-next")');assert js('location.hash')==original
 click('document.querySelector(".welcome-prev")')
 assert js('document.querySelector("#welcome-title").textContent')=='你的第一段山河之旅'
 for width,height in [(390,844),(844,390)]:
  size(width,height);time.sleep(.2)
  assert js('document.documentElement.scrollWidth<=innerWidth')
  assert js('document.querySelector(".welcome-footer").getBoundingClientRect().bottom<=innerHeight')
  shot('欢迎导览-'+str(width)+'.png')
 click('document.querySelector(".welcome-top uni-button")')
 wait('!document.querySelector(".welcome-mask")')
 assert js('JSON.parse(localStorage.getItem("shanhe:guide:v2")).data.status')=='skipped'
 assert js('document.body.style.overflow')!='hidden'
 cmd('Page.reload');time.sleep(1.5)
 assert not js('document.querySelector(".welcome-mask")')
 print('首次提示、上一步、跳过与刷新抑制通过',flush=True)
 cmd('Page.navigate',{'url':'http://127.0.0.1:3110/#/pages/me/index'})
 wait('document.querySelector(".account-menu")')
 click('[...document.querySelectorAll(".account-menu uni-button")].find(x=>x.innerText.includes("使用指南"))')
 wait('document.querySelector(".handbook-cover")')
 assert js('document.querySelectorAll(".handbook-feature").length')==7
 for width,height in [(1366,900),(390,844)]:
  size(width,height);time.sleep(.3)
  assert js('document.documentElement.scrollWidth<=innerWidth')
  shot('使用指南-'+str(width)+'.png')
 click('document.querySelector(".handbook-cover uni-button")')
 wait('document.querySelector(".welcome-dialog")')
 for _ in range(3):click('document.querySelector(".welcome-next")')
 assert js('document.querySelectorAll(".welcome-choices uni-button").length')==3
 click('document.querySelectorAll(".welcome-choices uni-button")[1]')
 shot('选择旅程-390.png')
 click('document.querySelector(".welcome-next")')
 wait('location.hash.includes("/pages/ip/index?group=SZZ")')
 assert js('JSON.parse(localStorage.getItem("shanhe:guide:v2")).data.status')=='completed'
 assert js('document.body.style.overflow')!='hidden'
 print('通过：我的入口、7模块指南、手机/横屏布局、手动重看与全景选择跳转。',flush=True)
 (out/'检查结果.json').write_text(json.dumps({'passed':True,'widths':[1366,390,844],'firstVisit':True,'skipAndCompleteSeparated':True,'replay':True,'realLearningRecordsChanged':False,'miniRealDevice':False},ensure_ascii=False,indent=2),encoding='utf-8')
finally:
 js('for(const [k,v] of Object.entries('+json.dumps(backup)+')){if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}')
 ws.close()
