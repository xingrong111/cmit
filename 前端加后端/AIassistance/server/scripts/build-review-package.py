from pathlib import Path
import json,shutil,hashlib,urllib.request,concurrent.futures
root=Path(r'E:\CMIT\AIassistance');out=root/'docs'/'地点资料核对包-20261011'
for name in ['01-逐地点档案','02-本轮来源与证据','03-入口与开放核验','04-图片许可','05-技术演练','06-既有资料参考']:(out/name).mkdir(parents=True,exist_ok=True)
def write(rel,text):(out/rel).write_text(text,encoding='utf-8')
def dump(rel,data):write(rel,json.dumps(data,ensure_ascii=False,indent=2))
# Preserve previously collected material explicitly as inherited references.
for p in (root/'docs'/'地点资料').iterdir():
 if p.is_file() and p.suffix in ['.md','.json','.html']:shutil.copy2(p,out/'06-既有资料参考'/p.name)
shutil.copy2(root/'docs'/'资料管理'/'入口核验记录.json',out/'03-入口与开放核验'/'入口候选记录.json')
shutil.copy2(root/'docs'/'资料管理'/'导入重启回滚演练.json',out/'05-技术演练'/'导入重启回滚演练.json')
sources=[]
def source(id,title,institution,date,url,position,facts,excerpt='',status='已取得正文',relation='未发现同稿；不据此认定独立史料',final=None):
 sources.append(dict(id=id,title=title,institution=institution,publishedAt=date,accessedAt='2026-10-11',originalURL=url,finalURL=final or url,position=position,supports=facts,shortExcerpt=excerpt,accessStatus=status,reprintRelation=relation,reviewStatus='待独立核验'))
