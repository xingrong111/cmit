from pathlib import Path
import json
root=Path(__file__).resolve().parent
exec((root.parent/'tools/检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
errors=[]
for width in [1366,390]:
 size(width);call('Page.navigate',{'url':'http://127.0.0.1:3155/?test='+str(width)})
 wait('window.sceneReady===true')
 wait('document.querySelectorAll(".chapter").length===4')
 js('document.querySelector("#enter").click()')
 wait('document.querySelector("#welcome").classList.contains("hidden")')
 assert js('document.documentElement.scrollWidth<=innerWidth')
 time.sleep(.8);shot('江姐全景-'+str(width)+'.png')
 for i in range(4):
  js('document.querySelectorAll(".chapter")['+str(i)+'].click()')
  wait('window.sceneState.selected==='+str(i))
  assert js('!document.querySelector("#panel").hidden')
 assert js('document.querySelector("#progress").innerText.includes("4 / 4")')
 js('document.querySelector("#nextNode").click()');assert js('document.querySelector("#quiz").open')
 js('document.querySelector("[data-correct=false]").click()');assert js('document.querySelector("#feedback").innerText.includes("再想")')
 js('document.querySelector("[data-correct=true]").click()');assert js('document.querySelector("#feedback").innerText.includes("正确")')
 js('document.querySelector("#returnScene").click()');assert js('!document.querySelector("#quiz").open')
 js('document.querySelector("#zoomIn").click()');wait('window.sceneState.fov===67')
 js('document.querySelector("#reset").click()');wait('window.sceneState.fov===75')
 before=js('window.sceneState.yaw')
 call('Input.dispatchMouseEvent',{'type':'mousePressed','x':int(width*.55),'y':430,'button':'left','clickCount':1})
 call('Input.dispatchMouseEvent',{'type':'mouseMoved','x':int(width*.55)+80,'y':450,'button':'left','buttons':1})
 call('Input.dispatchMouseEvent',{'type':'mouseReleased','x':int(width*.55)+80,'y':450,'button':'left','clickCount':1})
 time.sleep(.5)
 assert abs(js('window.sceneState.yaw')-before)>2,'拖动未改变视角'
 js('document.querySelector("#openSources").click()');assert js('document.querySelector("#sources").open')
 assert js('document.querySelector("#sources").innerText.includes("再创造")')
 js('document.querySelector("#closeSources").click()')
print('通过：桌面/手机双尺寸，全景加载、拖动环视、缩放复位、四处热点、进度、阅读题反馈和依据说明。');ws.close()
(root/'检查结果.json').write_text(json.dumps(dict(widths=[1366,390],panoramaLoaded=True,dragRotate=True,zoom=True,hotspots=4,quiz=True,overflow=False,deviceTest=False,headsetVR=False),ensure_ascii=False,indent=2),encoding='utf-8')
