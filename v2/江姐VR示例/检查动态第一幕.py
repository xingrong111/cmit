from pathlib import Path
import json
root=Path(__file__).parent
exec((root.parent/'tools/检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
checks=[]
for width in [390,1366]:
 size(width);call('Page.navigate',{'url':'http://127.0.0.1:3155/第一幕动态版.html?check='+str(width)})
 time.sleep(.5);wait('window.sceneReady===true')
 js("localStorage.removeItem('江姐动态第一幕进度');document.querySelector('#enter').click()")
 wait("window.storyState?.phase==='explore'&&window.actorMotionState?.actors.length===3")
 js("document.querySelector('.hotspot').click()")
 wait("window.storyState?.index===0")
 time.sleep(1);shot('动态江姐第一幕-'+str(width)+'.png')
 a=js('window.actorMotionState');time.sleep(.6);b=js('window.actorMotionState')
 assert a['actors'][0]['delta']!=b['actors'][0]['delta']
 assert [x['foot'] for x in a['actors']]==[x['foot'] for x in b['actors']],'脚底不能滑动'
 assert js('document.documentElement.scrollWidth<=innerWidth')
 js("document.querySelector('#motion').click()")
 wait('!window.actorMotionState.enabled');a=js('window.actorMotionState.elapsed');time.sleep(.4);assert js('window.actorMotionState.elapsed')==a
 js("document.querySelector('#motion').click()")
 for index in range(1,8):
  js("document.querySelector('#next').click()")
  wait('window.storyState.index==='+str(index))
 js("document.querySelector('#next').click()")
 wait("window.storyState.phase==='complete'")
 js("document.querySelector('#replay').click()")
 wait('window.storyState.index===0')
 js("document.querySelector('#performance').click()")
 assert js("document.querySelector('#performance').getAttribute('aria-pressed')==='true'")
 js("document.querySelector('#performance').click()")
 assert js("document.querySelector('#performance').getAttribute('aria-pressed')==='false'")
 rect=js("(()=>{let r=document.querySelector('#fullscreen').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()")
 for k in ['mousePressed','mouseReleased']:call('Input.dispatchMouseEvent',{'type':k,**rect,'button':'left','clickCount':1})
 wait('!!document.fullscreenElement');js('document.exitFullscreen()')
 checks.append({'width':width,'threeCharacters':True,'actualVertexAnimation':True,'feetFixed':True,'motionPause':True,'dialogueComplete':True,'fullscreen':True})
(root/'动态版检查结果.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
print('通过：三人物分层、真实顶点微动、脚底固定、暂停、八段对话、自动演绎开关、全屏和双尺寸。');ws.close()