source('R01','关于瞿秋白纪念馆恢复开放的通知','常州市文化广电和旅游局／常州三杰纪念馆','2024-12-05','https://wglj.changzhou.gov.cn/content/suitable/show?catid=12251&id=89504','通知正文第1段（本轮正文行13）',['2024年通知记周二至周日9:00—17:00、周一闭馆（法定节假日除外）','普通参观无需提前预约；团队讲解需提前预约，0519-86636909','不证明2026-10-11仍执行'],'参观无需提前预约。团队讲解需提前预约',relation='既有L-S03的同一通知，适老版地址不是第二份独立证据')
source('R02','瞿秋白纪念馆','常州市人民政府网站；本轮页面来源栏为空','2026-04-07','https://www.changzhou.gov.cn/ns_news/412621545869070','正文第1—2段（行16、18）',['常州市延陵西路188号；包含故居和纪念馆；内设生平展','未给具体游客入口坐标或当前营业公告'],'由故居和纪念馆两部分组成',relation='既有L-S02同页；来源栏与搜索摘要显示不同，以本轮正文为准')
source('R03','张太雷纪念馆','中共常州市委组织部','2026-03-30','https://zg.changzhou.gov.cn/index.php?a=show&c=phone&catid=14578&id=59753','点位简介／特色项目／联系电话（行6）',['和平中路子和里3号；包含故居、纪念馆；电话0519-88873919','展陈、剧游与课程是现代教育项目，不是现场原始史料','未给当前开放时间或入口坐标'],'常州市天宁区和平中路子和里3号',relation='既有L-S06同页')
source('R04','红色基因与国学精粹的跨时空交响','无锡市梁溪区崇安寺街道办事处','2025-04-28 09:57','https://www.wxlx.gov.cn/doc/2025/04/28/4554040.shtml','第三站：红色基因的时空传承／红色传承（行61）',['秦邦宪故居在崇宁路112号；报道参观展陈','活动报道不能证明持续开放或无需预约'],'位于无锡市梁溪区崇宁路112号的秦邦宪故居',relation='既有L-S08同页')
source('R05','关于修缮陆定一故居有关问题的建议','无锡市人大常委会网站','2012-07-13','https://rd.wuxi.gov.cn/doc/2012/07/13/1695168.shtml','一、故居现状（行9）',['城中西河头28号（该页记今县前街8号）的陆定一故居，不能并入惠山老陆巷祖居','只记录2012年建议中的地址与现状，不能推定现在经营状态'],'无锡城中西河头28号（今县前街8号）')
source('R06','对市十六届人大五次会议第0109号建议的答复函','中共无锡市委宣传部','网页2021-07-30；落款2021-07-29','https://xcb.wuxi.gov.cn/doc/2021/07/30/3420145.shtml','二是修复建设名人故居、纪念馆（行32）',['正文记2020年11月陆定一祖居正式对外开放','不自行说首次开放，与2018年参观记录并列'],'2020年11月，陆定一祖居正式对外开放',relation='既有L-S10同页')
source('R07','“好家风、好家训”探访陆定一故居','共青团无锡市委员会网站','2018-08-07','https://thyouth.wuxi.gov.cn/doc/2018/08/07/1900426.shtml','正文第1—2段（行25—26）',['报道堰桥街道天一社区老陆巷场所及生平事迹陈列','报道有出生地表述，尚未交叉核到独立材料，不直接进入人物出生字段','2018年参观活动不证明当前开放'],'故居内有陆定一同志生平事迹陈列',relation='既有L-S04同页')
source('R08','今天起，常州三杰纪念馆新面貌亮相','常州文明网；来源常州日报；郑雨露、常文广旅／文，朱臻／摄','2021-04-29','https://wenming.changzhou.gov.cn/html/wmw/2021/MKIQQIAP_0429/73406.html','正文游客中心段及文末链接（本轮行7）',['2021年报道指出怀霜社位于瞿秋白纪念馆东侧，可作为参观起点','文末旧时段9—16点；2024瞿馆通知9—17点，应分日期存储','不能由方向描述推算GCJ-02入口坐标；图片未提供再使用许可'],'怀霜社作为参观起点',relation='常州日报转载；既有L-S07同稿，不重复计算')
source('R09','张闻天旧居','无锡博物院','2016-12-07（既有记录）','https://www.wxmuseum.cn/News/Details/11794b0d-0ea6-48b7-8991-19665dd19c8c','本轮直接打开两次超时；旧记录专题馆介绍',['旧记录汤巷45号、1975年迁居、电话0510-82758567；本轮不能刷新为已核','原有9—17点、16点停入场仅旧记录'],status='本轮未取得直接打开正文；搜索工具返回索引内容，保留旧线索',relation='既有L-S05；不将本次搜索索引当成重新核验')
source('R10','无锡博物馆名录（既有资料标题待复核）','无锡市文广旅游局网站（既有记录）','2025-07-25（既有记录）','https://crtt.wuxi.gov.cn/doc/2025/07/25/4618630.shtml','本轮打开超时；既有名录第21、24项',['既有资料列陆定一祖居陈列馆、张闻天旧居及免费字段；本轮未取得正文','不得作为当前开放的重新确认'],status='本轮未取得正文；未认定永久失效',relation='既有L-S01')
dump('02-本轮来源与证据/来源索引.json',sources)
write('02-本轮来源与证据/来源索引.md','# 本轮来源索引\n\n访问日期统一为2026-10-11。未取得正文的两页不标失效；后续复核者需重新打开。仅保留必要摘录，未复制整篇作品。\n\n'+'\n\n'.join(f"## {s['id']} {s['title']}\n\n- 机构：{s['institution']}\n- 发布：{s['publishedAt']}\n- 原始URL：{s['originalURL']}\n- 最终URL：{s['finalURL']}\n- 正文状态：{s['accessStatus']}\n- 定位：{s['position']}\n- 支持范围：{'；'.join(s['supports'])}\n- 必要短摘录：{s['shortExcerpt'] or '本轮不摘录'}\n- 转载／重复：{s['reprintRelation']}\n- 独立复核状态：{s['reviewStatus']}" for s in sources))
places=json.loads((root/'docs'/'地点资料'/'地点结构化资料.json').read_text(encoding='utf-8'))['places']
refs={'PLACE-WX-LDY':['R05','R06','R07','R10'],'PLACE-CZ-QQB':['R01','R02','R08'],'PLACE-WX-ZWT':['R09','R10'],'PLACE-CZ-ZTL':['R03','R08'],'PLACE-WX-QBC':['R04']}
issues={'PLACE-WX-LDY':'禁止混同城中县前街故居与惠山祖居；2018参观／2020正式开放不合并成首次开放；出生地只见单页报道暂不采用。','PLACE-CZ-QQB':'东侧怀霜社为2021年参观起点线索；旧9—16点与2024通知9—17点有日期先后；普通参观与团队讲解预约分别记录。','PLACE-WX-ZWT':'无锡旧居属1975年晚年关联，不能展示为1919—1949年居住地点；当前开放、停入场时间尚未刷新。','PLACE-CZ-ZTL':'正文子和里3号是场馆；页脚龙城大道是机构地址；现代剧游不能当史实。','PLACE-WX-QBC':'2025年活动参观只证明当次活动报道；不推导当前面向所有游客开放。'}
rows=[]
for p in places:
 rs=refs[p['id']]
 text=f"# {p['name']} · 独立核对档案\n\n资料访问：2026-10-11；状态：待独立核验，未批准公开导航。\n\n## 识别与地址\n\n- ID：{p['id']}\n- 城市／地区：{p['city']}／{p.get('district','待核')}\n- 既有地址：{p['address']}\n- 别称边界：{p.get('aliases','待核')}\n- 本轮正文依据：{', '.join(rs)}，详见来源索引。\n\n## 人物与历史关联\n\n{p['relation']}\n\n{p['scope']}\n\n## 展陈与阅读参考\n\n{p['exhibit']}\n\n## 开放、预约与联系方式\n\n{p['service']}\n\n联系方式：{p.get('phone') or '未核到场馆咨询电话'}。旧电话不保证今日接通；页脚技术支持电话不当成场馆预约电话。\n\n## 入口、坐标与无障碍\n\n入口未核准。原有坐标保持未启用，候选另见入口候选记录。不得使用网页发布日期、照片EXIF或类别中心点推算游客入口。\n\n无障碍：{p.get('accessibility','未取得直接依据')}。照片见台阶也不足以证明整个场馆不具无障碍通道。\n\n## 重点纠错与核对\n\n{issues[p['id']]}\n\n## 图片\n\n官方网页图片保留既有待授权状态。开放许可照片见04文件夹；照片许可和历史事实、当前入口分别审核。\n\n## 请核对者填写\n\n| 字段 | 结论 | 证据URL及正文位置 | 核对人／日期 | 是否可公开 |\n|---|---|---|---|---|\n| 名称与地址 | 待核验 | | | |\n| 历史关联 | 待核验 | | | |\n| 游客入口GCJ-02坐标 | 待核验 | | | 否 |\n| 当前开放与预约 | 待核验 | | | |\n| 图片与署名 | 待核验 | | | |\n"
 write('01-逐地点档案/'+p['name']+'.md',text)
 for field,problem,block in [('地点身份',issues[p['id']],'阻止混用地址和错误历史关联'),('游客入口','尚无精确入口对应证据','阻止真实导航'),('当前开放','历史记录不保证2026-10-11状态','阻止标记为当前已开放'),('图片','官方候选未见明确开放许可','阻止使用未授权官方图片')]:
  rows.append(dict(recordId=f"CHK-{len(rows)+1:03}",placeId=p['id'],field=field,problem=problem,evidenceSourceIds=rs,suggestion='按原始正文核对；补新官方通知或真实核验记录；无依据保持未知',status='待核验' if field!='图片' else '待授权',publicBlock=block,reviewer='',reviewedAt=''))
