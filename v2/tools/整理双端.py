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
import subprocess,sys
subprocess.run([sys.executable,str(r/"tools/压缩小程序徽章.py"),str(mini/"微信开发者工具导入包")],check=True)
# The embedded web UI sources are delivered separately; backend/data stay shared.
for name,src in [('账户评论',r/'services/account/public'),('小迹与足迹',r/'services/guide/web'),('导览公共页面',r/'services/guide/preview'),('学习挑战',r/'services/学习/public'),('数字文创',r/'services/wenchuang/public')]:
 shutil.copytree(src,web/'模块页面'/name,dirs_exist_ok=True)
for name,src in [('账户评论',r/'services/account/微信小程序版'),('小迹与足迹',r/'services/guide/miniprogram'),('学习挑战',r/'services/学习/miniprogram'),('数字文创',r/'services/wenchuang/miniprogram')]:
 shutil.copytree(src,mini/'模块源码'/name,dirs_exist_ok=True,ignore=ignore)
(web/'启动网页.mjs').write_text("import '../启动服务.mjs';\n",encoding='utf-8')
(web/'使用说明.md').write_text("# 网页端\n\n已合并人物、长卷、足迹、小迹、学习挑战及数字文创馆。文创包含六件作品、领取与收藏。\n\n在 v2 根目录运行 Node.js 24 的 启动服务.mjs，或在本目录运行 node 启动网页.mjs。访问 http://127.0.0.1:3210/ 。文创领取服务使用 3215 端口。\n\n后端与数据共用 v2/services，私有配置不复制到前端。\n",encoding='utf-8')
(mini/'使用说明.md').write_text("# 小程序端\n\n导入本目录的微信开发者工具导入包。文创馆已接入四个原生页面，调用同一文创领取服务。\n\n本机预览先运行 v2/启动服务.mjs，API 使用 3210。真机须配置手机可达的 HTTPS 域名、AppID 和合法域名，并更新各模块 API 地址。微信真机运行尚未验收。\n",encoding='utf-8')
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
for name,src in [('账户评论',r/'services/account/public'),('小迹与足迹',r/'services/guide/web'),('导览公共页面',r/'services/guide/preview'),('学习挑战',r/'services/学习/public'),('数字文创',r/'services/wenchuang/public')]:collect(src,web/'模块页面'/name)
for name,src in [('账户评论',r/'services/account/微信小程序版'),('小迹与足迹',r/'services/guide/miniprogram'),('学习挑战',r/'services/学习/miniprogram'),('数字文创',r/'services/wenchuang/miniprogram')]:collect(src,mini/'模块源码'/name)
for dest in [web/'视觉规范',mini/'视觉规范']:collect(r/'视觉规范',dest)
expected += [web/'启动网页.mjs',web/'使用说明.md',mini/'使用说明.md']
finish_manifest(r,expected,r/'docs/双端文件清单.json')
