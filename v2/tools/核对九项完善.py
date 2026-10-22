from pathlib import Path
import json,time,sys
prefix=Path('E:/CMIT/v2/tools/核对地图与场馆封面.py').read_text(encoding='utf-8').split("call('Page.enable')")[0].replace('9246','9247').replace('docs/地图与场馆封面核对','docs/九项完善核对');exec(prefix)
call('Page.enable');call('Runtime.enable');call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True})
width=int(sys.argv[1]) if len(sys.argv)>1 else 1440
base=sys.argv[2] if len(sys.argv)>2 else 'http://127.0.0.1:3210'
call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False})
results=[]
def nav(route,selector,frame=False):
 call('Page.navigate',{'url':base+'/#/pages/'+route})
 wait(("document.querySelector('iframe')?.contentDocument?.querySelector(" if frame else "document.querySelector(")+json.dumps(selector)+')')
 if frame:wait("document.querySelector('iframe').contentDocument.documentElement.classList.contains('global-large')===document.documentElement.classList.contains('global-large')")
 time.sleep(.35)
def font(large):
 nav('me/index','.preference-card')
 js("[...document.querySelectorAll('.preference-card uni-button')].find(x=>x.innerText.includes("+json.dumps('大字号' if large else '标准字号')+")).click()")
 time.sleep(.35)
def sample(selector,frame=False):
 return js("""(()=>{const d=%s,e=d.querySelector(%s),t=[e,...e.querySelectorAll('*')].find(n=>[...n.childNodes].some(c=>c.nodeType===3&&c.textContent.trim()))||e;return {size:parseFloat(d.defaultView.getComputedStyle(t).fontSize),text:e.innerText?.slice(0,50),overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth,large:d.documentElement.classList.contains('global-large')}})()"""%("document.querySelector('iframe').contentDocument" if frame else 'document',json.dumps(selector)))
try:
 for route,selector,frame in [('home/index','.longroll-banner .banner-description',False),('people/index','.page-title',False),('registry/index?id=P0034','.identity-grid uni-text',False),('person/index?id=P003','.identity-grid uni-text',False),('timeline/index','.chronicle-name',False),('assistant/index','.guide-copy h3',True),('radar/index','.hero h2',True),('learning/index','.learning-cover h1',True),('wenchuang/index','.wc-banner .page-title',True),('account/index','.topbar h1',True)]:
  font(False);nav(route,selector,frame);normal=sample(selector,frame)
  font(True);nav(route,selector,frame);large=sample(selector,frame)
  assert large['size']>=normal['size']*1.15,(route,normal,large)
  assert not large['overflow'],(route,large)
  if route.startswith('person'):assert not js("document.body.innerText.includes('哪些内容仍待求证')||document.body.innerText.includes('仅保存在本机，不同步账户')")
  if route.startswith('wenchuang'):assert not js("document.querySelector('.wc-page-intro')")
  shot(route.split('/')[0]+'-'+str(width));results.append({'route':route,'normal':normal,'large':large});print(route,'font passed',flush=True)
 font(False);nav('assistant/index','.web-chat-panel',True)
 js("""(()=>{const w=document.querySelector('iframe').contentWindow;w.eval('state').messages=Array.from({length:20},(_,i)=>({role:i%2?'assistant':'user',text:'用于检查阅读和滚动的测试文字。'.repeat(20)}));w.assistant()})()""")
 time.sleep(.5)
 info=js("""(()=>{const f=document.querySelector('iframe'),d=f.contentDocument,c=d.querySelector('.conversation');c.scrollTop=200;const inner=c.scrollTop;window.scrollTo(0,500);return {inner,outer:window.scrollY,frameHeight:f.clientHeight,innerPage:d.documentElement.scrollHeight,innerViewport:d.defaultView.innerHeight}})()""")
 assert info['inner']>0 and info['outer']>0 and abs(info['innerPage']-info['innerViewport'])<60,info
 results.append({'scroll':info});shot('小迹滚动-'+str(width))
 (out/('核对-'+str(width)+'.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(info))
finally:ws.close()
