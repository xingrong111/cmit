from PIL import Image,ImageDraw
from pathlib import Path
import math,json
root=Path('V1');out=root/'frontend/src/static/称号徽章';out.mkdir(exist_ok=True);S=3
for i in range(1,6):
 im=Image.new('RGBA',(256*S,256*S));d=ImageDraw.Draw(im)
 def poly(points,fill,outline=None,w=2):
  p=[(int(x*S),int(y*S)) for x,y in points];d.polygon(p,fill=fill)
  if outline:d.line(p+[p[0]],fill=outline,width=w*S,joint='curve')
 def line(points,color='#BD9A67',w=3):d.line([(int(x*S),int(y*S)) for x,y in points],fill=color,width=w*S,joint='curve')
 def ellipse(box,fill=None,outline=None,w=2):d.ellipse(tuple(int(v*S) for v in box),fill=fill,outline=outline,width=w*S)
 red='#982B28';green='#354D43';gold='#BD9A67';paper='#FBF5E9'
 poly([(128,10),(216,53),(239,147),(185,227),(71,227),(17,147),(40,53)],'#E8D5AF',gold,2)
 poly([(128,20),(207,59),(228,145),(179,216),(77,216),(28,145),(49,59)],paper,gold,1)
 ellipse((55,44,201,190),'#F1E6D0',gold,1)
 for a in range(0,360,30):
  x=128+83*math.cos(a*math.pi/180);y=117+83*math.sin(a*math.pi/180);ellipse((x-2,y-2,x+2,y+2),gold)
 if i==1:poly([(130,65),(143,91),(137,106),(157,91),(171,127),(161,149),(128,161),(100,149),(91,129),(108,103),(113,122),(126,108)],red);poly([(128,117),(139,138),(128,152),(117,140)],'#D6B471')
 if i==2:
  poly([(79,85),(111,81),(128,91),(145,81),(177,85),(177,148),(144,145),(128,156),(111,145),(79,148)],green);line([(128,94),(128,150)],paper,2);line([(89,97),(110,94)],gold,2);line([(89,108),(112,105)],gold,2);line([(144,105),(166,108)],gold,2)
 if i==3:
  ellipse((139,66,164,91),gold);poly([(72,148),(105,87),(132,131),(152,102),(185,148)],green);line([(78,158),(110,151),(137,158),(177,153)],red,4)
 if i==4:
  poly([(110,82),(114,68),(142,68),(146,82)],green);poly([(102,86),(154,86),(162,142),(144,159),(112,159),(94,142)],red);line([(105,94),(151,94),(156,139),(142,151),(114,151),(100,139),(105,94)],gold,2);poly([(129,101),(140,126),(128,143),(116,127)],'#E9CC8D');line([(128,158),(128,176)],green,3)
 if i==5:
  ellipse((110,66,146,102),gold);poly([(76,139),(104,103),(128,133),(153,101),(181,139)],green);poly([(78,145),(106,142),(128,152),(150,142),(178,145),(178,166),(150,163),(128,175),(106,163),(78,166)],red);line([(128,153),(128,170)],paper,2)
 poly([(67,188),(189,188),(181,213),(75,213)],green if i%2==0 else red)
 for n in range(i):ellipse((128-(i-1)*7+n*14-2,199-2,128-(i-1)*7+n*14+2,199+2),'#F5E5C4')
 im.resize((256,256),Image.Resampling.LANCZOS).quantize(colors=96,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(out/f'H-PATH-{i}.png',optimize=True)
honors=json.loads((root/'services/学习/honors.json').read_text(encoding='utf-8'));assets={x['id']:{**x,'badge':'/static/称号徽章/'+x['id']+'.png'} for x in honors['titles']}
p=root/'services/学习/public/人物卡片素材.js';s=p.read_text(encoding='utf-8');s=s.split('\nwindow.learningBadges=')[0];p.write_text(s+'\nwindow.learningBadges='+json.dumps(assets,ensure_ascii=False)+';',encoding='utf-8')
(root/'services/学习/miniprogram/utils/称号徽章.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2),encoding='utf-8')
