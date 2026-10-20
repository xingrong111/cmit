import requests,json
from bs4 import BeautifulSoup
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
names=['Former Residence of Qin Bangxian 01 2011-11.JPG','Former Residence of Zhang Wentian in Wuxi 01 2011-11.JPG','Former Residence of Zhang Tailei 01 2012-04.JPG']
def get(n):
 u='https://commons.wikimedia.org/wiki/File:'+n.replace(' ','_');r=requests.get(u,timeout=25,headers={"User-Agent":"ShanheYouji/1.0 (educational venue-image attribution audit)"});b=BeautifulSoup(r.text,'html.parser');a=b.select_one('.fullImageLink a');return {'title':n,'url':r.url,'image':a.get('href') if a else None,'text':b.select_one('#mw-content-text').get_text(' ',strip=True)[:8000] if b.select_one('#mw-content-text') else r.text[:80]}
x=list(ThreadPoolExecutor(3).map(get,names));Path('V1/docs/场馆照片检索.json').write_text(json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
for v in x:print(json.dumps(v,ensure_ascii=False)[:3800])

