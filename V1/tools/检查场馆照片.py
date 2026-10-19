import requests
from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
for name in ['qqb-2017','qbc-2011','zwt-2011','ztl-2012']:
 r=requests.get('http://127.0.0.1:3110/media/venues/'+name+'.jpg');assert r.status_code==200 and r.headers['Content-Type']=='image/jpeg';print(name,len(r.content))
size(1440);nav('radar/index');call('Page.reload');time.sleep(1)
wait("document.querySelector('iframe')?.contentDocument?.querySelector('.venue-card-photo img')?.naturalWidth>0")
js("document.querySelector('iframe').contentDocument.querySelectorAll('#places [data-action=place]')[1].click()")
wait("document.querySelector('iframe')?.contentDocument?.querySelector('.venue-photo img')?.naturalWidth>0")
shot('场馆实景照片-张闻天.png')
print('通过：4处照片文件可读取，列表及详情照片实际加载成功。');ws.close()
