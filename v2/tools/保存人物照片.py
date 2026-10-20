from pathlib import Path
from PIL import Image
import json,urllib.request,datetime,hashlib,io,re,time,sys
sys.stdout.reconfigure(encoding='utf-8')
r=Path(__file__).resolve().parents[1];out=r/'docs/人物照片补全';raw=out/'原始照片';raw.mkdir(exist_ok=True);dest=r/'frontend/src/static/人物照片';dest.mkdir(exist_ok=True)
initial=json.loads((out/'候选与许可原始记录.json').read_text(encoding='utf-8'));extra=json.loads((out/'补查文件记录.json').read_text(encoding='utf-8'))
files={p['title']:p for x in initial for p in x['files']};files.update({p['title']:p for p in extra['query']['pages'].values() if p.get('imageinfo')})
choices=[('P002','史良','Qijunzi.jpg','七君子合影；史良为左起第二人。保留全图，未裁切单人。','图页中英文日期不一致，不据此断定拍摄日期'),('P003','周恩来','Zhou Enlai 1927.jpg','周恩来历史照片','文件说明标注1927年'),('P005','张太雷','Zhang Tailei.jpg','张太雷历史照片','拍摄日期未确定'),('P007','恽代英','恽代英.jpg','恽代英历史照片','文件说明标注1924年；原报道只明确人物身份'),('P008','李公朴','Li Gongpu.jpg','李公朴历史照片','拍摄日期未确定'),('P009','瞿秋白','Qu Qiubai.JPG','瞿秋白历史照片','拍摄日期未确定，不作特定年份服饰依据'),('P010','秦邦宪','Qin Bangxian.jpg','秦邦宪（博古）历史照片','拍摄日期未确定'),('P014','陆定一','Lu Dingyi.jpg','陆定一历史照片','文件说明标注1942年'),('P015','顾正红','被上海⽇本纱⼚资本家枪杀的共产党员顾正红烈⼠肖像照⽚.jpg','顾正红历史肖像照片','原文件来源说明标注1925年')]
index=json.loads((r/'frontend/src/data/人物肖像.json').read_text(encoding='utf-8'));log=[]
choices.append(('P004','宋振中','Song Zhenzhong.jpeg','宋振中生前照片；不能作为8岁容貌依据','不确定具体拍摄日期；不把文件日期标签当作原始照片档案'))
for pid,name,title,caption,period in choices:
 p=files['File:'+title];info=p['imageinfo'][0];m=info['extmetadata'];clean=lambda k:re.sub('<[^>]+>',' ',m.get(k,{}).get('value','')).strip()
 assert clean('LicenseShortName')=='Public domain'
 row={'personId':pid,'name':name,'fileTitle':p['title'],'sourceUrl':info['descriptionurl'],'originalImageUrl':info['url'],'accessDate':datetime.date.today().isoformat(),'caption':caption,'period':period,'author':clean('Artist'),'originalCredit':clean('Credit'),'license':clean('LicenseShortName'),'licenseUrl':clean('LicenseUrl'),'licenseBasis':'逐文件页面标注Public domain / PD-China；保留来源地域限制，非权利人授权书，非全球使用保证。','identityBasis':'已读文件逐图说明对应本人的姓名；合影按明确人物位置标注。','status':'待下载'}
 try:
  original=raw/(name+'.jpg')
  if original.exists():blob=original.read_bytes()
  else:
   with urllib.request.urlopen(urllib.request.Request(info['url'],headers={'User-Agent':'ShanheYoujiResearch/1.0 educational image provenance'}),timeout=30) as f:blob=f.read();row['finalImageUrl']=f.url
   Image.open(io.BytesIO(blob)).verify();original.write_bytes(blob)
  row['sha256']=hashlib.sha256(blob).hexdigest()
  im=Image.open(io.BytesIO(blob)).convert('RGB');im.thumbnail((360,480));target=dest/(name+'.jpg');im.save(target,quality=82,optimize=True)
  index[pid]={**index[pid],'src':'/static/人物照片/'+target.name,'caption':caption,'period':period,'sourceUrl':info['descriptionurl'],'sourceTitle':p['title'],'rightsEvidence':row['licenseBasis'],'identityVerified':True,'rightsApproved':True,'status':'按逐图公有领域标注接入；待团队独立复核','identityEvidence':row['identityBasis'],'photoRecord':'docs/人物照片补全/照片接入记录.json'}
  if pid=='P004':
   index[pid]['identityEvidence']='文件逐图说明标注宋振中。新华社另有生前照片；两幅图不按同一原片合并，不将新华社图注或日期移植给本文件。依据各自图注分别记录，不推定拍摄年龄。'
   index[pid]['identitySourceUrl']='https://www.news.cn/20240930/fbe0a9eec2d646258b807ca6f0080bed/c.html'
   row['identitySourceUrl']=index[pid]['identitySourceUrl'];row['boundary']='文件页标注公有领域，但首发出版物未载，保留来源声明与团队复核状态，不称已取得权利人书面授权。'
  row['status']='已接入';print(name,target.stat().st_size,flush=True)
 except Exception as e:row['status']='未接入';row['error']=str(e);print(name,str(e),flush=True)
 log.append(row);time.sleep(.5)
(out/'照片接入记录.json').write_text(json.dumps(log,ensure_ascii=False,indent=2),encoding='utf-8')
(r/'frontend/src/data/人物肖像.json').write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding='utf-8')
print('已接入',sum(x['status']=='已接入' for x in log),'张；未将其他候选照片自动批准。')
