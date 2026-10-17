from pathlib import Path
r=Path(__file__).resolve().parents[1]
css=(r/'视觉规范/网页公共样式.css').read_text(encoding='utf-8')
for folder in ['services/account/public','services/学习/public','services/guide/web','services/guide/preview']:(r/folder/'统一视觉.css').write_text(css,encoding='utf-8')
p=r/'services/学习/public/app.js';s=p.read_text(encoding='utf-8')
if 'learning-intro' not in s:s=s.replace("<p class=\"aux\">先答完入门关，再开始本组进阶关。","<p class=\"learning-intro\">先答完入门关，再开始本组进阶关。",1)
p.write_text(s,encoding='utf-8')
p=r/'services/学习/miniprogram/pages/learn/learn.wxml';s=p.read_text(encoding='utf-8')
s=s.replace('<view class="aux">先答完入门关','<view class="learning-topic">先答完入门关').replace('wx:if="{{focusName}}" class="card"','wx:if="{{focusName}}" class="card stage-card"')
p.write_text(s,encoding='utf-8')
p=r/'services/guide/miniprogram/pages/radar/index.js';s=p.read_text(encoding='utf-8')
if 'toggleList()' not in s:
 s=s.replace('data: {','data: {listExpanded:false,',1)
 s=s.replace('onLoad(',"toggleList(){this.setData({listExpanded:!this.data.listExpanded})},\n onLoad(",1)
p.write_text(s,encoding='utf-8')
p=r/'services/guide/miniprogram/pages/radar/index.wxml';s=p.read_text(encoding='utf-8')
if 'bindtap="toggleList"' not in s:
 needle='<view wx:for="{{items}}" wx:key="id" class="card '
 a=s.find(needle);b=s.find('<button class="primary gap" bindtap="route">',a)
 if a>=0 and b>a:s=s[:a]+'''<button wx:if="{{viewMode==='map' &amp;&amp; items.length}}" class="ghost gap" bindtap="toggleList" aria-expanded="{{listExpanded}}">{{listExpanded?'收起':'展开'}}地点列表（{{items.length}}）</button><view wx:if="{{viewMode==='list' || listExpanded}}">'''+s[a:b]+'</view>\n '+s[b:]
s=s.replace('英迹 · 山河有迹','山河有迹')
p.write_text(s,encoding='utf-8')
print('网页公共样式与小程序场馆列表已同步')
