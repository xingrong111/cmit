from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
size(1440);nav('radar/index');call('Page.reload');time.sleep(1)
wait("document.querySelector('iframe')?.contentDocument?.querySelector('#places article:first-child img')?.naturalWidth>0")
js("document.querySelector('iframe').contentDocument.querySelector('#places [data-action=place]').click()")
wait("document.querySelector('iframe')?.contentDocument?.querySelector('.venue-photo img')?.naturalWidth>0")
assert js("document.querySelector('iframe').contentDocument.querySelector('.venue-photo img').src.includes('ldy-2020.jpg')")
shot('陆定一祖居实景接入.png');print('通过：陆定一祖居列表与详情图片加载成功。');ws.close()
