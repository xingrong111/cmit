from pathlib import Path
from bs4 import BeautifulSoup
from PIL import Image
import urllib.request,urllib.parse,json,datetime,hashlib,io,html,sys
sys.stdout.reconfigure(encoding='utf-8');r=Path(__file__).resolve().parents[1];out=r/'docs/剩余人物图片核对包';out.mkdir(exist_ok=True);(out/'图片').mkdir(exist_ok=True)
def fetch(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 ShanheYoujiResearch','Referer':url}),timeout=25) as f:return f.read(),f.url
def page_images(url):
 raw,final=fetch(url);s=BeautifulSoup(raw,'html.parser');return [{'url':urllib.parse.urljoin(final,i.get('src','')),'alt':i.get('alt','')} for i in s.find_all('img') if i.get('src')]
records=[{'id':'P001','name':'史砚芬','page':'https://yht.nanjing.gov.cn/rednanjing/hsbb/zt/yhyl/202504/t20250410_5123473.html','title':'史砚芬｜雨花英烈','agency':'雨花台烈士陵园','url':'https://yht.nanjing.gov.cn/rednanjing/hsbb/zt/yhyl/202504/W020250410592688870770.jpg','caption':'人物条目配图；生前照片或后绘肖像仍待原件辨识'},
 {'id':'P004','name':'宋振中','page':'https://www.news.cn/20240930/fbe0a9eec2d646258b807ca6f0080bed/c.html','title':'缅怀共和国年龄最小的革命烈士，牺牲时还未满9岁','agency':'新华社','url':'https://www.news.cn/20240930/fbe0a9eec2d646258b807ca6f0080bed/20240930fbe0a9eec2d646258b807ca6f0080bed_ca2459eafc974387b1fee81b2941fe10.jpg','caption':'宋振中生前照片；不据此指认为8岁容貌'},
 {'id':'P006','name':'张应春','page':'https://www.dajs.gov.cn/art/2023/11/16/art_123_9735.html','title':'张应春烈士照片（1920—1927年）','agency':'江苏省档案馆；保管单位苏州市吴江区档案馆','url':'https://www.dajs.gov.cn/picture/0/s_2311211414565039290.png','caption':'原图注指张应春为左一，保留合影，不裁切指认其他同学'},
 {'id':'P011','name':'许晓轩','page':'https://m.youth.cn/qwtx/xxl/201905/t20190528_11966328.htm','title':'许晓轩：共产党人是不可动摇的','agency':'中国青年网转载光明日报／新华社','caption':'原图注：许晓轩像；新华社发；未标拍摄年份'},
 {'id':'P012','name':'郭纲琳','page':'https://www.xinhuanet.com/politics/2018-10/26/c_1123616909.htm','title':'“永是勇士”的革命女战士——郭纲琳','agency':'新华社','url':'https://www.xinhuanet.com/politics/2018-10/26/1123616909_15405281270871n.jpg','caption':'原图注：郭纲琳像（资料照片）；新华社发'},
 {'id':'P013','name':'钱振标','page':'https://crt.com.cn/news2007/news/HStop/171030115918GJK55ACF4AGJ7I9GA84J.html','title':'青山忠魂钱振标｜事迹连载之一','agency':'中红网；仅作补充线索，非官方名录证据','caption':'检索定位遗像与就义前留影，原件与摄影署名含义待核'}]
for row in records:
 row.update({'accessDate':datetime.date.today().isoformat(),'rightsStatus':'待确认；仅用于内部资料核对，未进入成品公开素材','identityStatus':'按逐图图注核对，原件待独立复核'})
 try:
  if not row.get('url'):
   imgs=page_images(row['page']);row['candidateImages']=imgs
   if row['id']=='P011':
    candidates=[i for i in imgs if 'W020' in i['url'] or '/201905/' in i['url']]
    if candidates:row['url']=candidates[0]['url']
   elif row['id']=='P013':
    candidates=[i for i in imgs if '2017' in i['url'] and i['url'].lower().endswith(('.jpg','.jpeg','.png'))]
    row['candidateImages']=candidates or imgs
    if candidates:row['url']=candidates[0]['url']
  if row.get('url'):
   raw,final=fetch(row['url']);im=Image.open(io.BytesIO(raw));im.verify();row['finalImageUrl']=final;row['sha256']=hashlib.sha256(raw).hexdigest()
   suffix='.png' if raw[:4]==b'\x89PNG' else '.jpg';name=row['name']+suffix;(out/'图片'/name).write_bytes(raw);row['localFile']='图片/'+name
   print(row['name'],len(raw),flush=True)
  else:row['error']='未定位可确认的图片地址';print(row['name'],row['error'],flush=True)
 except Exception as e:row['error']=str(e);print(row['name'],str(e),flush=True)
(out/'逐图来源与待核事项.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
cards=[]
for p in records:
 esc=lambda s:html.escape(str(s),quote=True)
 picture='<img src="'+urllib.parse.quote(p['localFile'])+'" alt="'+esc(p['name'])+'资料配图">' if p.get('localFile') else '<p>本轮未取得原图，保留检索与访问错误。</p>'
 cards.append('<article><h2>'+esc(p['name'])+'</h2>'+picture+'<p>'+esc(p['caption'])+'</p><p>'+esc(p['rightsStatus'])+'</p><a href="'+esc(p['page'])+'" target="_blank" rel="noopener">查看原始来源</a></article>')
(out/'图片核对入口.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>剩余人物图片核对</title><style>body{background:#fbf5e9;color:#35281d;font:15px/1.8 Microsoft YaHei;margin:30px auto;max-width:1100px;padding:20px}h1,h2{color:#982b28}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}article{padding:22px;background:#fffaf1;border:1px solid #ddc8a7;border-radius:16px}img{width:100%;height:280px;object-fit:contain;background:#efe4d1}a{color:#982b28}</style><h1>剩余6位人物 · 图片资料核对</h1><p>这是内部核对资料，图片身份、年代与使用条件分开核查；尚未授权的素材未放入成品公开页面。</p><main>'+''.join(cards)+'</main></html>',encoding='utf-8')
print('核对包已生成')
