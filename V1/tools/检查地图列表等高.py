from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
for width in [1440,390]:
 size(width);nav('radar/index');call('Page.reload');time.sleep(1)
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('#places article')")
 time.sleep(.4)
 data=js("(()=>{const d=document.querySelector('iframe').contentDocument,a=d.querySelector('.web-map-column').getBoundingClientRect(),b=d.querySelector('.web-place-column').getBoundingClientRect();return {mapHeight:a.height,listHeight:b.height,bottomDifference:Math.abs(a.bottom-b.bottom),overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()")
 print(width,data)
 assert not data['overflow']
 if width>720:assert data['bottomDifference']<3
 shot('地图列表等高-'+str(width)+'.png')
ws.close()
