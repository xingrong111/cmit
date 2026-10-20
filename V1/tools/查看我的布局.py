from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
size(1366);nav('me/index');wait("document.querySelector('.my-space')");shot('我的布局-调整前.png');print('已截取我的页面');ws.close()
