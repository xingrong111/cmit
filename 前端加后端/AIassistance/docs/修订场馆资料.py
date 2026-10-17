from pathlib import Path
import json,shutil,hashlib,zipfile,html

root=Path('E:/CMIT/AIassistance');docs=root/'docs';old=docs/'地点资料核对包-20261011';new=docs/'地点资料核对包-v2-20261011'
if new.exists():raise RuntimeError('修订包已存在，请勿重复覆盖')
shutil.copytree(old,new)
review=Path('E:/CMIT/核查问题.md').read_text(encoding='utf-8-sig')
(new/'用户提供的独立核查问题.md').write_text(review,encoding='utf-8')
ticket='2014-11-21高校页面记载2005年5月9日免费开放；这是历史开放记录，当前政策未知'
birth='2018年团市委与2024年惠山区页面均有老陆巷出生地表述，措辞相近、转载关系未厘清，不算两份独立证明；不据此直接确定精确出生地点'
for folder in [docs/'地点资料',new/'06-既有资料参考',new/'01-逐地点档案',new/'03-入口与开放核验']:
 for p in folder.glob('*.md'):
  t=p.read_text(encoding='utf-8-sig').replace('2014年高校介绍记当年免费开放；当前政策未知',ticket).replace('出生地只见单页报道暂不采用',birth)
  if p.name=='秦邦宪故居.md' and folder.name=='01-逐地点档案':
   t=t.replace('本轮正文依据：R04，','本轮正文依据：R04（地址及编译书籍、皮箱）；R11（青少年居所与展陈描述）；R12（历史免费开放日期），')
   t=t.replace('青少年时期居所的记载支持人物关联；本轮不裁定精确入住结束年份。','江南大学2026-04-23活动报道（R11／L-S09）记为青少年时期居所；本轮不裁定精确入住结束年份。')
   t=t.replace('近期高校报道介绍历史照片、生活实物、文献资料的生平展示；具体展品及真迹身份未独立核验。','江南大学2026-04-23活动报道（R11／L-S09）介绍历史照片、生活实物与文献资料；R04只用于其直接记载的编译书籍、皮箱等文物，不移用无锡国专纪念馆的展陈描述。两篇均是活动报道，不是馆方当前运营公告，具体展品及真迹身份未独立核验。')
  if p.name=='陆定一祖居陈列馆.md' and folder.name=='01-逐地点档案':t=t.replace('R05, R06, R07, R10','R05, R06, R07, R10, R13')
  p.write_text(t,encoding='utf-8')

content_path=root/'server/data/content.json';data=json.loads(content_path.read_text(encoding='utf-8-sig'))
backup=root/'server/data/backups';backup.mkdir(exist_ok=True)
shutil.copy2(content_path,backup/'content-before-venue-review-20261011.json')
for p in data['places']:
 if p['id']=='PLACE-WX-QBC':p['ticketRecord']=ticket
 if p['id']=='PLACE-WX-LDY':
  p['address']='无锡市惠山区堰桥街道天一社区老陆巷4号'
  p['sourceIds'].append('L-S12')
  p['historicalScope']+='；'+birth
for s in data['sources']:
 if s['id']=='L-S09':s['position']='正文第2段（地址、青少年居所与展陈描述）；属高校活动报道';s['excerpt']='青少年时期的居所'
 if s['id']=='L-S11':s['position']='正文第2段，免费开放历史日期；正文第4段，生平事迹陈列';s['excerpt']='2005年5月9日';s['relation']='网页发表于2014-11-21，所记免费开放为2005-05-09；不证明当前门票政策'
 if s['id']=='L-S01':s['accessStatus']='本轮重新打开正文；名录第21、24项已核对，不是当前营业证明'
 if s['id']=='L-S05':s['accessStatus']='用户提供的独立核查报告已读正文；助手本轮重开超时，两次访问记录分开保存，不认定永久失效'
data['sources'].append({'id':'L-S12','title':'〖陆定一祖居〗','institution':'无锡市惠山区人民政府办公室','publishedAt':'2024-02-28 13:58（独立核查报告及既有访问记录）','accessedAt':'2026-10-11','url':'https://www.huishan.gov.cn/doc/2024/02/28/4186233.shtml','finalUrl':'https://www.huishan.gov.cn/doc/2024/02/28/4186233.shtml','position':'正文场所介绍段；核查报告指出出生地和童年居住表述','excerpt':'位于堰桥街道天一社区老陆巷','relation':'2018年团市委页面措辞相近，转载关系待核；不是第二份独立出生证据','accessStatus':'独立核查报告已取得正文；助手本轮重开未取得正文'})
draft=docs/'场馆修订导入-v2.json';draft.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')

