from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
size(1366)
nav('people/index');wait("document.querySelector('.directory-segments')");js("[...document.querySelectorAll('.directory-segments uni-button')].find(b=>b.textContent.includes('IP专项')).click()");wait("document.querySelectorAll('.ip-topic').length===5")
assert js("[...document.querySelectorAll('.ip-topic')].every(c=>{let b=[...c.querySelectorAll('.next-actions uni-button')];return b.length===2&&b[0].textContent.trim()==='走进人物'&&b[1].textContent.trim()==='学习挑战'})")
for group in ['QQB','LYS','SZZ','LDY']:
 nav('ip/index?group='+group)
 wait("document.querySelector('iframe')?.src.includes('scene="+group+"')")
 wait("document.querySelector('iframe').contentDocument?.querySelector('#panorama')")
 assert js("!document.querySelector('iframe').contentDocument.querySelector('.hotspot,.chapter-nav,#welcome,#opening,#reading-card,dialog')"),group
 assert js("!document.querySelector('#ip-intro')"),group
 if group in ['QQB','LYS']:
  wait("document.querySelector('iframe').contentWindow.panoramaReady===true")
  doc="document.querySelector('iframe').contentDocument"
  rect=js("(()=>{const r=document.querySelector('iframe').getBoundingClientRect();return {x:r.x+200,y:r.y+180}})()")
  call('Input.dispatchMouseEvent',{'type':'mousePressed',**rect,'button':'left','clickCount':1})
  call('Input.dispatchMouseEvent',{'type':'mouseMoved','x':rect['x']+100,'y':rect['y']+20,'button':'left','buttons':1})
  call('Input.dispatchMouseEvent',{'type':'mouseReleased','x':rect['x']+100,'y':rect['y']+20,'button':'left','clickCount':1})
  time.sleep(.7)
  state=js("document.querySelector('iframe').contentWindow.panoramaState")
  assert abs(state['yaw']+15)<1 and abs(state['pitch']-3)<1,(group,state)
  js(doc+".querySelector('#zoom-in').click()")
  wait("document.querySelector('iframe').contentWindow.panoramaState.fov===82")
  js(doc+".querySelector('#reset').click()")
  wait("document.querySelector('iframe').contentWindow.panoramaState.fov===90")
  shot('统一纯全景-'+group+'.png')
 else:
  wait("document.querySelector('iframe').contentWindow.panoramaUnavailable===true")
  assert js("!document.querySelector('iframe').contentDocument.querySelector('canvas')"),group
nav('ip/index?group=JZY');wait("document.querySelector('iframe')?.src.includes('/panorama/jiang/')");wait("document.querySelector('#ip-intro')")
print('五组卡片双入口；四组共用纯全景界面；实际两组拖动缩放复位一致；缺素材不套用；江姐保留互动通过');ws.close()
