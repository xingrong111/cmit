from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
for group in ['JZY','LYS']:
 size(390);nav('ip/index?group='+group)
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('canvas')")
 if group=='JZY':
  wait("document.querySelector('iframe').contentWindow.sceneReady===true")
  assert js("getComputedStyle(document.querySelector('iframe').contentDocument.querySelector('#welcome')).display==='none'")
  assert js("!!document.querySelector('iframe').contentWindow.storyState")
  js("document.querySelector('iframe').contentDocument.querySelector('.hotspot').click()")
  assert js("document.querySelector('iframe').contentWindow.storyState.phase==='dialogue'")
 else:
  assert js("getComputedStyle(document.querySelector('iframe').contentDocument.querySelector('#opening')).display==='none'")
  js("document.querySelector('iframe').contentDocument.querySelector('[data-chapter=\"2\"]').click()")
  wait("document.querySelector('iframe').contentDocument.querySelector('#scene-title').textContent.includes('五壮士')")
 shot('无进入浮窗-'+group+'.png')
print('江姐自动进入且热点对白可用，狼牙山无进入浮窗且章节切换可用');ws.close()
