from pathlib import Path
from PIL import Image
import json,datetime
r=Path(__file__).resolve().parents[1];folder=r/'docs/剩余人物图片核对包';dest=r/'frontend/src/static/人物照片'
rows=json.loads((folder/'逐图来源与待核事项.json').read_text(encoding='utf-8'));p=r/'frontend/src/data/人物肖像.json';data=json.loads(p.read_text(encoding='utf-8'))
notes={'P001':('人物配图 · 原件性质待核','史砚芬人物条目配图，暂不将其断言为生前摄影原片。'),'P006':('合影 · 张应春为左一','张应春在上海中国女子体育学校与同学习刀舞，原图注标明张应春为左一。保留整幅合影，不裁切其他同学。'),'P011':('许晓轩像 · 年代未标','许晓轩像，新华社发；采用中国青年网转载版本，不将转载链视为多份独立证据。'),'P012':('郭纲琳像 · 资料照片','郭纲琳像（资料照片），新华社发。'),'P013':('钱振标遗像 · 原件待核','采用原报道标注的钱振标烈士遗像；不将遗像自动称为生前照片。')}
for row in rows:
 pid=row['id']
 if pid not in notes:continue
 assert row.get('localFile')
 im=Image.open(folder/row['localFile']).convert('RGB');im.thumbnail((360,440));target=dest/(row['name']+'.jpg');im.save(target,quality=78,optimize=True)
 short,caption=notes[pid]
 data[pid].update({'src':'/static/人物照片/'+target.name,'caption':caption,'shortCaption':short,'period':'拍摄或制作日期未确定，依来源图注说明','sourceUrl':row['page'],'sourceTitle':row['title'],'sourceAgency':row['agency'],'originalImageUrl':row['url'],'rightsApproved':False,'identityVerified':True,'identityEvidence':'按本轮已读页面及明确配图标识匹配，原件与性质仍以图注边界为准。','rightsEvidence':'公开使用条件尚待确认；用户授权将当前搜集素材加入系统展示，不等于取得权利人授权。','displayApproved':True,'displayApprovalNote':'用户明确要求将当前搜集图片放入系统，并对群体像作标注。','displayApprovalDate':datetime.date.today().isoformat(),'creditLabel':'来源配图 · 使用待确认 ↗','status':'已按用户要求展示；图片使用条件待确认'})
data['P002']['shortCaption']='合影 · 史良为左起第二人'
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
p=r/'frontend/src/components/PersonPortrait.vue';s=p.read_text(encoding='utf-8').replace("ready&&!preferIP?'史料照片 · 图注来源 ↗'", "ready&&!preferIP?(asset.creditLabel||'史料照片 · 图注来源 ↗')")
p.write_text(s,encoding='utf-8')
assert len([v for v in data.values() if v.get('src')])==15
print('15份人物档案均已配图；史良、张应春合影已标注人物位置；保留5项使用条件待确认状态。')
