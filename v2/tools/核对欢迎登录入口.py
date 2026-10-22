from pathlib import Path
import json,time,sys
exec(Path('E:/CMIT/v2/tools/核对地图与场馆封面.py').read_text(encoding='utf-8').split("call('Page.enable')")[0].replace('9246','9249').replace('docs/地图与场馆封面核对','docs/欢迎登录入口核对'))
base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:3210'
call('Page.enable');call('Runtime.enable');call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True})
def nav(page):
 call('Page.navigate',{'url':base+'/#/pages/'+page+'/index'});time.sleep(.4);wait("document.querySelector('.app-shell')")
def fill(selector,value):
 js("(()=>{const e=document.querySelector("+json.dumps(selector)+");e.value="+json.dumps(value)+";e.dispatchEvent(new Event('input',{bubbles:true}))})()")
results=[]
try:
 for width in [1440,390]:
  call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False})
  nav('home');js("localStorage.removeItem('yingji_token');localStorage.removeItem('yingji_user_id');sessionStorage.removeItem('yingji:entry-choice')");call('Page.reload');time.sleep(.6);wait("document.querySelector('.entry-gate .account-tabs')");time.sleep(.5)
  assert js("document.documentElement.classList.contains('entry-open')")
  assert not js("document.querySelector('.entry-gate').scrollWidth>innerWidth")
  shot('欢迎登录-'+str(width))
  js("[...document.querySelectorAll('.entry-gate .account-tabs uni-button')].find(e=>e.innerText.includes('注册')).click()")
  wait("document.querySelector('.entry-gate .code-field')");assert len(js("[...document.querySelectorAll('.entry-gate .account-form input')].map(e=>e.type)"))==5
  shot('邮箱注册-'+str(width));js("document.querySelector('.entry-guest').click()");wait("!document.querySelector('.entry-gate')")
  assert js("sessionStorage.getItem('yingji:entry-choice')==='guest'&&!localStorage.getItem('yingji_token')")
  js("[...document.querySelectorAll('.reference-home .desktop-nav uni-button')].find(e=>e.innerText==='人物').click()");wait("document.querySelector('.reference-people')");time.sleep(.3);assert not js("[...document.querySelectorAll('.entry-gate')].some(e=>e.getBoundingClientRect().width>0)")
  results.append({'width':width,'entryVisible':True,'registrationHasCode':True,'guestCanBrowse':True,'overflow':False})
 if base.startswith('http://127.'):
  nav('home');js("sessionStorage.removeItem('yingji:entry-choice')");call('Page.reload');time.sleep(.6);wait("document.querySelector('.entry-gate .account-form input')")
  fill('.entry-gate input','learner@yingji.local');fill('.entry-gate input[type=password]','IncorrectPassword');js("document.querySelector('.entry-gate .auth-submit').click()");wait("document.querySelector('.entry-gate .account-error')")
  fill('.entry-gate input[type=password]','LearnMe!2026');js("document.querySelector('.entry-gate .auth-submit').click()");wait("!document.querySelector('.entry-gate')&&localStorage.getItem('yingji_token')")
  assert js("location.hash==='#/'||location.hash.includes('/pages/home/index')")
  nav('me');wait("document.querySelector('.my-account-actions')")
  js("[...document.querySelectorAll('.my-account-actions uni-button')].find(e=>e.innerText.includes('退出登录')).click()")
  wait("document.querySelector('.entry-gate')&&!localStorage.getItem('yingji_token')")
  results.append({'incorrectLoginRejected':True,'realLoginEntersHome':True,'logoutReturnsToEntry':True})
 (out/('公网结果.json' if base.startswith('https') else '本地结果.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(results,ensure_ascii=True))
finally:ws.close()
