"""整理本轮已阅读的官方正文，仅保存必要短摘录及链接，不复制整篇作品。"""
from pathlib import Path
import json, html, zipfile
from concurrent.futures import ThreadPoolExecutor
import requests

ROOT=Path(__file__).parent
DATE='2026-10-11'
rows=[
('L-S01','无锡博物馆名录','无锡市文化广电和旅游局','2025-07-25','https://crtt.wuxi.gov.cn/doc/2025/07/25/4618630.shtml','表格第21、24项','名称、地址、名录免费开放字段','老陆巷4号；汤巷45号','政府名录，不证明当前开放'),
('L-S02','瞿秋白纪念馆','常州市人民政府网站；搜索展示来源常州名人故居管理中心，打开版本来源栏为空','2026-04-07','https://www.changzhou.gov.cn/ns_news/412621545869070','正文第1、2段','地址、组成、瞿秋白生平展','延陵西路188号','政府景点介绍，展示来源栏存在版本差异'),
('L-S03','关于瞿秋白纪念馆恢复开放的通知','常州市文化广电和旅游局；落款常州三杰纪念馆','2024-12-05','https://wglj.changzhou.gov.cn/html/wgxj/2024/EFABJFDB_1205/89504.html','正文恢复开放及预约段','当次开放时间、参观预约、团队讲解预约及电话','参观无需提前预约','2024年公告，不证明2026年当天营业'),
('L-S04','“好家风、好家训”探访陆定一故居','共青团无锡市委网站；页面来源栏为空','2018-08-07','https://thyouth.wuxi.gov.cn/doc/2018/08/07/1900426.shtml','正文第1、2段','老陆巷场所、当时生平陈列、活动现场','陆定一同志生平事迹陈列','政府机构网站活动报道，出生地措辞未作独立定论'),
('L-S05','张闻天旧居','无锡博物院','2016-12-07','https://www.wxmuseum.cn/News/Details/11794b0d-0ea6-48b7-8991-19665dd19c8c','正文第1段、人物段末及开放信息段','汤巷45号、生平图片展、晚年居住、当页开放信息和电话','张闻天生平图片展','馆方专题页；旧开放字段需再次核实'),
('L-S06','张太雷纪念馆','中共常州市委组织部','2026-03-30','https://zg.changzhou.gov.cn/index.php?a=show&c=phone&catid=14578&id=59753','点位简介、特色项目、联系电话；排除页脚地址','和平中路子和里3号、组成、生平事迹展和电话','和平中路子和里3号','官方教育点位介绍，不保证各项目随到随开'),
('L-S07','今天起，常州三杰纪念馆新面貌亮相','常州文明网；来源常州日报；郑雨露、常文广旅/文，朱臻/摄','2021-04-29','https://wenming.changzhou.gov.cn/html/wmw/2021/MKIQQIAP_0429/73406.html','正文怀霜社段、图片图注及文末链接段','2021年游客中心入口线索、当年三馆开放安排及照片图注','怀霜社作为参观起点','常州日报转载，非独立馆方服务公告'),
('L-S08','红色基因与国学精粹的跨时空交响','无锡市梁溪区人民政府；来源崇安寺街道办事处','2025-04-28','https://www.wxlx.gov.cn/doc/2025/04/28/4554040.shtml','第三站／红色传承段','秦邦宪故居地址及当次参观报道','崇宁路112号','政府街道活动报道，不据报道保证展品现仍在展'),
('L-S09','寻访故里忆峥嵘，淬炼党性践初心——生命科学与健康工程学院赴秦邦宪故居开展党性教育实践活动','江南大学生命科学与健康工程学院；图文解明菁、陈董','2026-04-23','https://slshe.jiangnan.edu.cn/info/1090/7283.htm','正文第2段及活动合影图注','秦邦宪故居地址、青少年时期居所、生平主题介绍','青少年时期的居所','高校活动报道，非馆方运营公告'),
('L-S10','对市十六届人大五次会议第0109号建议的答复函','中共无锡市委宣传部网站','2021-07-30','https://xcb.wuxi.gov.cn/doc/2021/07/30/3420145.shtml','正文含2020年11月陆定一祖居段','该页记载的祖居开放阶段','2020年11月','官方答复函，未证明为首次开放或不同阶段同一事件'),
('L-S11','秦邦宪故居','无锡职业技术大学现网站；发布者魏艳，历史页面','2014-11-21','https://www.wxit.edu.cn/info/1571/168001.htm','正文地址及陈列段；文末图片图注','地址、当时生平事迹陈列、照片线索','秦邦宪生平事迹陈列','高校教育基地介绍；不引入本文全部生平和亲属细节'),
]
def check(row):
 sid,title,org,date,url,pos,facts,excerpt,relation=row
 out=dict(id=sid,title=title,institution=org,publishedAt=date,accessedAt=DATE,url=url,finalUrl=url,position=pos,supports=facts,excerpt=excerpt,relation=relation,bodyStatus='本轮web正文已取得并阅读；非仅搜索摘要',redirectStatus='web正文展示地址未变化；直连结果另列')
 try:
  response=requests.get(url,timeout=12);out.update(directHttpStatus=response.status_code,directFinalUrl=response.url)
  if response.url!=url:out['finalUrl']=response.url;out['redirectStatus']='直连观察到跳转，已保存原始及最终地址'
  out['directStatus']='可访问' if response.status_code==200 else '直连受限；不等于链接永久失效'
 except requests.RequestException as e:out.update(directStatus='本轮直连未取得正文：'+type(e).__name__,directFinalUrl=None)
 return out
