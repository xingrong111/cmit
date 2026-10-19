from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
size(390);nav('me/index');call('Page.reload');time.sleep(1);wait("document.querySelector('.preference-card')")
wasLarge=js("document.documentElement.classList.contains('global-large')")
js("[...document.querySelectorAll('.preference-card uni-button')].find(b=>b.textContent==='大字号').click()")
try:
 for route in ['me/index','learning/index','assistant/index','radar/index','person/index?id=P009']:
  nav(route);time.sleep(.8)
  assert js("document.documentElement.scrollWidth<=innerWidth"),route
  if route.startswith(('learning','assistant','radar')):
   wait("document.querySelector('iframe')?.contentDocument?.body")
   time.sleep(.2)
   assert js("(()=>{const d=document.querySelector('iframe').contentDocument;return d.documentElement.scrollWidth<=d.defaultView.innerWidth})()"),route
 print('通过：390宽度大字号五个模块无横向溢出。')
finally:
 nav('me/index');time.sleep(.5);js("[...document.querySelectorAll('.preference-card uni-button')].find(b=>b.textContent==='"+('大字号' if wasLarge else '标准字号')+"').click()");ws.close()
