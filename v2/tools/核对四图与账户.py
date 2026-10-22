from pathlib import Path
import json,time,sys
prefix=Path('E:/CMIT/v2/tools/核对地图与场馆封面.py').read_text(encoding='utf-8').split("call('Page.enable')")[0].replace('9246','9249').replace('docs/地图与场馆封面核对','docs/四图与账户核对');exec(prefix)
call('Page.enable');call('Runtime.enable');call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True})
width=int(sys.argv[1]) if len(sys.argv)>1 else 1440;base=sys.argv[2] if len(sys.argv)>2 else 'http://127.0.0.1:3210'
call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False})
results=[]
def nav(path,selector,frame=False):
 call('Page.navigate',{'url':base+'/#/pages/'+path});wait(("document.querySelector('iframe')?.contentDocument?.querySelector(" if frame else 'document.querySelector(')+json.dumps(selector)+')');time.sleep(.4)
try:
 nav('home/index','.nav-auth-entry');js("localStorage.removeItem('yingji_token');localStorage.removeItem('yingji_user_id')");call('Page.reload');time.sleep(.7);wait("document.querySelector('.nav-auth-entry')");assert '登录' in js("document.querySelector('.nav-auth-entry').innerText")
 assert not js('document.documentElement.scrollWidth>innerWidth')
 nav('person/index?id=P003','.chronicle-row')
 info=js("(()=>{const e=document.querySelector('.row-summary');return {font:getComputedStyle(e.querySelector('span')||e).fontSize,overflow:document.documentElement.scrollWidth>innerWidth}})()")
 assert float(info['font'][:-2])>=20 and not info['overflow'],info
 shot('人物片段-'+str(width));results.append(info)
 nav('radar/index','.hero',True);wait("document.querySelector('iframe').contentWindow.place")
 js("document.querySelector('iframe').contentWindow.place('PLACE-WX-LDY')");wait("document.querySelector('iframe').contentDocument.querySelector('.venue-reference-grid')")
 time.sleep(.3)
 info=js("""(()=>{const d=document.querySelector('iframe').contentDocument,g=d.querySelector('.venue-reference-grid'),boxes=[...g.children].map(e=>e.getBoundingClientRect()),photo=d.querySelector('.venue-photo').getBoundingClientRect(),story=d.querySelector('.venue-story').getBoundingClientRect();return {widths:boxes.map(e=>e.width),photoTop:photo.top,storyTop:story.top,photoBottom:photo.bottom,storyBottom:story.bottom,buttonFont:d.defaultView.getComputedStyle(d.querySelector('.venue-action-bar button')).fontSize,overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()""")
 assert max(info['widths'])-min(info['widths'])<2 and not info['overflow'],info
 if width>720:assert abs(info['photoBottom']-info['storyBottom'])<3 and abs(info['photoTop']-info['storyTop'])<3,info
 shot('场馆对齐-'+str(width));results.append(info)
 nav('account/index?view=register','#authForm',True)
 info=js("(()=>{const d=document.querySelector('iframe').contentDocument;return {register:Boolean(d.querySelector('#nickname')),overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()")
 assert info['register'] and not info['overflow'],info
 shot('注册界面-'+str(width));results.append(info)
 # A local account exercises the real UI and API; never fabricate learning progress.
 if base.startswith('http://127'):
  email='ui-'+str(int(time.time()*1000))+'@example.test'
  js("""(()=>{const d=document.querySelector('iframe').contentDocument;for(const [id,value] of Object.entries(%s))d.getElementById(id).value=value;d.querySelector('#agreement').checked=true;d.querySelector('#registerBtn').click()})()"""%json.dumps({'nickname':'界面验证','email':email,'password':'UiVerify-2026-Long','confirm':'UiVerify-2026-Long'}))
  wait("document.querySelector('iframe').contentDocument.querySelector('#logout')")
  assert js("document.querySelector('iframe').contentWindow.eval('state').user.role")=='user'
  shot('注册登录成功-'+str(width))
  js("document.querySelector('iframe').contentDocument.querySelector('#logout').click()")
  wait("document.querySelector('iframe').contentDocument.querySelector('#loginBtn')")
  js("""(()=>{const d=document.querySelector('iframe').contentDocument;d.querySelector('#email').value=%s;d.querySelector('#password').value='WrongPassword';d.querySelector('#loginBtn').click()})()"""%json.dumps(email))
  wait("document.querySelector('iframe').contentDocument.querySelector('#authError:not([hidden])')")
  js("(()=>{const d=document.querySelector('iframe').contentDocument;d.querySelector('#password').value='UiVerify-2026-Long';d.querySelector('#loginBtn').click()})()")
  wait("document.querySelector('iframe').contentDocument.querySelector('#logout')")
  permissions=js("(async()=>{const token=localStorage.getItem('yingji_token');const r=await fetch('/api/account/admin/comments',{headers:{Authorization:'Bearer '+token}});return r.status})()");assert permissions==403,permissions
  results.append({'adminDenied':permissions,'registration':True,'automaticLogin':True,'wrongPasswordRejected':True,'relogin':True,'role':'user'})
 (out/('结果-'+str(width)+'.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(results,ensure_ascii=False))
finally:ws.close()
