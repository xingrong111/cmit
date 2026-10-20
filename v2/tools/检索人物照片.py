from pathlib import Path
import urllib.request,urllib.parse,json,concurrent.futures,sys,re
sys.stdout.reconfigure(encoding='utf-8')
r=Path(__file__).resolve().parents[1];out=r/'docs/人物照片补全';out.mkdir(exist_ok=True)
def get(params):
 u='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({'format':'json','action':'query',**params})
 with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'ShanheYoujiResearch/1.0 educational image provenance'}),timeout=25) as f:return json.load(f)
names=['史砚芬','史良','周恩来','宋振中','张太雷','张应春','恽代英','李公朴','瞿秋白','秦邦宪','许晓轩','郭纲琳','钱振标','陆定一','顾正红','江竹筠','狼牙山五壮士']
fixed={'史良':['史良.jpg',"Shiliang on Tian'anmen (cropped).jpg"],'周恩来':['Zhou Enlai 1940.jpg'],'宋振中':['Song Zhenzhong.jpeg'],'张太雷':['Zhang Tailei.jpg'],'恽代英':['Yun Daiying.jpg','恽代英.jpg'],'李公朴':['Li Gongpu.jpg'],'瞿秋白':['Qu Qiubai.JPG'],'陆定一':['Lu Dingyi.jpg'],'秦邦宪':['Bo Gu.jpg']}
def inspect(name):
 try:
  titles=['File:'+s for s in fixed.get(name,[])]
  search=get({'list':'search','srnamespace':6,'srlimit':5,'srsearch':name})
  titles+= [x['title'] for x in search.get('query',{}).get('search',[])]
  if not titles:return {'name':name,'files':[],'status':'未检索到文件'}
  d=get({'titles':'|'.join(dict.fromkeys(titles)),'prop':'imageinfo','iiprop':'url|extmetadata'})
  files=[p for p in d.get('query',{}).get('pages',{}).values() if p.get('imageinfo')]
  return {'name':name,'files':files}
 except Exception as e:return {'name':name,'files':[],'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(inspect,names))
(out/'候选与许可原始记录.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
for x in results:
 print('\n'+x['name'],x.get('error',''))
 for p in x['files']:
  m=p['imageinfo'][0].get('extmetadata',{})
  clean=lambda k:re.sub('<[^>]+>',' ',m.get(k,{}).get('value',''))[:240]
  print(p['title'],'|',clean('DateTimeOriginal'),'|',clean('LicenseShortName'),'|',clean('ImageDescription'),'|',clean('Credit'))
