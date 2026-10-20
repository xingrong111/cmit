from pathlib import Path
t=(Path(__file__).parent/'复测瞿秋白全景.py').read_text(encoding='utf-8-sig')
exec(t.split('checks=[]')[0])
def wait(expr):
 for _ in range(200):
  try:
   if js(expr):return
  except Exception:pass
  time.sleep(.2)
 raise AssertionError('线上等待超时：'+expr)
def nav(route):
 call('Page.navigate',{'url':'https://shanhe-youji-20261017.bushystar3.chatgpt.site/?qqb=20261017#/pages/'+route})
 time.sleep(.5)
try:exec(t[t.index('checks=[]'):])
except Exception:
 print(js("(()=>{const f=document.querySelector('.person-panorama-frame'),w=f?.contentWindow;return {frameText:f?.contentDocument?.body?.innerText,resources:w?.performance.getEntriesByType('resource').map(x=>({name:x.name,duration:x.duration,size:x.transferSize})),state:w?.panoramaState,ready:w?.panoramaReady}})()"))
 raise
result=json.loads((r/'docs/瞿秋白全景复测.json').read_text(encoding='utf-8'));result['site']='https://shanhe-youji-20261017.bushystar3.chatgpt.site'
(r/'docs/线上瞿秋白全景复测.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
