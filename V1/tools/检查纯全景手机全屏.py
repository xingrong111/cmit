from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
size(390);nav('ip/index?group=LYS');wait("document.querySelector('iframe')?.contentWindow?.panoramaReady===true");assert js('document.documentElement.scrollWidth<=390');assert js("document.querySelector('iframe').getBoundingClientRect().height>=360")
call('Runtime.evaluate',{'expression':"document.querySelector('iframe').contentDocument.querySelector('#fullscreen').click()",'userGesture':True});time.sleep(.8)
assert js("!!document.querySelector('iframe').contentDocument.fullscreenElement")
js("document.querySelector('iframe').contentDocument.exitFullscreen()")
shot('统一纯全景-LYS-手机.png');print('手机布局、统一播放器全屏进入退出通过');ws.close()
