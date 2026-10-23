from pathlib import Path
import json,time,urllib.request
prefix="from pathlib import Path\nimport urllib.request, json, websocket, time, base64, hashlib\n\nout=Path('E:/CMIT/v2/docs/封面与来源修复核对')\nout.mkdir(parents=True,exist_ok=True)\ntarget=json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:9254/json/new?about:blank',method='PUT'),timeout=10))\nws=websocket.create_connection(target['webSocketDebuggerUrl'],suppress_origin=True,timeout=30)\nseq=0\ndef call(method,params=None):\n global seq\n seq+=1\n ws.send(json.dumps({'id':seq,'method':method,'params':params or {}}))\n while True:\n  r=json.loads(ws.recv())\n  if r.get('id')==seq:\n   if 'error' in r:raise RuntimeError(r['error'])\n   return r.get('result',{})\ndef js(code):\n r=call('Runtime.evaluate',{'expression':code,'returnByValue':True,'awaitPromise':True})\n if 'exceptionDetails' in r:raise RuntimeError(r['exceptionDetails'])\n return r.get('result',{}).get('value')\ndef wait(code):\n for _ in range(100):\n  if js('Boolean('+code+')'):return\n  time.sleep(.15)\n raise AssertionError(code)\ndef shot(name):\n (out/(name+'.png')).write_bytes(base64.b64decode(call('Page.captureScreenshot',{})['data']))\n"

results=[]
for width in [1440,390]:
 for route,selector in [('guide/index','.qs-faq-answer'),('province/index?code=320000','.province-cover'),('sources/index?id=P001','.sources-cover'),('graph/index?id=P009','.graph-ready'),('person/index?id=P001','#person-next')]:
  exec(prefix,globals());call('Page.enable');call('Runtime.enable');call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True});call('Network.setBlockedURLs',{'urls':['*/panorama/*','*/vr/*']});call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False})
  try:
   call('Page.navigate',{'url':'http://127.0.0.1:3210/#/pages/'+route});wait("document.querySelector('.app-shell')");js("sessionStorage.setItem('yingji:entry-choice','guest');localStorage.removeItem('yingji:prefs')");call('Page.reload');wait("document.querySelector("+json.dumps(selector)+") && !document.querySelector('.entry-gate')");time.sleep(.6)
   assert not js('document.documentElement.scrollWidth>innerWidth'),(width,route)
   if route.startswith('guide'):assert js("parseFloat(getComputedStyle(document.querySelector('.qs-faq-answer')).fontSize)>=18");js("document.querySelector('.qs-faq').scrollIntoView({block:'center'})")
   if route.startswith('province'):assert not js("document.body.innerText.includes('江苏名单如何计算')||document.body.innerText.includes('全国名单6人')");assert js("decodeURIComponent(document.querySelector('.province-cover img').src).includes('人物档案纸页')")
   if route.startswith('sources'):print(js("({tag:document.body.innerText.includes('新增来源已读取相关段落'),bg:getComputedStyle(document.querySelector('.sources-cover')).backgroundImage})"),flush=True);assert not js("document.body.innerText.includes('新增来源已读取相关段落')");assert js("getComputedStyle(document.querySelector('.sources-cover')).backgroundImage.includes('archive-reading')")
   if route.startswith('graph'):assert not js("document.body.innerText.includes('每条联系保留原始方向')||document.body.innerText.includes('当前分类下的完整记录')")
   if route.startswith('person'):
    assert js("(()=>{const e=[...document.querySelectorAll('#person-next uni-button')].find(x=>x.innerText.includes('问小迹'));return getComputedStyle(e).whiteSpace==='nowrap'&&e.scrollWidth<=e.clientWidth+1})()")
    js("document.querySelector('#person-evidence').nextElementSibling.querySelector('uni-button').click()");wait("document.querySelector('.source-sheet .source-title')");assert js("parseInt(getComputedStyle(document.querySelector('.source-sheet .source-title')).fontWeight)>=600");assert not js("document.querySelector('.source-sheet').innerText.includes('新增来源已读取相关段落')")
   if width==1440 or route.startswith('person'):shot(route.split('/')[0]+'-'+str(width))
   results.append({'width':width,'route':route,'passed':True});print(width,route,'passed',flush=True)
  finally:
   ws.close()
   try:urllib.request.urlopen('http://127.0.0.1:9254/json/close/'+target['id']).read()
   except:pass
(out/'result.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),'utf-8')
