from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
size(1366);call('Page.navigate',{'url':'http://127.0.0.1:3110/panorama/lys/场景预览.html'});wait("document.querySelector('#enter-button')");js("document.querySelector('#enter-button').click()");time.sleep(2)
before=call('Page.captureScreenshot',{})['data']
call('Input.dispatchMouseEvent',{'type':'mousePressed','x':700,'y':470,'button':'left','clickCount':1});call('Input.dispatchMouseEvent',{'type':'mouseMoved','x':950,'y':470,'button':'left','buttons':1});call('Input.dispatchMouseEvent',{'type':'mouseReleased','x':950,'y':470,'button':'left','clickCount':1});time.sleep(.8)
assert before!=call('Page.captureScreenshot',{})['data']
call('Runtime.evaluate',{'expression':"document.querySelector('#fullscreen-button').click()",'userGesture':True});time.sleep(1)
assert js('!!document.fullscreenElement');js('document.exitFullscreen()');shot('狼牙山全景-桌面.png');print('拖动改变画面，全屏进入和退出通过');ws.close()