dump('03-入口与开放核验/逐项复核表.json',rows)
write('03-入口与开放核验/逐项复核表.md','# 逐项复核表\n\n|编号|地点|检查项|问题|证据|建议|状态|公开阻断|\n|---|---|---|---|---|---|---|\n'+'\n'.join(f"|{r['recordId']}|{r['placeId']}|{r['field']}|{r['problem']}|{','.join(r['evidenceSourceIds'])}|{r['suggestion']}|{r['status']}|{r['publicBlock']}|" for r in rows))
write('03-入口与开放核验/入口实地记录模板.md','''# 游客入口核验模板

地点ID／名称：
核验人／核验日期和当地时间：
官方入口说明URL或现场记录文件：
入口照片文件、原始拍摄人及拍摄日期：
入口名称、街道、门牌、相邻标识：
GCJ-02纬度／经度（明确来自微信定位或腾讯地图；其他坐标系不能直接填）：
定位方式、精度提示及坐标是否在可进入门口：
可否步行进入、是否需预约、是否暂停开放：
开放时间、停止入场时间、法定节假日例外：
团队讲解预约与普通参观预约分别记录：
无障碍入口、摄影规定、作品／展板是否允许拍摄传播：
电话或现场核实的记录（不要写未发生的联络）：
独立复核人／日期／结论：

仅场馆POI或地址不能批准入口。没有答案就填未知；不得从照片猜坐标。
''')
images=[]
for id,title,author,date,license,asset,place in [
 ('IMG-OPEN-QBC','Former Residence of Qin Bangxian 01 2011-11.JPG','猫猫的日记本','2011-11-13','3.0','https://upload.wikimedia.org/wikipedia/commons/d/d0/Former_Residence_of_Qin_Bangxian_01_2011-11.JPG','秦邦宪故居'),
 ('IMG-OPEN-QQB','瞿秋白故居 入口.jpg','Cangminzho','2017-04-07','4.0','https://upload.wikimedia.org/wikipedia/commons/b/b7/%E7%9E%BF%E7%A7%8B%E7%99%BD%E6%95%85%E5%B1%85_%E5%85%A5%E5%8F%A3.jpg','瞿秋白故居'),
 ('IMG-OPEN-ZTL','张太雷旧居 入口.jpg','Cangminzho','2017-04-07','4.0','https://upload.wikimedia.org/wikipedia/commons/7/74/%E5%BC%A0%E5%A4%AA%E9%9B%B7%E6%97%A7%E5%B1%85_%E5%85%A5%E5%8F%A3.jpg','张太雷旧居')]:
 page='https://commons.wikimedia.org/wiki/File:'+title.replace(' ','_')
 images.append(dict(id=id,title=title,place=place,author=author,capturedAt=date,accessedAt='2026-10-11',originalPage=page,finalPage=page,assetURL=asset,license='CC BY-SA '+license,licenseURL='https://creativecommons.org/licenses/by-sa/'+license+'/',source='上传者声明Own work',evidencePosition='文件描述页 Summary 与 Licensing；上传历史',licenseStatus='已找到明确许可声明，按条款可用',identityStatus='文件图注支持场馆名称；待他人独立视觉核对',navigationEvidence=False,changes='未修改原图；未接入前端',credit=f'{title} — {author}，CC BY-SA {license}；原文件及许可链接见本记录。未修改。',allowedUse='按许可可复制、展示和改编，包括商业用途；须署名、附原文件与许可链接、说明修改；改编图片按相同或兼容许可分发',limits='不是场馆授权背书；旧照片不证明当前游客入口、开放或预约。摄影许可不自动覆盖画面内第三方作品等权利。',downloadStatus='待下载',localFile=None))
