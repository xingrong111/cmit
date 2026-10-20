from pathlib import Path
import shutil,json,re
root=Path(__file__).resolve().parents[1]
out=root/'微信开发者工具导入包'
deployment=json.loads((root/'部署配置.json').read_text(encoding='utf-8-sig'));api_origin=deployment['apiOrigin'].rstrip('/')
assert api_origin.startswith(('http://','https://'))

shutil.copytree(root/'frontend/dist/build/mp-weixin',out,dirs_exist_ok=True)
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
for page in (learning/'pages').glob('*/*.js'):
 target=out/'pages'/page.parent.name/page.name
 target.write_text(target.read_text(encoding='utf-8').replace('../../utils/api.js','../../utils/learning-api.js'),encoding='utf-8')
for p in (learning/'pages').glob('*/*.json'):
 target=out/'pages'/p.parent.name/p.name
 data=json.loads(target.read_text(encoding='utf-8'));data['usingComponents']={};target.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
p=out/'pages/learning/index.js';p.write_text("Page({onLoad(o){const group=/^(QQB|LYS|SZZ|LDY|JZY)$/.test(o.group||'')?o.group:'';wx.redirectTo({url:'/pages/learn/learn'+(group?'?group='+group:'')})}});",encoding='utf-8')
p=out/'app.json';data=json.loads(p.read_text(encoding='utf-8'))
for page in ['learn','quiz','result','honors','other']:
 route='pages/'+page+'/'+page
 if route not in data['pages']:data['pages'].append(route)
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
p=out/'app.wxss';p.write_text(p.read_text(encoding='utf-8')+'\n'+re.sub(r'(^|})([^{}]+)\{',lambda m:m.group(1)+','.join('.learning-page' if t.strip() in ['page','.page'] else '.learning-page '+t.strip() for t in m.group(2).split(','))+'{',(learning/'app.wxss').read_text(encoding='utf-8')),encoding='utf-8')

for name in ['learning-api.js']:
 p=out/'utils'/name;s=p.read_text(encoding='utf-8').replace('http://127.0.0.1:3110',api_origin);p.write_text(s,encoding='utf-8')
p=out/'project.config.json';project=json.loads(p.read_text(encoding='utf-8-sig'));project['appid']=deployment['miniAppId'];project['projectname']=deployment['brandName'];p.write_text(json.dumps(project,ensure_ascii=False,indent=2),encoding='utf-8')

shutil.copyfile(account/'utils/账户存储.js',out/'utils/账户存储.js')
for p in (out/'pages').rglob('*.js'):
 s=p.read_text(encoding='utf-8')
 for key in ['yingji-route-v1','yingji-stay-v1','yingji-budget-v1']:
  for fn in ['getStorageSync','setStorageSync','removeStorageSync']:
   s=s.replace("wx."+fn+"('"+key+"'", "wx."+fn+"(require('../../utils/账户存储').key('"+key+"')")
 p.write_text(s,encoding='utf-8')

p=out/'app.js';s=p.read_text(encoding='utf-8').replace("wx.getStorageSync('yingji-route-v1')","wx.getStorageSync(require('./utils/账户存储').key('yingji-route-v1'))");p.write_text(s,encoding='utf-8')
