from pathlib import Path
import shutil,json
root=Path('V1')
for name in ['第一幕.html','第一幕动态版.html']:
 p=root/'江姐VR示例'/name;s=p.read_text(encoding='utf-8')
 if 'scene-return' not in s:
  s=s.replace('<header>','<header><button class="scene-return" style="font-size:13px;padding:8px 12px" onclick="try{if(document.referrer &amp;&amp; new URL(document.referrer).origin===location.origin &amp;&amp; history.length>1){history.back()}else{location.href=\'/#/pages/person/index?id=P004\'}}catch(e){location.href=\'/#/pages/person/index?id=P004\'}">‹ 返回上一页</button>',1)
  p.write_text(s,encoding='utf-8')
 for dest in [root/'frontend/dist/build/h5/panorama/jiang',root/'网页端/页面/panorama/jiang']:
  if dest.exists():shutil.copy2(p,dest/name)
# 记录路由覆盖与原生返回控件，供交付复查。
pages=json.loads((root/'frontend/src/pages.json').read_text(encoding='utf-8'))['pages']
lines=['# 页面返回与场馆卡片检查','', '本轮已重新构建网页与微信导入包。未进行微信真机测试。','', '## 返回规则','', '普通页面通过公共页头提供返回上一页；无上一页时回到所属列表。首页为根入口，不显示返回。人物目录使用同一公共页头。地点详情另有模块内返回，恢复进入前的足迹或路线。原生覆盖页补充显式返回，并保留微信导航栏。全景独立页面补充返回及人物档案兜底。','', '|页面|返回方式|','|---|---|']
for item in pages:
 route=item['path'];lines.append('|'+route+'|'+('根入口' if '/home/' in route else '微信导航栏；全景内返回' if '/panorama/' in route else '公共页头返回 / 原生覆盖页返回')+'|')
lines+=['','## 验证范围','','已通过桌面和手机尺寸雷达布局、列表切换、路线入口与地点详情返回检查。地图瓦片依赖腾讯服务与网络加载；未据此宣称所有地图请求均成功。其余页面通过统一组件覆盖和构建检查，登录、评论、答题等业务未在本轮逐项端到端回归。']
(root/'docs/场馆卡片与页面返回检查.md').write_text('\n'.join(lines),encoding='utf-8')
