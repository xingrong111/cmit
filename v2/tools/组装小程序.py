from pathlib import Path
import shutil,json,re
root=Path(__file__).resolve().parents[1]
out=root/'微信开发者工具导入包'
deployment=json.loads((root/'部署配置.json').read_text(encoding='utf-8-sig'));api_origin=deployment['apiOrigin'].rstrip('/')
assert api_origin.startswith(('http://','https://'))

shutil.copytree(root/'frontend/dist/build/mp-weixin',out,dirs_exist_ok=True)
# 网页专用全屏背景不进入微信主包。
for base in [out,root/'frontend/dist/build/mp-weixin']:
 for name in ['赤脉山河.png','山河卷首.webp','v2-视觉.css','appearance.js','b-theme.css','人物照片/江竹筠-川大档案.png']:
  f=base/'static'/name
  if f.exists():f.unlink()
# 旧版本遗留的研究目录不再被当前代码引用，避免复制合并后滞留于主包。
obsolete=out/'研究目录.js'
if obsolete.exists() and not (root/'frontend/dist/build/mp-weixin/研究目录.js').exists():
 refs=[p for p in out.rglob('*.js') if p!=obsolete and '研究目录' in p.read_text(encoding='utf-8')]
 if not refs:
  obsolete.unlink()
  mirror=root/'小程序端/微信开发者工具导入包/研究目录.js'
  if mirror.exists():mirror.unlink()
for f in out.rglob('*.wxss'):
 text=f.read_text(encoding='utf-8').replace('/static/山河卷首.webp','/static/青绿山水.jpg')
 f.write_text(text,encoding='utf-8')
from PIL import Image
for name in ['江竹筠.jpg','狼牙山-葛振林宋学义.jpg']:
 f=out/'static/人物照片'/name
 if f.exists():
  im=Image.open(f).convert('RGB');im.thumbnail((480,640));im.save(f,quality=83,optimize=True)
guide=root/'services/guide/miniprogram';account=root/'services/account/微信小程序版'
for name in ['pages','utils','assets','components']:
 if (guide/name).exists():shutil.copytree(guide/name,out/name,dirs_exist_ok=True)
for p in (out/'pages').glob('*/index.wxml'):
 s=p.read_text(encoding='utf-8');s=re.sub(r'<module-shell[^>]*/>','',s);s=s.replace('<module-shell active="assistant" hide-nav="{{keyboardHeight > 0}}"/>','').replace('<module-shell active="radar"/>','').replace('<module-shell active="route"/>','').replace('<module-shell active="place"/>','');p.write_text(s,encoding='utf-8')
shutil.copytree(account/'pages',out/'pages',dirs_exist_ok=True)
shutil.copyfile(account/'utils/api.js',out/'utils/account-api.js')
for p in (out/'pages').glob('*/index.js'):
 if p.parent.name in ['account','admin','discussion','my-comments']:
  s=p.read_text(encoding='utf-8').replace('../../utils/api','../../utils/account-api');p.write_text(s,encoding='utf-8')
(out/'config.js').write_text("module.exports={apiBase:'"+api_origin+"/api/guide',teamPages:{person:'/pages/person/index',event:'/pages/event/index'}};",encoding='utf-8')
p=out/'utils/api.js';s=p.read_text(encoding='utf-8').replace('config.apiBase + path','config.apiBase + path.replace(/^\/api/,\'\')').replace("config.apiBase.replace(/\/$/,'')+path","config.apiBase.replace(/\/api\/guide$/,'')+path")
a=s.index('function team(');b=s.index('function assetURL',a)
mapping=json.loads((root/'docs/导览与人物映射.json').read_text(encoding='utf-8'))
s=s[:a]+"function team(type,id){const map="+json.dumps(mapping,ensure_ascii=False)+";const target=type==='person'?map[id]:id;if(!target)return wx.showToast({title:'该人物暂无阅读档案',icon:'none'});wx.navigateTo({url:config.teamPages[type]+'?id='+encodeURIComponent(target)}); }\n"+s[b:];p.write_text(s,encoding='utf-8')
p=out/'utils/account-api.js';s=p.read_text(encoding='utf-8').replace("getApp().globalData.apiBase.replace(/\/$/, '')","'"+api_origin+"/api/account'");p.write_text(s,encoding='utf-8')
# The compiled reading App remains the single App; augment it before registration.
shutil.copyfile(out/'app.js',out/'reading-app.js')
(out/'app.js').write_text("const originalApp=App;App=function(options){options.globalData={...(options.globalData||{}),position:null,routeIds:[],privacyResolve:null};const launch=options.onLaunch;options.onLaunch=function(o){try{const ids=wx.getStorageSync('yingji-route-v1');if(Array.isArray(ids))this.globalData.routeIds=ids;}catch{}if(wx.onNeedPrivacyAuthorization)wx.onNeedPrivacyAuthorization(resolve=>{this.globalData.privacyResolve=resolve;wx.navigateTo({url:'/pages/privacy/index',fail:()=>resolve({event:'disagree'})});});if(launch)launch.call(this,o);};return originalApp(options);};require('./reading-app.js');App=originalApp;",encoding='utf-8')
p=out/'app.wxss';p.write_text(p.read_text(encoding='utf-8')+'\n'+(guide/'app.wxss').read_text(encoding='utf-8')+'\n'+(account/'app.wxss').read_text(encoding='utf-8'),encoding='utf-8')
shutil.copyfile(guide/'sitemap.json',out/'sitemap.json')
p=out/'app.json';d=json.loads(p.read_text(encoding='utf-8'));g=json.loads((guide/'app.json').read_text(encoding='utf-8'));d['permission']=g['permission'];d['requiredPrivateInfos']=g['requiredPrivateInfos'];d['sitemapLocation']='sitemap.json';p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
print('Native assembled:',out)

