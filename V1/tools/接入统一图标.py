from pathlib import Path
import re
import urllib.parse
r=Path(__file__).resolve().parents[1];src=r/'frontend/src'
icons=['home','people','pin','assistant','bookmark','book','timeline','graph','learning','medal','comment','account','route','museum','source','calendar','search','edit','copy']
# Shared Vue pages use PNG so that WeChat and the browser receive identical assets.
for p in src.rglob('*.vue'):
 s=p.read_text(encoding='utf-8')
 for name in icons:s=s.replace('/static/icons/'+name+'.svg','/static/icons/'+name+'.png')
 s=s.replace("m.icon+'.svg'","m.icon+'.png'")
 p.write_text(s,encoding='utf-8')
p=src/'pages/home/index.vue';s=p.read_text(encoding='utf-8').replace("name:'小迹',icon:'graph'","name:'小迹',icon:'assistant'").replace("name:'学习挑战',icon:'book'","name:'学习挑战',icon:'learning'").replace("name:'山河',icon:'home'","name:'山河',icon:'timeline'");p.write_text(s,encoding='utf-8')
p=src/'components/AppShell.vue';s=p.read_text(encoding='utf-8')
if 'class="desktop-nav-icon"' not in s:s=s.replace('{{item.title}}','<image class="desktop-nav-icon" :src="\'/static/icons/\'+item.icon+\'.png\'" aria-hidden="true"/>{{item.title}}')
for page,icon in {'home':'home','people':'people','timeline':'timeline','radar':'pin','assistant':'assistant','learning':'learning','me':'bookmark'}.items():s=s.replace("{page:'"+page+"',title:","{page:'"+page+"',icon:'"+icon+"',title:")
p.write_text(s,encoding='utf-8')
p=src/'pages/person/index.vue';s=p.read_text(encoding='utf-8')
for word,icon in {'长卷':'timeline','图谱':'graph','史料':'source','挑战':'learning'}.items():
 needle='<text>'+word+'</text>'
 if 'shortcut-'+icon not in s:s=s.replace(needle,'<image class="shortcut-icon shortcut-'+icon+'" src="/static/icons/'+icon+'.png" aria-hidden="true"/>'+needle,1)
p.write_text(s,encoding='utf-8')
p=src/'pages/me/index.vue';s=p.read_text(encoding='utf-8')
for word,icon in {'学':'learning','言':'comment','人':'account'}.items():s=s.replace('<text class="menu-symbol">'+word+'</text>','<image class="menu-feature-icon" src="/static/icons/'+icon+'.png" aria-hidden="true"/>')
p.write_text(s,encoding='utf-8')
# Guide: scene illustrations in shared browser UI and native WeChat view.
p=r/'services/guide/preview/app.js';s=p.read_text(encoding='utf-8')
for title,icon in {'使用指导':'assistant','史料问答':'source','文化探索':'route'}.items():
 needle='<strong>'+title+'</strong>'
 if 'src="/static/icons/'+icon+'.png"' not in s:s=s.replace(needle,'<img class="scene-icon" src="/static/icons/'+icon+'.png" alt=""/>'+needle,1)
if 'class="module-feature-icon"' not in s:s=s.replace('<h2>${title}</h2>','<h2><img class="module-feature-icon" src="/static/icons/${state.page===\'assistant\'?\'assistant\':state.page===\'route\'?\'route\':state.page===\'place\'?\'museum\':\'pin\'}.png" alt=""/>${title}</h2>',1)
p.write_text(s,encoding='utf-8')
p=r/'services/guide/miniprogram/pages/assistant/index.wxml';s=p.read_text(encoding='utf-8')
for title,icon in {'使用指导':'assistant','史料问答':'source','文化探索':'route'}.items():
 needle='<view class="scenario-title">'+title+'</view>'
 if 'scene-icon-'+icon not in s:s=s.replace(needle,'<image class="scene-icon scene-icon-'+icon+'" src="/static/icons/'+icon+'.png" aria-hidden="true"/>'+needle,1)
p.write_text(s,encoding='utf-8')
for page,title,icon in [('radar','历史足迹雷达','pin'),('route','文化路线','route')]:
 p=r/('services/guide/miniprogram/pages/'+page+'/index.wxml');s=p.read_text(encoding='utf-8');needle='<view class="title">'+title+'</view>'
 if 'module-feature-icon' not in s:s=s.replace(needle,'<view class="module-title-row"><image class="module-feature-icon" src="/static/icons/'+icon+'.png"/><view class="title">'+title+'</view></view>',1)
 p.write_text(s,encoding='utf-8')
# Learning: meaningful iconography replaces decorative single-character markers.
p=r/'services/学习/public/app.js';s=p.read_text(encoding='utf-8')
s=s.replace('${escape(group.name.slice(0, 1))}</span>','<img src="/static/icons/people.png" alt=""/></span>')
s=s.replace('${escape(row.name.slice(0, 1))}</span>','<img src="/static/icons/medal.png" alt=""/></span>')
if 'class="learning-title-icon"' not in s:s=s.replace('<h1>${title}</h1>','<h1><img class="learning-title-icon" src="/static/icons/${screen===\'honors\'?\'medal\':\'learning\'}.png" alt=""/>${title}</h1>',1)
p.write_text(s,encoding='utf-8')
p=r/'services/学习/miniprogram/pages/learn/learn.wxml';s=p.read_text(encoding='utf-8').replace('<view class="mark">{{item.mark}}</view>','<image class="learning-person-icon" src="/static/icons/people.png" aria-hidden="true"/>')
if 'learning-title-icon' not in s:s=s.replace('<view class="eyebrow">待核验</view>','<image class="learning-title-icon" src="/static/icons/learning.png" aria-hidden="true"/><view class="eyebrow">待核验</view>',1)
p.write_text(s,encoding='utf-8')
p=r/'services/account/public/app.js';s=p.read_text(encoding='utf-8')
if 'account-title-icon' not in s:s=s.replace('<h1>${title}</h1>','<h1><img class="account-title-icon" src="/static/icons/account.png" alt=""/>${title}</h1>',1)
p.write_text(s,encoding='utf-8')
p=r/'services/account/微信小程序版/pages/account/index.wxml';s=p.read_text(encoding='utf-8')
if 'account-title-icon' not in s:s=s.replace('<view class="hero">','<view class="hero"><image class="account-title-icon" src="/static/icons/account.png" aria-hidden="true"/>',1)
p.write_text(s,encoding='utf-8')
# Refresh compact copy/edit icons in both browser and native chat, keeping send/stop high contrast.
rules=[]
for name in ['copy','edit']:
 xml=(src/('static/icons/'+name+'.svg')).read_text(encoding='utf-8')
 rules.append('.chat-icon-'+name+'{background-image:url("data:image/svg+xml,'+urllib.parse.quote(xml,safe='')+'");background-size:contain;background-position:center;background-repeat:no-repeat}')
for css in [r/'services/guide/preview/style.css',r/'services/guide/miniprogram/app.wxss']:
 text=css.read_text(encoding='utf-8');marker='/* 山河有迹统一操作图标 */'
 if marker in text:text=text.split(marker)[0]
 css.write_text(text+'\n'+marker+'\n'+'\n'.join(rules)+'\n',encoding='utf-8')
print('已统一导航、阅读入口、账户、导览场景及学习图标；保留点击事件与原有路由。')
