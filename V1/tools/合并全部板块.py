"""将第一部分移植到统一前端，并同步所有模块的公共视觉。可重复运行。"""
from pathlib import Path
import json,shutil,datetime
r=Path(__file__).resolve().parents[1]
source=r.parent/'output/第一部分修复版/地图与人物检索/src/data'
frontend=r/'frontend/src';data=frontend/'data'
backup=r/'docs/合并前备份'
def read(p):return p.read_text(encoding='utf-8-sig')
def update(p,transform):
 old=read(p);new=transform(old)
 if old!=new:
  dest=backup/p.relative_to(r);dest.parent.mkdir(parents=True,exist_ok=True)
  if not dest.exists():dest.write_text(old,encoding='utf-8')
  p.write_text(new,encoding='utf-8')
for a,b in [('研究人物.json','全国收录.json'),('省份目录.json','省份目录.json'),('chinaProvinces.json','中国省界.json')]:
 d=json.loads(read(source/a));(data/b).write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
# No review status or historical facts are changed by the merge.
geometry=json.loads(read(data/'中国省界.json'))
def encode_ring(ring):
 previous=[0,0];out=[]
 for point in ring:
  for axis in [0,1]:
   integer=round(point[axis]*1000000)
   assert abs(integer/1000000-point[axis])<1e-9
   delta=integer-previous[axis];previous[axis]=integer
   value=delta*2 if delta>=0 else -delta*2-1
   while value>=32:out.append(chr((value&31)+32+63));value>>=5
   out.append(chr(value+63))
 return ''.join(out)
packed={'factor':1000000,'features':[]}
for f in geometry['features']:
 polygons=[f['geometry']['coordinates']] if f['geometry']['type']=='Polygon' else f['geometry']['coordinates']
 packed['features'].append({'code':str(f['properties']['区划码']),'polygons':[[encode_ring(ring) for ring in polygon] for polygon in polygons]})