learning=root/'services/学习/miniprogram'
shutil.copytree(learning/'pages',out/'pages',dirs_exist_ok=True)
shutil.copyfile(learning/'utils/api.js',out/'utils/learning-api.js')
shutil.copyfile(learning/'utils/人物卡片素材.json',out/'utils/人物卡片素材.json')
shutil.copyfile(learning/'utils/称号徽章.json',out/'utils/称号徽章.json')
for page in (learning/'pages').glob('*/*.js'):
 target=out/'pages'/page.parent.name/page.name
 target.write_text(target.read_text(encoding='utf-8').replace('../../utils/api.js','../../utils/learning-api.js'),encoding='utf-8')
for p in (learning/'pages').glob('*/*.json'):
 target=out/'pages'/p.parent.name/p.name
 data=json.loads(target.read_text(encoding='utf-8'));data['usingComponents']={};target.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
p=out/'pages/learning/index.js';p.write_text("Page({onLoad(o){const group=/^(QQB|LYS|SZZ|LDY|JZY)$/.test(o.group||'')?o.group:'';wx.redirectTo({url:'/pages/learn/learn'+(group?'?group='+group:'')})}});",encoding='utf-8')
p=out/'app.json';data=json.loads(p.read_text(encoding='utf-8'))
for page in ['learn','quiz','result','honors','reward','other']:
 route='pages/'+page+'/'+page
 if route not in data['pages']:data['pages'].append(route)
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
p=out/'app.wxss';p.write_text(p.read_text(encoding='utf-8')+'\n'+re.sub(r'(^|})([^{}]+)\{',lambda m:m.group(1)+','.join('.learning-page' if t.strip() in ['page','.page'] else '.learning-page '+t.strip() for t in m.group(2).split(','))+'{',(learning/'app.wxss').read_text(encoding='utf-8')),encoding='utf-8')

for name in ['learning-api.js']:
 p=out/'utils'/name;s=p.read_text(encoding='utf-8').replace('http://127.0.0.1:3110',api_origin);p.write_text(s,encoding='utf-8')

# 文创馆沿用网页端的真实目录和领取服务；页面在主小程序中使用现有账户令牌。
wenchuang=root/'services/wenchuang/miniprogram'
shutil.copytree(wenchuang/'pages/wenchuang',out/'pages/wenchuang',dirs_exist_ok=True)
shutil.copyfile(wenchuang/'utils/api.js',out/'utils/wenchuang-api.js')
shutil.copyfile(wenchuang/'utils/meta.js',out/'utils/wenchuang-meta.js')
for p in (out/'pages/wenchuang').glob('*.js'):
 s=p.read_text(encoding='utf-8').replace("../../utils/api.js","../../utils/wenchuang-api.js").replace("../../utils/meta.js","../../utils/wenchuang-meta.js")
 p.write_text(s,encoding='utf-8')
for p in (out/'pages/wenchuang').glob('*.wxml'):
 pass
for name in ['index','detail','collection','success']:
 shutil.copyfile(wenchuang/'wenchuang.wxss',out/'pages/wenchuang'/(name+'.wxss'))
