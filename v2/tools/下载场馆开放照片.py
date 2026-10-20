import json,requests
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
x=json.loads(Path('V1/docs/场馆照片检索.json').read_text(encoding='utf-8-sig'));out=Path('V1/services/guide/media/venues');out.mkdir(parents=True,exist_ok=True)
for v,n in zip(x,['qbc-2011.jpg','zwt-2011.jpg','ztl-2012.jpg']):
 r=requests.get(v['previewURL'],timeout=30,headers={'User-Agent':'ShanheYouji/1.0 (educational venue-image attribution audit)'});r.raise_for_status();(out/n).write_bytes(r.content);im=Image.open(out/n);print(n,im.size)
canvas=Image.new('RGB',(1200,340),'white')
for i,n in enumerate(['qbc-2011.jpg','zwt-2011.jpg','ztl-2012.jpg']):
 im=Image.open(out/n);im.thumbnail((395,310));canvas.paste(im,(400*i,0));ImageDraw.Draw(canvas).text((400*i+10,315),n,fill='black')
canvas.save('V1/docs/场馆照片预览.jpg')