def download(item):
 try:
  req=urllib.request.Request(item['assetURL'],headers={'User-Agent':'YingjiResearch/1.0 (educational source review)'})
  with urllib.request.urlopen(req,timeout=20) as r:
   b=r.read();item['finalAssetURL']=r.url
  if not b.startswith(b'\xff\xd8'):raise ValueError('未取得JPEG')
  dest=out/'04-图片许可'/(item['id']+'.jpg');dest.write_bytes(b);item.update(downloadStatus='原文件已保存',localFile=dest.name,sha256=hashlib.sha256(b).hexdigest())
 except Exception as e:item['downloadStatus']='本轮未取得图像文件：'+type(e).__name__
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:list(executor.map(download,images))
dump('04-图片许可/开放许可图片记录.json',images)
write('04-图片许可/图片使用与署名.md','# 图片许可使用\n\n仅三张选定文件的开放许可声明已取得，不代表全部官方网页图片获许可。场馆身份仍待独立视觉核对，未自动替换页面。\n\n'+'\n\n'.join(f"## {i['id']}\n\n- 名称：{i['title']}\n- 作者：{i['author']}\n- 拍摄日期：{i['capturedAt']}\n- 原始描述页：{i['originalPage']}\n- 图像原址：{i['assetURL']}\n- 许可：[{i['license']}]({i['licenseURL']})\n- 支持位置：Summary／Licensing。Own work是上传者声明。\n- 条件：{i['allowedUse']}\n- 建议署名：{i['credit']} 原文件：{i['originalPage']}；许可：{i['licenseURL']}\n- 下载：{i['downloadStatus']}\n- 边界：{i['limits']}\n- 独立图像核对：{i['identityStatus']}" for i in images))
write('04-图片许可/不采用图片与缺口.md','''# 暂不采用的图片

1. 既有七项官方图片候选：未找到明确的复制、改编、公开展示许可，继续待授权；网页可浏览不等于可用于小程序。
2. File:Qu Qiubai.JPG：https://commons.wikimedia.org/wiki/File:Qu_Qiubai.JPG 。本轮打开Summary与Licensing；作者Unknown author、来源From old magazine，页面虽然有PD-China标签，同时要求补首次出版和作者资料。暂不据标签保证权利无争议；不将该图作为场馆照片或服饰年代证据。
3. File:瞿秋白烈士纪念馆_(10098952056).jpg：https://commons.wikimedia.org/wiki/File:瞿秋白烈士纪念馆_(10098952056).jpg 。有CC BY 2.0声明，作者郭敏，2013-10-02，Flickr转载且有许可机器人复查记录；但图名没有城市且描述出现“杨成武 瞿秋白”，不能确认是常州场馆，故不进入常州图库。许可存在不等于身份正确。
4. 陆定一祖居与张闻天无锡旧居：本轮未找到已打开、身份匹配且明确开放许可的照片，保留缺口。可以由团队自摄并书面确认摄影者授权，同时遵守场馆摄影规定。

不曾对外发送授权申请，没有虚构授权回复。未下载整部受保护作品。
''')
write('00-阅读与核对顺序.md','''# 地点资料核对包 · 2026-10-11

范围：成员4的AI导览与历史足迹雷达，首批五处场馆。暂不合并其他成员模块，不进行微信真机测试。

01：五处独立档案，含地点识别、历史关联、展陈、开放、预约、入口、图片及回填表。
02：本轮10条来源记录，8条取得直接正文、2条本轮未取得正文；每条有原址、最终址、机构、日期、必要短摘录、支持范围和转载关系。不是10份独立史料。
03：20条复核事项、入口候选和实地记录模板；无已批准入口。
04：三张有明确开放许可声明的图片记录、署名条件、下载结果及不采用原因。许可与图像身份分开审核。
05：隔离导入、重启HTTP验证及回滚记录；正式资料未改动。
06：上轮搜集资料，仅作继承参考，不将复制到此包视为重新核验。

核对者先阅读01和03，再逐条打开02原始链接。填写独立核对人、日期和证据，不能只因文字通顺、官方域名或来源数量多就通过。

五处地点的入口、当前营业和部分图片仍有缺口。本包不是最终审定版本，不新增地图人数，也不把POI候选直接写进已核导航坐标。
''')
print(json.dumps({'package':str(out),'sources':len(sources),'reviewItems':len(rows),'images':[{i['id']:i['downloadStatus']} for i in images]},ensure_ascii=False))