sources=list(ThreadPoolExecutor(max_workers=6).map(check,rows))
places=[
 dict(id='PLACE-WX-LDY',name='陆定一祖居陈列馆',aliases='陆定一祖居；2018年老陆巷报道称陆定一故居；不自动合并其他地址的同名故居',city='无锡市',district='惠山区',address='堰桥街道天一社区老陆巷4号',person='陆定一',type='祖居陈列馆',sourceIds=['L-S01','L-S04','L-S10'],summary='2025年无锡博物馆名录列有该馆。2018年机构报道介绍老陆巷场所内设陆定一生平事迹陈列。',relation='作为陆定一相关祖居和陈列场所；不据祖居名称推定出生地。',exhibit='2018年报道记有生平事迹陈列和历史照片；当前具体展品、楼层及陈列布局待核。',focus=['对照人物资料了解求学、宣传和文化工作经历。','阅读展板时区分祖居介绍与个人生平事实。'],service='2025年名录免费开放字段为“是”；本轮未取得当前开放时段、预约办法及场馆咨询电话。',phone=None,opening=None,ticket='名录记免费开放；当前政策需确认',issues='2018年已有参观活动，2021年答复函又记2020年11月正式开放，不能自行解释为首次开放。禁止与其他地址的陆定一故居混同。',scope='场所关联可用于人物学习，建馆开放是现代信息；不据此新增1919—1949事件节点'),
 dict(id='PLACE-CZ-QQB',name='瞿秋白纪念馆',aliases='包含瞿秋白故居；不与福建长汀同名纪念馆合并',city='常州市',district='区级归属本轮不作为独立核验字段',address='延陵西路188号',person='瞿秋白',type='纪念馆',sourceIds=['L-S02','L-S03','L-S07'],summary='官方介绍记载由故居和纪念馆两部分组成，馆内设瞿秋白生平展。',relation='纪念瞿秋白的专题场馆；当代展陈不是1925年现场原件。',exhibit='2026年介绍记载瞿秋白生平展采用实物、图片和多媒体；不推定具体物件真伪或拍摄许可。',focus=['按展览了解求学、革命工作与文化贡献，再核对人物来源。','比较故居空间、实物与艺术表现各自能支持什么。'],service='2024-12-05通知：周二至周日9:00—17:00，周一闭馆（法定节假日除外）；参观无需提前预约，团队讲解提前预约。仅作为旧公告资料，2026-10-11状态未知。',phone='0519-86636909（2024年通知）',opening=None,ticket='本轮未取得当前票价公告；不由无需预约推定免费',issues='2021年报道为9:00—16:00，2024年通知为9:00—17:00，按各自日期保存。2021年怀霜社入口线索不能代替当前游客入口坐标。',scope='人物资料可聚焦1919—1949，纪念馆成立和游客中心建设属现代服务信息'),
 dict(id='PLACE-WX-ZWT',name='张闻天旧居',aliases='无锡汤巷旧居；不与上海或丹东的张闻天故居、旧居合并',city='无锡市',district='区级归属本轮不作为独立核验字段',address='汤巷45号',person='张闻天',type='旧居',sourceIds=['L-S01','L-S05'],summary='馆方专题页介绍旧居内设张闻天生平图片展，并记有卧室兼书房复原陈列。',relation='馆方记载1975年迁居无锡；不是1919—1949年本人在此居住的证据。',exhibit='2016年专题页记载生平图片展及复原陈列。参观展示与原始现场必须区别，不保证2016年布局原样保留。',focus=['可从展览了解人物革命时期经历，注明无锡晚年居住发生于1949年后。','辨认历史照片、实物和复原陈列的不同证据性质。'],service='2016年馆方页记周二至周日9:00—17:00，16:00后停止入场，周一闭馆（国家法定节假日除外）；当前停止入场时刻及预约需再次核实。',phone='0510-82758567（2016年馆方页）',opening=None,ticket='2025年名录记免费开放；当前政策需确认',issues='不移用上海张闻天故居的开放时间；不把网页页脚电话当馆方电话；不使用旧公交列表生成现行出行方案。',scope='标注“人物纪念与学习场所／1949年后居住关联”；不纳入革命时期事件发生地统计'),
 dict(id='PLACE-CZ-ZTL',name='张太雷纪念馆',aliases='由张太雷故居、纪念馆组成；具体入口另核',city='常州市',district='天宁区',address='和平中路子和里3号',person='张太雷',type='纪念馆',sourceIds=['L-S06','L-S07'],summary='2026年官方点位介绍列有张太雷故居、生平事迹展以及教育活动项目。',relation='张太雷相关故居与纪念展陈；剧游、皮影戏及情景党课是现代文化表达，不作现场史料。',exhibit='2026年点位介绍列张太雷生平事迹展。活动项目存在不等于日常散客可随时参加。',focus=['了解人物生平及与革命事件的联系，具体结论以人物来源为准。','将故居、生平展与现代剧游、情景课程分开理解。'],service='2021年报道记周二至周日9:00—16:00、周一闭馆及团队电话预约；目前是否沿用未确认。',phone='0519-88873919（2026年点位介绍）',opening=None,ticket='当前票价未取得直接依据',issues='页脚龙城大道1280号1号楼属于组织部办公地址，不是纪念馆地址；不能将课程时长当散客参观总耗时。',scope='相关历史学习地点；现代课程和展陈不进入人物1919—1949时间线'),
 dict(id='PLACE-WX-QBC',name='秦邦宪故居',aliases='博古相关故居；不将不同历史住址自动合并',city='无锡市',district='梁溪区',address='崇宁路112号',person='秦邦宪',type='故居',sourceIds=['L-S08','L-S09','L-S11'],summary='2025年区政府报道与2026年高校活动报道均指向崇宁路112号；高校报道介绍其为秦邦宪青少年时期居所并以生平事迹为展陈主线。',relation='青少年时期居所的记载支持人物关联；本轮不裁定精确入住结束年份。',exhibit='近期高校报道介绍历史照片、生活实物、文献资料的生平展示；具体展品及真迹身份未独立核验。',focus=['围绕早年学习、革命历程与新闻工作阅读展陈。','对照文字说明，区分照片、文献、雕塑与复原场景。'],service='本轮未取得当前馆方开放、预约、门票和咨询电话的直接公告；不采用旅游平台即时营业标签。',phone=None,opening=None,ticket='2014年高校介绍记当年免费开放；当前政策未知',issues='高校页面是教育基地和活动报道，不是运营公告；页面下方学校地址、招生电话不作为场馆信息。',scope='人物相关居所和学习场馆；精确历史居住区间待其他人物资料核验'),
]
for p in places:
 p.update(province='江苏省',accessedAt=DATE,coordinate=None,coordinateType='未取得已核验入口坐标；未来接入须GCJ-02',entranceStatus='待核验',currentOpeningStatus='未知',reservationStatus='旧记录或待核；见service',reviewStatus='source_checked',published=False,imagesStatus='仅候选线索，待识别及授权',accessibility='未取得无障碍设施依据')
