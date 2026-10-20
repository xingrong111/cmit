from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
call('Emulation.setDeviceMetricsOverride',{'width':390,'height':740,'deviceScaleFactor':1,'mobile':False});nav('assistant/index');time.sleep(1);wait("document.querySelector('iframe')?.contentDocument?.querySelector('.assistant-starts')")
print(js("(()=>{const f=document.querySelector('iframe'),d=f.contentDocument;return {inputBottom:d.querySelector('.composer').getBoundingClientRect().bottom,frameHeight:f.clientHeight,conversationHeight:d.querySelector('.conversation').clientHeight}})()"))
assert js("(()=>{const f=document.querySelector('iframe');return f.contentDocument.querySelector('.composer').getBoundingClientRect().bottom<=f.clientHeight})()")
print('通过：390×740输入框完整可见。');ws.close()