(data/'省界编码.json').write_text(json.dumps(packed,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
records=json.loads(read(data/'全国收录.json'))
assert len(records)==119 and len({x['id'] for x in records})==119
assert all(x['reviewStatus']=='pending' for x in records)
reading=json.loads(read(r/'services/reading/data/content.json'))['people']
links=[{'registryId':'P0046','readingId':'P007','name':'恽代英'}]
for link in links:
 entry=next((x for x in records if x['id']==link['registryId']),None)
 target=next((x for x in reading if x['id']==link['readingId']),None)
 assert entry and target and entry['name']==target['name']==link['name']
 entry['readingId']=link['readingId']
(data/'全国收录.json').write_text(json.dumps(records,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(r/'docs/全国名单档案关联.json').write_text(json.dumps(links,ensure_ascii=False,indent=2),encoding='utf-8')
update(frontend/'pages.json',lambda s:json.dumps((lambda d:{**d,'pages':[dict(p,style={**p.get('style',{}),'navigationBarTitleText':'山河有迹' if p['path']=='pages/home/index' else p.get('style',{}).get('navigationBarTitleText','山河有迹')}) for p in d['pages'] if p['path'] not in ['pages/province/index','pages/registry/index','pages/statistics/index']]+[{'path':'pages/'+p+'/index','style':{'navigationBarTitleText':t}} for p,t in [('province','分省人物名单'),('registry','人物资料条目'),('statistics','收录说明')]],'globalStyle':{**d['globalStyle'],'navigationBarTitleText':'山河有迹'}})(json.loads(s)),ensure_ascii=False,indent=2))
update(frontend/'App.vue',lambda s:s if "合并视觉.css" in s else s.replace("@import './styles/theme.css';","@import './styles/theme.css';\n@import './styles/合并视觉.css';"))
def home(s):
 s=s.replace('<AppShell><StatePanel','<AppShell><NationalMap/><StatePanel') if '<NationalMap/>' not in s else s
 s=s.replace("import {ref} from 'vue';","import {ref} from 'vue';import NationalMap from '../../components/山河地图.vue';") if 'import NationalMap' not in s else s
 s=s.replace('英迹 · 山河英雄谱','山河有迹 · 深度人物专题').replace('位收录人物','位深度档案人物').replace("英迹 · 循迹读人，见史山河","山河有迹 · 循迹读人，见史山河")
 s=s.replace("{name:'文创',icon:'book',caption:'待接入'},",'')
 return s
update(frontend/'pages/home/index.vue',home)
def people(s):
 if 'registry-entry' not in s:s=s.replace('<view class="filter-panel">','<view class="registry-entry"><view><text class="serif">全国逐步收录，典型人物深入展示</text><text class="small">此处为深度人物档案；全国资料名单可按省份检索。</text></view><button class="outline" @tap="go(\'province\')">全国名单 ↗</button></view><view class="filter-panel">',1)
 if "from '../../lib/navigation.js'" not in s:s=s.replace("import {api} from '../../lib/api.js'","import {api} from '../../lib/api.js';import {go} from '../../lib/navigation.js'")
 return s.replace('英迹 · 人物索引','山河有迹 · 人物索引')
update(frontend/'pages/people/index.vue',people)
# A single set of desktop navigation entries complements the fixed five mobile tabs.
p=frontend/'components/AppShell.vue'
s=read(p)
a=s.index('<view class="desktop-nav">');b=s.index('</view>',a)+len('</view>')
s=s[:a]+'''<view class="desktop-nav"><button v-for="item in links" :key="item.page" :class="{'nav-current':active===item.page}" @tap="go(item.page)">{{item.title}}</button></view>'''+s[b:]
a=s.index('<script setup>');b=s.index('</script>',a)+len('</script>')
s=s[:a]+'''<script setup>
import {ref} from 'vue';import {onShow} from '@dcloudio/uni-app';import {go} from '../lib/navigation.js'
const active=ref(''),links=[{page:'home',title:'首页'},{page:'people',title:'人物'},{page:'timeline',title:'长卷'},{page:'radar',title:'足迹'},{page:'assistant',title:'小迹'},{page:'learning',title:'学习'},{page:'me',title:'我的'}]
onShow(()=>{active.value=getCurrentPages().slice(-1)[0]?.route?.split('/')[1]||''})
</script>'''+s[b:]
update(p,lambda _:s)
css=read(r/'视觉规范/网页公共样式.css')
for directory,url in [('services/account/public','/modules/account/统一视觉.css'),('services/学习/public','/modules/learning/统一视觉.css'),('services/guide/web','/web/统一视觉.css'),('services/guide/preview','/preview/统一视觉.css')]:
 d=r/directory;(d/'统一视觉.css').write_text(css,encoding='utf-8')
 for p in d.glob('*.html'):
  update(p,lambda s:s if '统一视觉.css' in s else s.replace('</head>',f'<link rel="stylesheet" href="{url}"></head>'))
update(r/'services/account/public/index.html',lambda s:s.replace('<title>英迹·山河有迹</title>','<title>山河有迹 · 账户与讨论</title>'))
# Native modules inherit the same stylesheet after their original global rules.
update(r/'tools/组装小程序.py',lambda s:s if '小程序公共样式.wxss' in s else s+"\np=out/'app.wxss';p.write_text(p.read_text(encoding='utf-8')+'\\n'+(root/'视觉规范/小程序公共样式.wxss').read_text(encoding='utf-8'),encoding='utf-8')\n")
def dual(s):
 s=s.replace('已合并人物阅读、账户评论审核、小迹与足迹、学习挑战','已合并全国地图与名单、人物阅读、账户评论审核、小迹与足迹、学习挑战')
 s=s.replace('合并后的24个页面','合并后的27个页面').replace("'fourModules':True","'fiveModules':True")
 s=s.replace("print('双端目录整理与检查通过')","print('双端目录整理与检查通过')\nfor dest in [web/'视觉规范',mini/'视觉规范']:shutil.copytree(r/'视觉规范',dest,dirs_exist_ok=True)")
 s=s.replace("expected += [web/'启动网页.mjs'","for dest in [web/'视觉规范',mini/'视觉规范']:collect(r/'视觉规范',dest)\nexpected += [web/'启动网页.mjs'")
 return s
update(r/'tools/整理双端.py',lambda s:s if "web/'视觉规范'" in s else dual(s))
update(r/'统一服务.mjs',lambda s:s.replace("'.png':'image/png'","'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'").replace("console.log('英迹 V1 ","console.log('山河有迹 V1 "))
report={'date':datetime.date.today().isoformat(),'modules':['全国地图与名单','人物档案与长卷','账户评论审核','小迹导览与历史足迹','学习挑战'],'researchRecords':len(records),'approvedByThisMerge':0,'originalDataReviewStatusUnchanged':True,'tabs':5,'webAndMiniSeparated':True,'deviceTest':False}
(r/'docs/本次合并范围.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
