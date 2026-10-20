from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
for group in ['QQB','LYS','SZZ','LDY','JZY']:
 nav('ip/index?group='+group);wait("document.querySelector('.detail-crumb')?.textContent.includes('"+group+"')")
 if group=='JZY':assert js("!!document.querySelector('#ip-intro')")
 else:
  assert js("!document.querySelector('#ip-intro')&&!document.querySelector('.reading-chapters')&&!document.querySelector('.ip-art-note')"),group
  if group in ['QQB','LYS']:
   wait("document.querySelector('iframe')?.contentDocument?.querySelector('canvas')")
   assert js("!document.querySelector('.panorama-archive')"),group
  else:assert js("!!document.querySelector('.ip-vr-empty')&&!document.querySelector('.ip-stage-image')"),group
print('江姐保留完整专题，其余四组纯VR展示规则通过');ws.close()
