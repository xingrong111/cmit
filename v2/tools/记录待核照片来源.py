from pathlib import Path
import urllib.request,urllib.parse,json,datetime,sys,concurrent.futures
from bs4 import BeautifulSoup
sys.stdout.reconfigure(encoding='utf-8');r=Path(__file__).resolve().parents[1];out=r/'docs/人物照片补全'
rows=[('P001','史砚芬','雨花台烈士陵园','https://yht.nanjing.gov.cn/rednanjing/hsbb/zt/yhyl/202504/t20250410_5123473.html'),('P004','宋振中','新华网','https://www.news.cn/20240930/fbe0a9eec2d646258b807ca6f0080bed/c.html'),('P006','张应春','江苏档案信息网','https://www.dajs.gov.cn/art/2023/11/16/art_123_9735.html'),('P011','许晓轩','国防部网','https://www.mod.gov.cn/2018gfbztlbmb/2019-05/27/content_4842356.htm'),('P012','郭纲琳','雨花台烈士陵园','https://yht.nanjing.gov.cn/rednanjing/hsbb/zt/yhyl/202504/t20250410_5123486.html'),('P013','钱振标','江阴市人民政府','https://www.jiangyin.gov.cn/doc/2018/08/29/956072.shtml')]
def inspect(row):
 pid,name,agency,url=row;d={'personId':pid,'name':name,'agency':agency,'originalUrl':url,'accessDate':datetime.date.today().isoformat(),'status':'待核验／待明确使用条件','imageDownload':False}
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 ShanheYoujiResearch'}),timeout=20) as f:blob=f.read();d['finalUrl']=f.url
  soup=BeautifulSoup(blob,'html.parser');d['title']=soup.title.get_text(strip=True) if soup.title else '未显示'
  d['images']=[{'url':urllib.parse.urljoin(d['finalUrl'],i.get('src','')),'alt':i.get('alt','')[:80],'identityStatus':'仅提取页面图像地址，待逐图辨识，不按域名自动通过'} for i in soup.find_all('img') if i.get('src') and not i.get('src','').startswith('data:')]
 except Exception as e:d['error']=str(e);d['fetchStatus']='本轮未取得正文'
 return d
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:data=list(pool.map(inspect,rows))
(out/'待核照片原始页面线索.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');print('已保存6位人物原始页面、跳转地址与图像线索；未下载未授权图片')