(ROOT/'地点结构化资料.json').write_text(json.dumps(dict(collectedAt=DATE,places=places,sources=sources),ensure_ascii=False,indent=2),encoding='utf-8')
def link(s):return f"[{s['id']} {s['title']}]({s['url']})"
sm='# 原始来源清单\n\n访问日期：'+DATE+'。web取得正文与直连HTTP结果分别记录；403不自动判定永久失效。只保存必要摘录，不复制整篇作品。\n\n'
for s in sources:
 sm+=f"## {s['id']} {s['title']}\n\n- 机构／作者：{s['institution']}\n- 发布日期：{s['publishedAt']}\n- 实际访问日期：{s['accessedAt']}\n- 原始网址：{s['url']}\n- 最终地址：{s['finalUrl']}\n- 跳转记录：{s['redirectStatus']}\n- 正文取得：{s['bodyStatus']}\n- 直连状态：{s.get('directHttpStatus','未取得')}；{s['directStatus']}\n- 直连最终地址：{s.get('directFinalUrl') or '本轮未取得'}\n- 支持字段：{s['supports']}\n- 证据位置：{s['position']}\n- 必要短摘录：{s['excerpt']}\n- 来源关系及边界：{s['relation']}\n\n"
(ROOT/'原始来源清单.md').write_text(sm,encoding='utf-8')
byid={s['id']:s for s in sources}
audit=[]
for p in places:
 text=f"# {p['name']}\n\n搜集日期：{DATE}。本轮核对网页正文，状态为资料试读；未作独立复核签字、实地核验或图片授权。\n\n"
 for heading,fields in [('基本信息',[('地点ID','id'),('名称','name'),('别名与区分','aliases'),('省','province'),('市','city'),('区','district'),('地址','address'),('类型','type')]),('历史与参观看点',[('简介','summary'),('人物关联','relation'),('关联人物','person'),('网页记载的展陈','exhibit'),('时间范围边界','scope')]),('参观服务',[('开放与预约记录','service'),('咨询电话','phone'),('门票','ticket'),('现时开放状态','currentOpeningStatus'),('无障碍信息','accessibility')]),('导航入口',[('坐标','coordinate'),('坐标系与要求','coordinateType'),('入口核验状态','entranceStatus')])]:
  text+=f'## {heading}\n\n'+''.join(f'- {label}：{p[key] if p[key] is not None else "本轮未取得，不能填写估计值"}\n' for label,key in fields)+'\n'
 text+='## 项目提出的阅读建议（不是馆方承诺）\n\n'+''.join('- '+v+'\n' for v in p['focus'])+'\n## 风险与待补充\n\n'+p['issues']+'\n\n图片只保存候选原始页面和图注，未下载、未授权，不作为可发布配图。游客入口需要地图候选点与馆方入口说明或实地记录交叉确认。本轮未取得坐标，不启用GPS距离或路线。\n\n## 对应资料来源\n\n'+''.join('- '+link(byid[s])+'；'+byid[s]['position']+'\n' for s in p['sourceIds'])
 (ROOT/(p['name']+'.md')).write_text(text,encoding='utf-8')
 for field,issue in [('入口坐标','没有游客入口的坐标与核验依据'),('现时开放及预约','保留旧公告日期或未知，不能显示当前正常开放'),('图片','识别与使用许可尚未完成')]:audit.append(dict(id=p['id']+'-'+field,problem=issue,evidence=','.join(p['sourceIds']),suggestion='补现场记录／最新馆方公告／授权后再启用对应功能',status='待授权' if field=='图片' else '待核验',blocks='阻止图片公开' if field=='图片' else '阻止当前营业断言' if field.startswith('现时') else '阻止附近距离与导航'))
 audit.append(dict(id=p['id']+'-边界',problem=p['issues'],evidence=','.join(p['sourceIds']),suggestion=p['scope'],status='待核验',blocks='限制对应字段；不阻止有来源的基础介绍试读'))
