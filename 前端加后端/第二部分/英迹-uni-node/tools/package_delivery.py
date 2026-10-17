from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root=Path(__file__).resolve().parents[1]
out=root/'output'
out.mkdir(exist_ok=True)
excluded={'node_modules','dist','.git','output','__pycache__','.npm-cache','.cache'}
with ZipFile(out/'英迹-uni-app与Node源码.zip','w',ZIP_DEFLATED) as z:
 for p in root.rglob('*'):
  rel=p.relative_to(root)
  if p.is_file() and not any(v in excluded for v in rel.parts) and not p.name.endswith(('.sqlite3','.sqlite3-wal','.sqlite3-shm')) and p.name!='.env.local':
   z.write(p,Path('英迹-uni-node')/rel)
 if (out/'验收记录.md').exists():z.write(out/'验收记录.md','英迹-uni-node/验收记录.md')
build=root/'frontend/dist/build/mp-weixin'
with ZipFile(out/'英迹-微信开发者工具导入包.zip','w',ZIP_DEFLATED) as z:
 for p in build.rglob('*'):
  if p.is_file():z.write(p,p.relative_to(build))
for p in out.glob('*.zip'):print(p.name,p.stat().st_size)
