from pathlib import Path
from PIL import Image
import json
r=Path(__file__).resolve().parents[1];root=r.parent/'IP形象';dest=r/'frontend/src/static/人物形象';dest.mkdir(exist_ok=True)
items=[('QQB','瞿秋白','P009',root/'瞿秋白-IP程序素材包/01_程序素材/头像.png'),('SZZ','宋振中','P004',root/'宋振中-IP程序素材包/01_程序素材/头像.png'),('LDY','陆定一','P014',root/'陆定一/陆_头像.png'),('JZY','江竹筠',None,root/'江姐v2/江v2_头像.png'),('LYS','狼牙山五壮士',None,next((root/'狼牙山五壮士').rglob('*.png')))]
index={}
for group,name,pid,p in items:
 im=Image.open(p).convert('RGBA');im.thumbnail((360,360));out=dest/(name+'.png');im.quantize(colors=128,method=Image.Quantize.FASTOCTREE).save(out,optimize=True)
 index[group]={'group':group,'name':name,'personId':pid,'src':'/static/人物形象/'+out.name,'kind':'artwork','caption':name+' · 艺术化IP形象','sourceFile':str(p.relative_to(r.parent)),'note':'团队提供的AI辅助设计素材，非历史照片、非真实容貌或服饰复原。人物与时期识别以史料正文为准。'}
(r/'frontend/src/data/IP形象.json').write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding='utf-8')
# Add images to the existing IP cards without manufacturing absent dossiers.
p=r/'frontend/src/components/人物目录.vue';s=p.read_text(encoding='utf-8')
if "import ipArt" not in s:s=s.replace("import {ref,computed} from 'vue';","import {ref,computed} from 'vue';import ipArt from '../data/IP形象.json';")
s=s.replace('<text class="eyebrow">IP / {{g.group}}</text>','<image class="ip-card-image" :src="ipArt[g.group].src" mode="aspectFit"/><text class="eyebrow">IP / {{g.group}} · 艺术化形象</text>')
p.write_text(s,encoding='utf-8')
print('已接入五组团队IP素材，未改写历史照片授权状态')
