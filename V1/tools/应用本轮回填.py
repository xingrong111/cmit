from pathlib import Path
import json,re,csv,subprocess,sys
sys.stdout.reconfigure(encoding='utf-8')
r=Path(__file__).resolve().parents[1]; out=r/'docs/资料更新-20261017'; data=r/'frontend/src/data'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
dump=lambda p,x:p.write_text(json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
incoming=read(out/'原始回填提取.json'); existing=read(data/'合并人物目录.json')
if not (out/'更新前目录.json').exists():dump(out/'更新前目录.json',existing)
before=read(out/'更新前目录.json'); byraw={i:p for p in before for i in p['rawIds']}
patches={}; audit=[]; documents=[]
def entry(id,name):
 p=byraw.get(id)
 if not p or p['name']!=name:raise ValueError((id,name,p and p['name']))
 return patches.setdefault(p['id'],dict(id=p['id'],name=name,fields={},notes=[],evidence=[]))
def add(id,name,fields,evidence,note=''):
 p=entry(id,name)
 for k,v in fields.items():
  if k in p['fields'] and p['fields'][k]!=v:raise ValueError(('回填之间冲突',id,k))
  p['fields'][k]=v
 if note and note not in p['notes']:p['notes'].append(note)
 if evidence not in p['evidence']:p['evidence'].append(evidence)
def province(code):return next(x['name'] for x in read(data/'省份目录.json') if x['code']==code)
def region(id,name,text,code,ev):
 add(id,name,{'originText':text,'provinceCode':code,'provinceName':province(code),'regionBasis':'本轮回填明确地域表述；待独立复核'},ev)
def log(id,name,part,result,reason):audit.append(dict(原编号=id,姓名=name,资料=part,处理=result,原因=reason))
# 逐条核对摘录后选择；不将出生地、祖籍或活动地改作籍贯。
accepted={
'P0015':('220000','吉林省磐石县'),'P0024':('370000','山东掖县（今莱州市）'),
'P0025':('510000','四川省宜宾县白花镇'),'P0026':('370000','山东沂水县'),
'P0065':('440000','广东兴宁'),'P0097':('210000','辽宁省法库县大六家子村'),
'P0098':('220000','吉林省柳河县大泉眼村'),'P0140':('330000','杭县人（来源原文）'),
'P0167':('340000','安徽寿县瓦埠镇'),'P0168':('340000','安徽池州'),
'P0203':('220000','吉林伊通'),'P0212':('320000','江苏宜兴'),'P0215':('460000','海南文昌'),
'P0230':('410000','河南巩县'),'P0240':('370000','胶县前店口乡大店村（历史地名）'),
'P0248':('410000','南阳县溧河乡（历史地名）'),'P0258':('230000','吉林宁安（今属黑龙江省，来源括注）'),
'P0260':('220000','吉林永吉县'),'P0261':('220000','永吉县（来源原文）'),
'P0262':('230000','黑龙江巴彦县'),'P0265':('430000','湖南邵阳'),
'P0266':('230000','黑龙江宁安县'),'P0269':('360000','江西宜春'),
'P0274':('370000','山东菏泽'),'P0277':('130000','河北藁城县庄合村'),
'P0279':('450000','容县松山乡沙田村（历史地名）'),'P0280':('450000','广西桂林丁字村'),
'P0284':('430000','益阳人（来源原文）'),'P0292':('220000','吉林德惠县'),
'P0294':('510000','四川新都县泰兴乡'),'P0297':('370000','山东无棣县张辛店')}
for cells in incoming['excel']['xl/worksheets/sheet1.xml'][1:]:
 x={re.sub(r'\d+$','',k):v for k,v in cells.items()}; id=x.get('B','');name=x.get('C','')
 if not id:continue
 entry(id,name)
 ev=dict(file='籍贯补充40条.xlsx',row=next(iter(cells)),title=x.get('L',''),publisher=x.get('M',''),publishedAt=x.get('N',''),url=x.get('O',''),finalUrl=x.get('P',''),accessedAt=x.get('Q',''),excerpt=x.get('S',''),position=x.get('T',''),status='回填人记载；本轮未逐站独立核验')
 documents.append(dict(id=id,name=name,record=x))
 if id in accepted:
  code,text=accepted[id];region(id,name,text,code,ev);log(id,name,'Excel','采用明确地域表述，待复核','仅采用摘录直接支持的地域；不扩展为出生地')
 else:
  log(id,name,'Excel','保留线索，不覆盖籍贯','出生地/祖籍不等于籍贯，或具体籍贯的直接链接缺失、来源不足')
  add(id,name,{},ev,'本轮另有地域补充线索，尚不足以覆盖籍贯；详见资料更新报告。')
 # 可分开保留的直接字段，不据此新增中国省份归属。
 if id=='P0020':add(id,name,{'originText':'原籍朝鲜京畿道龙岩郡','provinceCode':'','provinceName':'境外籍贯','regionBasis':'按原籍保留境外地域，不以在华定居地归省'},ev)
 if id=='P0062':add(id,name,{'ancestryText':'山东（来源明确为祖籍）'},ev)
 if id=='P0146':add(id,name,{'ancestryText':'山东（祖籍）','birthplace':'山东掖县'},ev)
 if id=='P0064':add(id,name,{'birthplace':'山东曹县曹家庄'},ev)
 if id=='P0155':add(id,name,{'birthplace':'黑龙江桦川县悦来镇'},ev)
 if id=='P0089':add(id,name,{'birthplace':'天津'},ev,'英国籍、苏格兰背景不作为中国籍贯；不以父母背景填祖籍。')

# 85份记录：搜索摘要、非官方汇编、未取正文、身份存疑的资料保留为候选。
zipaccepted={
'P0170':('610000','陕西岐山'),'P0173':('430000','湖南醴陵'),
'P0219':('370000','山东庆云县东安务村'),'P0222':('140000','山西平定'),
'P0237':('440000','广东台山'),'P0241':('610000','陕西吴堡'),
'P0247':('140000','山西陵川'),'P0255':('450000','广西博白新田乡美沙村'),
'P0283':('130000','河北蠡县'),'P0287':('450000','广西北海铁山港区南康镇黄稍村'),
'P0295':('210000','辽宁凤城'),'P0301':('370000','山东沂水县张庄村'),
'P0304':('130000','河北满城县尉公村')}
birthplaces={'P0234':'浙江上虞县章镇任叶村','P0245':'广东曲江县东厢乡翻溪桥石安村（现属韶关浈江区东联村）','P0251':'江苏常熟浒浦镇','P0302':'山东济南普利门外'}
for file,t in incoming['zip'].items():
 m=re.search(r'(P\d+)-(.+)\.md$',file)
 if not m:continue
 id,name=m.groups();entry(id,name);documents.append(dict(id=id,name=name,file=file,text=t))
 ev=dict(file=file,url=(re.findall(r'https?://[^\s；，。；））\u3002]+',t) or [''])[0],status='回填人记载；本轮未逐站独立核验')
 if id in zipaccepted:
  code,text=zipaccepted[id];region(id,name,text,code,ev);log(id,name,'85份回填','采用明确地域表述，待复核','所列报道摘录明确支持籍贯；精度不超过证据')
 elif id in birthplaces:
  add(id,name,{'birthplace':birthplaces[id]},ev);log(id,name,'85份回填','仅补出生地，待复核','摘录只支持出生地，未将同址推定为籍贯')
 else:
  log(id,name,'85份回填','保留线索，不覆盖','未取得正文/非官方线索/身份或地区冲突/字段缺失；原记录保留')
  add(id,name,{},ev,'本轮回填仍有待核事项，未以缺失值或辅助线索覆盖原记录。')

birthdoc=(r.parent/'第一人回填-出生年与冲突复核.md').read_text(encoding='utf-8')
birthvalues={'P0173':'1905','P0343':'1898','P0344':'1888','P0345':'1918','P0356':'1905','P0379':'1886-02-24'}
for section in re.split(r'(?=### \d+\.)',birthdoc):
 m=re.match(r'### \d+\. (P\d+) ([^\n\r]+)',section)
 if not m:continue
 id,name=m.groups();name=name.strip();entry(id,name);documents.append(dict(id=id,name=name,file='第一人回填-出生年与冲突复核.md',text=section))
 ev=dict(file='第一人回填-出生年与冲突复核.md',section=m.group(0),urls=re.findall(r'https?://[^\s]+',section),status='回填人记载；待独立复核')
 if id in birthvalues:
  fields={'birthText':birthvalues[id]}
  if id=='P0379':fields.update(statEligible=False,scopeNote='1914年就义，早于1919—1949研究区间；保留研究记录，不纳入地图人数',birthplace='印度尼西亚雅加达',ancestryText='广东蕉岭（祖籍）',provinceCode='',provinceName='区间外记录',originText='未确认本人籍贯；广东为祖籍，台湾为活动地')
  add(id,name,fields,ev,'出生日期按回填来源精度补充，待独立复核；未载月份不补月份。');log(id,name,'出生年复核','补充出生日期，待复核',birthvalues[id])
 elif '仍有冲突' in section or id=='P0340':
  value=re.search(r'- (?:现有主值与另载|出生日期)：([^\r\n]+)',section)
  note='出生日期存在另载，保留原值，尚未定论。'+(value.group(1) if value else '')
  add(id,name,{'birthConflict':True},ev,note);log(id,name,'出生年复核','保留冲突，不定单值',note)
 else:log(id,name,'出生年复核','未找到，不覆盖','缺失结果不擦除已有值')

# 完整材料留在审核目录；前端仅带紧凑的字段、说明和证据入口，控制微信主包体积。
dump(out/'逐条处理.json',audit);dump(out/'来源与回填原文.json',documents);dump(out/'字段更新完整记录.json',list(patches.values()))
compact=[]
for p in patches.values():
 evs=p['evidence']; urls=[]
 for e in evs:
  for u in ([e.get('url','')] if 'url' in e else e.get('urls',[])):
   # 一格内多个原始地址拆开，不把组合文本误当成一个网址。
   for url in re.findall(r'https?://[^\s、，；。]+',u):
    url=url.rstrip('。；，)）');
    if url not in urls:urls.append(url)
 item=dict(id=p['id'],name=p['name'],fields=p['fields'])
 item['notes']=p['notes']
 item['sources']=[dict(file=e['file'],url=urls[0] if urls else '') for e in evs[:1]]
 # 优先使用直接支持新增出生日期的来源，避免用同人物其他字段的网址充当证据。
 if p['fields'].get('birthText'):
  e=next(e for e in evs if e['file']=='第一人回填-出生年与冲突复核.md');u=e['urls'][0]
  item['birthSourceUrl']=u
 item['sourceUrls']=urls[:3]
 compact.append(item)
dump(data/'本轮人物补充.json',compact)
print('原始任务处理',len(audit),'条；涉及',len(patches),'个去重人物；字段更新',sum(bool(p['fields']) for p in patches.values()),'人')