for folder in [docs/'地点资料',new/'06-既有资料参考']:
 p=folder/'地点结构化资料.json';x=json.loads(p.read_text(encoding='utf-8-sig'))
 for venue in x['places']:
  if venue['id']=='PLACE-WX-QBC':venue['ticket']=ticket
  if venue['id']=='PLACE-WX-LDY':venue['historicalBoundary']=birth
 for source in x.get('sources',[]):
  if source['id']=='L-S11':source['position']='正文第2段；网页日期2014-11-21，开放日期2005-05-09';source['excerpt']='2005年5月9日'
 p.write_text(json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')

index_file=new/'02-本轮来源与证据/来源索引.json';sources=json.loads(index_file.read_text(encoding='utf-8-sig'))
for s in sources:
 if s['id'] in ['R09','R10']:s['previousAccessRecord']={'accessStatus':s['accessStatus'],'position':s['position'],'accessedAt':s['accessedAt']}
 if s['id']=='R09':
  s['accessStatus']='独立核查报告已取得正文；助手本轮重开超时。前一轮失败记录已另存'
  s['position']='馆方专题介绍、迁居段、开放信息段；本次按用户独立核查报告定位'
  s['supports']=['独立核查报告核对汤巷45号、1975年8月25日迁居、电话0510-82758567','2016年页记9—17点、16点停入场；不证明当前营业']
  s['shortExcerpt']='1975年8月25日'
 if s['id']=='R10':
  s['title']='无锡博物馆名录';s['institution']='无锡市文化广电和旅游局';s['publishedAt']='2025-07-25 14:35'
  s['accessStatus']='助手本轮重新取得正文；第21、24项核对相符；前一轮超时另存'
  s['position']='名录第21、24项';s['shortExcerpt']='老陆巷4号；汤巷45号'
  s['supports']=['第21项陆定一祖居陈列馆，老陆巷4号，免费开放字段“是”','第24项张闻天旧居，汤巷45号，免费开放字段“是”','只支持2025-07-25名录记载，不证明2026-10-11营业']
for rid,lid in [('R11','L-S09'),('R12','L-S11'),('R13','L-S12')]:
 s=next(a for a in data['sources'] if a['id']==lid)
 supports={'R11':['青少年时期居所与历史照片、实物、文献的展陈描述归属于此高校活动报道，不归于R04','不作为当前开放公告'], 'R12':['网页发布日期2014-11-21；正文免费开放历史日期2005-05-09，两者分开','不扩展采用该页其他生平或亲属细节'], 'R13':[birth,'没有4号门牌、入口坐标及当前营业依据']}[rid]
 sources.append({'id':rid,'title':s['title'],'institution':s['institution'],'publishedAt':s['publishedAt'],'accessedAt':'2026-10-11','originalURL':s['url'],'finalURL':s['finalUrl'],'position':s['position'],'supports':supports,'shortExcerpt':s['excerpt'],'accessStatus':s.get('accessStatus','助手本轮打开正文，支持范围已核对'),'reprintRelation':s['relation'],'reviewStatus':'来源限定核对；不是整馆正式发布批准'})
index_file.write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8')
lines=['# 来源索引 v2','访问日期2026-10-11。旧失败记录、核对报告取得正文、助手本轮重开分别记录。']
for s in sources:
 lines+=['','## '+s['id']+' '+s['title']]+['- '+k+'：'+str(s[k]) for k in ['institution','publishedAt','accessedAt','originalURL','finalURL','position','accessStatus','shortExcerpt','reprintRelation']]+['- 支持范围：'+'；'.join(s['supports'])]
(new/'02-本轮来源与证据/来源索引.md').write_text('\n'.join(lines),encoding='utf-8')

candidate=json.loads((docs/'地点资料/腾讯地图候选点.json').read_text(encoding='utf-8-sig'))
chronology={'date':'2026-10-11','note':'未记录请求时分秒，不补造精确先后；不同访问结果可以不同，但不得指向同一文件声称相反内容','batches':[{'id':'MAP-BATCH-RAW-01','basis':'腾讯地图候选点.json原始存盘结果','records':candidate,'entranceApproved':False},{'id':'MAP-BATCH-NARRATIVE-02','basis':'03入口补查第二轮文字记录','providerStatus':121,'newCandidates':False,'rawResponsePresent':False,'status':'仅过程文字记录，不能替代原始响应'}, {'id':'MAP-OLD-112','basis':'旧第二轮完善结果.md的112/IP叙述','providerStatus':112,'rawResponsePresent':False,'status':'没有找到能匹配该叙述的独立原始响应；不能用来描述当前候选JSON；待核验'}]}
(new/'03-入口与独立核对/腾讯查询统一记录.json').write_text(json.dumps(chronology,ensure_ascii=False,indent=2),encoding='utf-8')
unified='''# 腾讯查询记录纠正说明

2026-10-11修订。按存盘响应、过程文字和无响应旧叙述分组，不编造查询时分秒。

1. 存盘腾讯地图候选点.json：陆定一祖居status=0，有候选31.642796,120.293782；其余4处status=121，无候选。名录“老陆巷4号”与平台“陆巷4号”分别保留。平台电话仅为地图字段，不改成馆方电话。
2. 入口补查第二轮.md：记载又一次陆定一查询status=121。没有另存原始响应，列为过程文字记录。没有新候选，不能把已有坐标称为本次结果。
3. 旧第二轮完善结果.md：112/IP错误叙述没有找到可匹配的独立原始响应，不能据此说当前候选JSON为空。该错误表述已经撤回；不据此重新修改授权IP。

以上均未批准游客入口。保留候选只是为了独立核查，不启用距离、路线或公开地图标记。
'''
(new/'03-入口与独立核对/腾讯查询统一记录.md').write_text(unified,encoding='utf-8')
for folder in [docs/'地点资料',new/'06-既有资料参考']:
 p=folder/'第二轮完善结果.md';t=p.read_text(encoding='utf-8');start=t.index('## 入口坐标：');end=t.index('## 图片许可：',start)
 t=t[:start]+unified+'\n'+t[end:];t='> 2026-10-11 v2修订：撤回“候选JSON为空”结论；不把不同查询批次合成一次。\n\n'+t
 p.write_text(t,encoding='utf-8')
 extra=folder/'核查与缺口表.md'
 with extra.open('a',encoding='utf-8') as f:f.write('\n\n## v2来源范围修订\n'+birth+'。当前入口、营业与图片使用仍分项待核。\n')

update='''# 五处场馆核查处理说明 v2

日期：2026-10-11。原独立核对包和旧ZIP保留，新包以v2为准。

|问题|处理|依据与剩余边界|
|---|---|---|
|秦邦宪展陈来源错挂|新增R11，挂回L-S09江南大学2026-04-23正文；R04只支持其直接记载的内容|本轮已打开高校正文；不批准当前展品状态|
|免费开放年份误写2014|改为高校2014页记载2005-05-09免费开放，同步运行数据与结构化资料|本轮已打开原网页；当前票价未知|
|R09/R10访问状态与06相反|保留前一轮访问失败；追加核查报告取得正文，R10追加助手本轮直接打开成功|R09助手重开超时，不冒称本轮亲读；旧开放公告不是实时营业|
|腾讯三种结果互相混用|统一记录分为原始存盘成功/121、第二轮121文字、未找到响应的旧112叙述；撤回“JSON为空”|没有补造请求时间；没有启用POI为游客入口|
|陆定一出生地“只见单页”|改为至少两页有相关措辞，但转载关系待核，不能当两份独立证明|惠山2024页本轮未取得正文，按独立核查报告追加；不同故居地址仍不合并|

运行资料的5处地点继续published=false、coordinate=null、opening=null。不因资料描述修订批准地图导航。

图片使用条件继续按04许可记录审核；本轮未把原图上架，也未把说明牌图片当建筑实景。未更改已有许可版本或作者署名。

来源与核验批次详见02索引；腾讯查询统一记录详见03。请在v2里继续复核，不修改旧ZIP来掩盖过程。
'''
(new/'修订说明.md').write_text(update,encoding='utf-8');(docs/'五处场馆核查处理说明-v2.md').write_text(update,encoding='utf-8')
for p in [new/'03-入口与开放核验/逐项复核表.json']:
 x=json.loads(p.read_text(encoding='utf-8-sig'))
 for a in x:
  for k,v in a.items():
   if isinstance(v,str):a[k]=v.replace('出生地只见单页报道暂不采用',birth)
 p.write_text(json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
intro=new/'核对入口.html';t=intro.read_text(encoding='utf-8');t=t.replace('<h2>分类文件</h2>','<h2>v2修订结果</h2><p><a href="修订说明.md">先看五项核查处理说明</a> · <a href="03-入口与独立核对/腾讯查询统一记录.md">腾讯查询统一记录</a></p><h2>分类文件</h2>');intro.write_text(t,encoding='utf-8')
manifest=[]
for p in sorted(new.rglob('*')):
 if p.is_file() and p.name!='文件校验清单.json':manifest.append({'path':p.relative_to(new).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size})
(new/'文件校验清单.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
with zipfile.ZipFile(root/'地点资料独立核对包-v2-20261011.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in new.rglob('*'):
  if p.is_file():z.write(p,p.relative_to(new).as_posix())
print('v2修订资料包和待导入运行数据已生成；入口、营业和图片批准状态未改变。')
