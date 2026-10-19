from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
size(1440);nav('radar/index');call('Page.reload');time.sleep(1)
wait("document.querySelector('iframe')?.contentDocument?.querySelector('#places article')")
js("document.querySelector('iframe').contentWindow.scrollTo(0,480)")
time.sleep(.6);shot('场馆卡片新版-1440.png');ws.close()
