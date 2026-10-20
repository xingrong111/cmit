from pathlib import Path
p=Path('V1/tools/组装小程序.py');s=p.read_text(encoding='utf-8')
if '# 全局字号同步原生模块' not in s:
 s+='''
# 全局字号同步原生模块；账户隔离与阅读偏好保持同一键名。
p=out/'app.js';s=p.read_text(encoding='utf-8');prefix="""const __fontOriginalPage=Page;Page=function(options){const show=options.onShow;options.onShow=function(){try{const pref=wx.getStorageSync(require('./utils/账户存储').key('yingji:prefs'));this.setData({__globalLarge:pref&&pref.size==='large'});}catch(e){}if(show)return show.apply(this,arguments);};return __fontOriginalPage(options);};\\n""";p.write_text(prefix+s,encoding='utf-8')
for p in (out/'pages').glob('*/*.js'):
 if 'Page({' not in p.read_text(encoding='utf-8'):continue
 w=p.with_suffix('.wxml')
 if w.exists():w.write_text('<view class="{{__globalLarge ? \\'global-large\\' : \\'\\'}}">'+w.read_text(encoding='utf-8')+'</view>',encoding='utf-8')
p=out/'统一视觉.wxss';p.write_text(p.read_text(encoding='utf-8')+'\\n'+(root/'视觉规范/全局字号.wxss').read_text(encoding='utf-8'),encoding='utf-8')
'''
 p.write_text(s,encoding='utf-8')
