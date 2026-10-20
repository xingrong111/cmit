from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
call('Page.navigate',{'url':'http://127.0.0.1:3110/panorama/lys/场景预览.html'});wait("document.querySelector('#enter-button')");js("document.querySelector('#enter-button').click()");time.sleep(2)
print(call('Runtime.evaluate',{'expression':'document.documentElement.requestFullscreen().then(()=>!!document.fullscreenElement).catch(e=>e.message)','awaitPromise':True,'returnByValue':True,'userGesture':True}))
print(js("({enabled:document.fullscreenEnabled,notice:document.querySelector('#notice').textContent})"));ws.close()
