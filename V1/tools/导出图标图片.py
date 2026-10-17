from pathlib import Path
import json,base64,io
from PIL import Image
r=Path(__file__).resolve().parents[1]
exec((r/'tools/绘制国风图标.py').read_text(encoding='utf-8').split('for name in shapes:')[0])
base=(r/'tools/检查合并页面.py').read_text(encoding='utf-8');exec(base.split('results=[]')[0])
tabs=['home','people','pin','assistant','bookmark','timeline']
for name in shapes:
 for active in ([False,True] if name in tabs else [True]):
  xml=svg(name,active);url='data:image/svg+xml;base64,'+base64.b64encode(xml.encode()).decode()
  result=js('''new Promise((resolve,reject)=>{let i=new Image();i.onload=()=>{let c=document.createElement('canvas');c.width=80;c.height=80;c.getContext('2d').drawImage(i,0,0,80,80);resolve(c.toDataURL('image/png').split(',')[1])};i.onerror=()=>reject('SVG render failed');i.src='''+json.dumps(url)+'})')
  im=Image.open(io.BytesIO(base64.b64decode(result))).convert('RGBA');im.quantize(colors=96,method=Image.Quantize.FASTOCTREE).save(dest/(name+('-active' if active and name in tabs else '')+'.png'),optimize=True)
ws.close();print('25个跨端PNG图标已导出')