p=out/'utils/wenchuang-api.js';p.write_text(p.read_text(encoding='utf-8').replace('http://127.0.0.1:3210',api_origin),encoding='utf-8')
p=out/'utils/wenchuang-meta.js';p.write_text(p.read_text(encoding='utf-8').replace('http://127.0.0.1:3210',api_origin),encoding='utf-8')
p=out/'app.json';data=json.loads(p.read_text(encoding='utf-8'))
for name in ['detail','collection','success']:
 route='pages/wenchuang/'+name
 if route not in data['pages']:data['pages'].append(route)
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
p=out/'project.config.json';project=json.loads(p.read_text(encoding='utf-8-sig'));project['appid']=deployment['miniAppId'];project['projectname']=deployment['brandName'];p.write_text(json.dumps(project,ensure_ascii=False,indent=2),encoding='utf-8')

shutil.copyfile(account/'utils/账户存储.js',out/'utils/账户存储.js')
for p in (out/'pages').rglob('*.js'):
 s=p.read_text(encoding='utf-8')
 for key in ['yingji-route-v1','yingji-stay-v1','yingji-budget-v1']:
  for fn in ['getStorageSync','setStorageSync','removeStorageSync']:
   s=s.replace("wx."+fn+"('"+key+"'", "wx."+fn+"(require('../../utils/账户存储').key('"+key+"')")
 p.write_text(s,encoding='utf-8')

p=out/'app.js';s=p.read_text(encoding='utf-8').replace("wx.getStorageSync('yingji-route-v1')","wx.getStorageSync(require('./utils/账户存储').key('yingji-route-v1'))");p.write_text(s,encoding='utf-8')

p=out/'app.wxss';p.write_text(p.read_text(encoding='utf-8')+'\n'+(root/'视觉规范/小程序公共样式.wxss').read_text(encoding='utf-8'),encoding='utf-8')

# Page styles load after app.wxss; apply the same tokens to native member pages last.
shutil.copyfile(root/'视觉规范/小程序公共样式.wxss',out/'统一视觉.wxss')
for p in (out/'pages').glob('*/*.wxss'):
 s=p.read_text(encoding='utf-8')
 if '../../统一视觉.wxss' not in s:p.write_text(s+'\n@import "../../统一视觉.wxss";\n',encoding='utf-8')

# 原生模块覆盖页补充显式返回；直接进入详情时回到所属模块。
for p in (out/'pages').glob('*/*.js'):
 s=p.read_text(encoding='utf-8')
 w=p.with_suffix('.wxml')
 if 'Page({' not in s or not w.exists() or '__returnPrevious' in s:continue
 name=p.parent.name
 if name in ['assistant','radar','me','home','people']:continue
 fallback='me' if name in ['account','admin','my-comments','privacy'] else 'radar' if name in ['place','route','source'] else 'people'
 handler="__returnPrevious(){const fallback=()=>wx.switchTab({url:'/pages/"+fallback+"/index'});if(getCurrentPages().length>1)wx.navigateBack({delta:1,fail:fallback});else fallback();},"
 p.write_text(s.replace('Page({','Page({'+handler,1),encoding='utf-8')
 w.write_text('<view class="explicit-return"><button bindtap="__returnPrevious">‹ 返回上一页</button></view>\n'+w.read_text(encoding='utf-8'),encoding='utf-8')
p=out/'app.wxss';p.write_text(p.read_text(encoding='utf-8')+'\n.explicit-return{padding:18rpx 28rpx;background:#fbf5e9}.explicit-return button{margin:0;width:230rpx;font-size:25rpx;line-height:2.5;color:#982b28;background:#f4ebda;border-radius:14rpx}.explicit-return button::after{border:0}\n',encoding='utf-8')

# 全局字号同步原生模块；账户隔离与阅读偏好保持同一键名。
p=out/'app.js';s=p.read_text(encoding='utf-8');prefix="""const __fontOriginalPage=Page;Page=function(options){const show=options.onShow;options.onShow=function(){try{const pref=wx.getStorageSync(require('./utils/账户存储').key('yingji:prefs'));this.setData({__globalLarge:pref&&pref.size==='large'});}catch(e){}if(show)return show.apply(this,arguments);};return __fontOriginalPage(options);};\n""";p.write_text(prefix+s,encoding='utf-8')
for p in (out/'pages').glob('*/*.js'):
 if 'Page({' not in p.read_text(encoding='utf-8'):continue
 w=p.with_suffix('.wxml')
 if w.exists():w.write_text('<view class="{{__globalLarge ? \'global-large\' : \'\'}}">'+w.read_text(encoding='utf-8')+'</view>',encoding='utf-8')
p=out/'统一视觉.wxss';p.write_text(p.read_text(encoding='utf-8')+'\n'+(root/'视觉规范/全局字号.wxss').read_text(encoding='utf-8'),encoding='utf-8')

# 仅压缩生成包内的徽章副本，保持用户新提供的高清源图。
import subprocess,sys
subprocess.run([sys.executable,str(root/"tools/压缩小程序徽章.py"),str(out)],check=True)
