from pathlib import Path
import urllib.request,urllib.parse,json,sys
from bs4 import BeautifulSoup
sys.stdout.reconfigure(encoding='utf-8');r=Path(__file__).resolve().parents[1];out=r/'docs/人物照片补全'
u='https://zh.wikipedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','format':'json','titles':'史砚芬|宋振中|张应春|许晓轩|郭纲琳|钱振标','prop':'images','imlimit':10,'redirects':1})
req=urllib.request.Request(u,headers={'User-Agent':'ShanheYoujiResearch/1.0 educational image provenance'})
try:
 with urllib.request.urlopen(req,timeout=25) as f:d=json.load(f)
 (out/'剩余人物配图索引.json').write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
 for p in d.get('query',{}).get('pages',{}).values():print(p['title'],[i['title'] for i in p.get('images',[])])
except Exception as e:print(str(e))
pages={'许晓轩':'https://dangshi.people.com.cn/n1/2019/0527/c85037-31105463.html','钱振标':'https://www.qzbjng.com/qian/Article/ShowArticle.asp?ArticleID=1','郭纲琳':'https://www.xinhuanet.com/politics/2018-10/26/c_1123616909.htm'}
rows=[]
for name,url in pages.items():
 row={'name':name,'originalUrl':url}
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=20) as f:raw=f.read();row['finalUrl']=f.url
  soup=BeautifulSoup(raw,'html.parser');row['title']=soup.title.get_text(strip=True) if soup.title else ''
  row['images']=[{'url':urllib.parse.urljoin(row['finalUrl'],i.get('src','')),'alt':i.get('alt','')[:60]} for i in soup.find_all('img') if i.get('src')]
  print(name,json.dumps(row['images'],ensure_ascii=False)[:3500])
 except Exception as e:row['error']=str(e);print(name,str(e))
 rows.append(row)
(out/'本轮配图网页读取.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