am='# 地点核查与缺口表\n\n|记录编号|问题|证据|修改／补充建议|状态|阻止范围|\n|---|---|---|---|---|---|\n'+''.join('|'+ '|'.join(str(a[k]).replace('|','／') for k in ['id','problem','evidence','suggestion','status','blocks'])+'|\n' for a in audit)
(ROOT/'核查与缺口表.md').write_text(am,encoding='utf-8')
images=[dict(id='IMG-QBC-01',place='秦邦宪故居',page=byid['L-S11']['url'],caption='秦邦宪故居（文末图片图注）',asset='https://www.wxit.edu.cn/__local/A/9A/19/C159241E413583EA0C61458DF20_25952BD8_367E5.jpg?e=.jpg',status='网页图注明确；本轮图像请求超时，未做视觉识别',author='未显示',permission='待授权'),dict(id='IMG-QBC-02',place='秦邦宪故居',page=byid['L-S11']['url'],caption='秦邦宪生平事迹陈列',asset='https://www.wxit.edu.cn/__local/D/DE/F1/70255804E3691E14AD9B73E05AC_1F965D69_6C0F5.jpg?e=.jpg',status='本轮图像请求超时，未做视觉识别',author='未显示',permission='待授权'),dict(id='IMG-QBC-03',place='秦邦宪故居',page=byid['L-S09']['url'],caption='活动合影',asset='https://slshe.jiangnan.edu.cn/__local/2/20/D2/0863EE02F4C32AB31BB71E7A69F_11CAEFD5_1E2FD.jpg',status='本轮图像请求超时；合影不是人物生前照片，包含当代人员肖像',author='页面图文解明菁、陈董；不自动认定单张摄影权利归属',permission='待授权')]
for name,sid,note in [('瞿秋白纪念馆','L-S02','正文插图无具体图注，需查看原图识别；不据文件名判定拍摄年份'),('陆定一祖居陈列馆','L-S04','活动报道附图无具体图注，不能作为历史人物照片'),('张闻天旧居','L-S05','正文有三张图片链接，未完成单张识别；页面记录布局不保证当前布局'),('张太雷纪念馆','L-S06','点位简介有插图，未逐张识别')]:images.append(dict(id='IMG-'+sid,place=name,page=byid[sid]['url'],caption=note,asset=None,status='候选页面已找到；图片识别待核验',author='未显示',permission='待授权'))
(ROOT/'图片候选与许可.json').write_text(json.dumps(images,ensure_ascii=False,indent=2),encoding='utf-8')
im='# 图片候选与许可\n\n本轮没有下载图片；以下不是已授权素材。请求超时不表示图片永久失效。\n\n'
for i in images:im+=f"## {i['id']} {i['place']}\n\n- 原始页面：{i['page']}\n- 图片地址：{i['asset'] or '本轮未取得，回原始页面查看，不编造地址'}\n- 图注／线索：{i['caption']}\n- 作者：{i['author']}\n- 状态：{i['status']}\n- 使用许可：{i['permission']}\n- 拍摄日期：未核到；不能从报道日期推导\n\n"
(ROOT/'图片候选与许可.md').write_text(im,encoding='utf-8')
summary='# 首批历史地点资料包\n\n搜集日期：2026-10-11；5处地点、11份已读取正文的来源记录。基础信息有依据，入口坐标核验0处，当前开放状态确认0处，已授权图片0张。只保存短摘录及原始链接，不包含整篇受保护作品。\n\n'
summary+='|地点|地址|现时参观状态|导航|\n|---|---|---|---|\n'+''.join(f"|[{p['name']}]({p['name']}.md)|{p['city']}{p['address']}|旧记录／待确认|入口坐标待核验|\n" for p in places)
summary+='\n## 文件说明\n\n- 每处地点一份完整Markdown档案。\n- 原始来源清单：机构、发布日期、访问日期、原始和最终地址、证据位置、短摘录、转载与直连状态。\n- 地点结构化资料.json：可供后续接入，但不是现有后端content.json格式，不能直接覆盖。\n- 图片候选与许可：保存候选图注和地址，未下载和授权。\n- 核查与缺口表：逐字段说明不能启用的功能。\n\n## 接入建议\n\n有依据的名称、地址及明确限定的展陈介绍可先试读。保留每个字段的来源ID。旧开放公告只在“历史服务记录”展示；实际营业仍为未知。新增两处地点尚未修改后端，避免在没有审阅时自动扩大已展示数据。张闻天无锡旧居属于1949年后的居住关联，但可作为了解人物革命经历的学习场馆，应明确区分。无锡惠山与中心城区不可因同市就宣称可在一小时内步行走完。\n\n## 后续现场补核\n\n确认游客入口及地图点位，记录GCJ-02坐标、入口照片和日期；向场馆核实当前开放、预约、临时闭馆及可公开咨询电话；询问摄影和图片使用规则。以上只是待办，没有替团队完成实地或电话核验。\n'
(ROOT/'资料总览.md').write_text(summary,encoding='utf-8')
body=html.escape(summary)
(ROOT/'资料总览.html').write_text('<!doctype html><meta charset="utf-8"><title>历史地点资料包</title><style>body{max-width:1000px;margin:40px auto;padding:24px;background:#fbf5e9;color:#35281d;font:16px/1.9 sans-serif}h1{color:#982b28}pre{white-space:pre-wrap}a{color:#982b28}</style><h1>首批5处历史地点资料</h1>'+''.join(f'<p><a href="{html.escape(p["name"])}.md">{html.escape(p["name"])}</a></p>' for p in places)+'<pre>'+body+'</pre>',encoding='utf-8')
assert len(places)==5 and len(sources)==11
assert all(set(p['sourceIds'])<=set(byid) for p in places)
assert all(p['coordinate'] is None and p['opening'] is None and not p['published'] for p in places)
with zipfile.ZipFile(ROOT.parent/'首批5处地点资料包.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in ROOT.iterdir():
  if p.is_file() and p.suffix in ['.md','.json','.html']:z.write(p,p.name)
print('Collected: 5 venue dossiers, 11 body-read sources, 7 image leads; coordinates/open-now/authorized-images remain pending.')
