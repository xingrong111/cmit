import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
urls=['https://ccpit.wuxi.gov.cn/doc/2021/04/13/3255979.shtml','https://thyouth.wuxi.gov.cn/doc/2018/08/07/1900426.shtml']
for u in urls:
 r=requests.get(u,timeout=20);r.encoding=r.apparent_encoding;b=BeautifulSoup(r.text,'html.parser');print(u)
 for im in b.select('img'):
  src=im.get('src','')
  if src and not any(x in src for x in ['logo','icon','ewm','banner','wx.png']):print(urljoin(u,src),im.get('alt',''))
