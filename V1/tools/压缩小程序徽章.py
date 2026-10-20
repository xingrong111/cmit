"""仅优化微信交付副本；网页及用户提供的高清源图保持原样。"""
from pathlib import Path
from PIL import Image
import sys,json
root=Path(__file__).resolve().parents[1]
target=Path(sys.argv[1]).resolve()
allowed=[(root/'微信开发者工具导入包').resolve(),(root/'小程序端/微信开发者工具导入包').resolve()]
if target not in allowed:raise ValueError('只允许处理V1的微信交付包')
assets=target/'static/称号徽章';source=root/'frontend/src/static/称号徽章';assets.mkdir(parents=True,exist_ok=True)
items=[]
for i in range(1,6):
 name=f'H-PATH-{i}.png';src=source/name
 if not src.exists():continue
 im=Image.open(src).convert('RGBA');im.thumbnail((128,128),Image.Resampling.LANCZOS)
 im.quantize(colors=96,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(assets/name,optimize=True)
 items.append({'name':name,'sourceBytes':src.stat().st_size,'miniBytes':(assets/name).stat().st_size})
# Source-only backup images are not runtime assets. Keep every source backup intact.
runtime='\n'.join(p.read_text(encoding='utf-8',errors='ignore') for p in target.rglob('*') if p.is_file() and p.suffix in ['.js','.json','.wxml','.wxss'])
if '-原版' not in runtime and '-\\u539f\\u7248' not in runtime:
 for i in range(1,6):
  old=assets/f'H-PATH-{i}-原版.png'
  if old.exists():old.unlink()
(root/'docs/小程序徽章体积.json').write_text(json.dumps({'target':str(target),'sourcePreserved':True,'items':items},ensure_ascii=False,indent=2),encoding='utf-8')
print('微信徽章副本已优化，高清源图保留：',sum(x['miniBytes'] for x in items),'字节')

# 小程序展示副本适配屏幕；保留网页与源素材的高清版本。
guideSource=root/'services/guide/miniprogram/assets/ai-guide-xiaoying-v1.webp'
guideTarget=target/'assets/ai-guide-xiaoying-v1.webp'
if guideSource.exists() and guideTarget.exists():
 im=Image.open(guideSource).convert('RGBA');im.thumbnail((640,960),Image.Resampling.LANCZOS);im.save(guideTarget,'WEBP',quality=82,method=6)
