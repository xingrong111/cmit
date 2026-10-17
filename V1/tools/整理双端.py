from pathlib import Path
import shutil,json
r=Path(__file__).resolve().parents[1]
web=r/'网页端';mini=r/'小程序端'
for p in [web,mini]:p.mkdir(exist_ok=True)
ignore=shutil.ignore_patterns('node_modules','dist','.env','.env.*','*.log')
for dest in [web/'源码',mini/'源码']:
 shutil.copytree(r/'frontend',dest,dirs_exist_ok=True,ignore=ignore)
shutil.copytree(r/'frontend/dist/build/h5',web/'页面',dirs_exist_ok=True)
shutil.copytree(r/'微信开发者工具导入包',mini/'微信开发者工具导入包',dirs_exist_ok=True)
# The embedded web UI sources are delivered separately; backend/data stay shared.
for name,src in [('账户评论',r/'services/account/public'),('小迹与足迹',r/'services/guide/web'),('导览公共页面',r/'services/guide/preview'),('学习挑战',r/'services/学习/public')]:
 shutil.copytree(src,web/'模块页面'/name,dirs_exist_ok=True)
for name,src in [('账户评论',r/'services/account/微信小程序版'),('小迹与足迹',r/'services/guide/miniprogram'),('学习挑战',r/'services/学习/miniprogram')]:
 shutil.copytree(src,mini/'模块源码'/name,dirs_exist_ok=True,ignore=ignore)
(web/'启动网页.mjs').write_text("import '../启动服务.mjs';\n",encoding='utf-8')
(web/'使用说明.md').write_text("# 网页端\n\n已合并全国地图与名单、人物阅读、账户评论审核、小迹与足迹、学习挑战。页面为最新H5构建；源码为uni-app工程；模块页面为嵌入模块源码。\n\n在V1运行Node.js 24的启动服务.mjs，或在本目录运行node 启动网页.mjs。访问 http://127.0.0.1:3110/ 。不能直接双击页面/index.html代替服务启动。请勿重复启动已占用3110—3114的服务。\n\n后端与数据共用V1/services，私有配置不复制到前端。构建仍在V1/frontend进行，随后运行tools/组装小程序.py和tools/整理双端.py更新交付目录。\n",encoding='utf-8')
(mini/'使用说明.md').write_text("# 小程序端\n\n导入本目录的微信开发者工具导入包，里面包含合并后的27个页面和五项底栏。源码为uni-app原始工程；模块源码保存账户、导览及学习原生源码。不要分别导入模块源码作为最终成品。\n\n后端与数据共用V1/services。本机工具预览先启动V1/启动服务.mjs，API使用3110。真机须配置手机可达的HTTPS域名、AppID和合法域名，并更新阅读、账户、导览与学习API地址。\n\n框架App配置已统一；原独立App文件仅在模块源码中作开发参考，不能复制覆盖最终App。微信真机运行尚未验收。\n",encoding='utf-8')
app=json.loads((mini/'微信开发者工具导入包/app.json').read_text(encoding='utf-8-sig'))
assert len(app['tabBar']['list'])==5
for route in app['pages']:
 for ext in ['.js','.json','.wxml']:assert (mini/'微信开发者工具导入包'/(route+ext)).is_file()
assert (web/'页面/index.html').is_file()
for folder in [web,mini]:
 assert not list(folder.rglob('.env'))
(r/'docs/双端整理检查.json').write_text(json.dumps({'web':True,'mini':True,'fiveModules':True,'pages':len(app['pages']),'tabs':5,'privateEnvCopied':False,'deviceTest':False},ensure_ascii=False,indent=2),encoding='utf-8')
print('双端目录整理与检查通过')
for dest in [web/'视觉规范',mini/'视觉规范']:shutil.copytree(r/'视觉规范',dest,dirs_exist_ok=True)

from 交付文件 import finish_manifest
# Expected paths come from canonical sources, not from destination remnants.
expected=[]
def collect(src,dst):
 for p in src.rglob('*'):
  if not p.is_file():continue
  rel=p.relative_to(src)
  if any(x in ['node_modules','dist','__pycache__'] for x in rel.parts) or p.name.startswith('.env') or p.suffix=='.log':continue
  expected.append(dst/rel)
for d in [web/'源码',mini/'源码']:collect(r/'frontend',d)
collect(r/'frontend/dist/build/h5',web/'页面');collect(r/'微信开发者工具导入包',mini/'微信开发者工具导入包')
for name,src in [('账户评论',r/'services/account/public'),('小迹与足迹',r/'services/guide/web'),('导览公共页面',r/'services/guide/preview'),('学习挑战',r/'services/学习/public')]:collect(src,web/'模块页面'/name)
for name,src in [('账户评论',r/'services/account/微信小程序版'),('小迹与足迹',r/'services/guide/miniprogram'),('学习挑战',r/'services/学习/miniprogram')]:collect(src,mini/'模块源码'/name)
for dest in [web/'视觉规范',mini/'视觉规范']:collect(r/'视觉规范',dest)
expected += [web/'启动网页.mjs',web/'使用说明.md',mini/'使用说明.md']
finish_manifest(r,expected,r/'docs/双端文件清单.json')
