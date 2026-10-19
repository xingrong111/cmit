from pathlib import Path
import json,re,shutil
root=Path('V1/services/guide');p=root/'server/data/content.json';data=json.loads(p.read_text(encoding='utf-8'));sources=json.loads(Path('V1/docs/场馆照片检索.json').read_text(encoding='utf-8'))
backup=Path('V1/docs/场馆图片接入前.json');shutil.copy2(p,backup) if not backup.exists() else None
captions=['秦邦宪故居导览牌资料照片（2011年），不是场馆建筑全景。','张闻天无锡旧居西南侧资料照片（2011年），不是1919—1949年居住场景。','张太雷旧居大门资料照片（2012年），不证明当前开放状态或游客入口。']
for sid,n,c,v,date in zip(['PLACE-WX-QBC','PLACE-WX-ZWT','PLACE-CZ-ZTL'],['qbc-2011.jpg','zwt-2011.jpg','ztl-2012.jpg'],captions,sources,['2011-11-13','2011-11-13','2012-04-12']):
 place=next(x for x in data['places'] if x['id']==sid)
 place['photo']={'id':'PHOTO-'+sid,'url':'/media/venues/'+n,'caption':c,'author':'猫猫的日记本','capturedAt':date,'license':'CC BY-SA 3.0','licenseURL':'https://creativecommons.org/licenses/by-sa/3.0/','sourceURL':v['url'],'originalFileURL':v['image'],'downloadURL':v['previewURL'],'changes':'采用来源提供的等比例预览图；未改色、未修饰；页面完整等比例展示。','checkedAt':'2026-10-18','status':'source_checked','published':False,'credit':'猫猫的日记本 · '+date+' · CC BY-SA 3.0'}
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
p=root/'server/src/domain.js';s=p.read_text(encoding='utf-8').replace("record.photo.license!=='CC BY-SA 4.0'","!['CC BY-SA 4.0','CC BY-SA 3.0'].includes(record.photo.license)").replace("record.photo.url!=='/media/venues/qqb-2017.jpg'","!/^\\/media\\/venues\\/(qqb-2017|qbc-2011|zwt-2011|ztl-2012)\\.jpg$/.test(record.photo.url)");p.write_text(s,encoding='utf-8')
p=root/'server/src/server.js';s=p.read_text(encoding='utf-8').replace("u.pathname==='/media/venues/qqb-2017.jpg'","/^\\/media\\/venues\\/(qqb-2017|qbc-2011|zwt-2011|ztl-2012)\\.jpg$/.test(u.pathname)").replace("p.id==='PLACE-CZ-QQB'&&visible(p,config.publicMode)","p.photo?.url===u.pathname&&visible(p,config.publicMode)").replace("path.join(here,'../../media/venues/qqb-2017.jpg')","path.join(here,'../../media/venues',path.basename(u.pathname))");p.write_text(s,encoding='utf-8')
# 列表加入资料照片，并展示署名；同一API控制公开范围。
p=root/'preview/app.js';s=p.read_text(encoding='utf-8').replace('<div class="place-head"><div class="number">','${p.photo?`<figure class="venue-card-photo"><img src="${esc(p.photo.url)}" alt="${esc(p.photo.caption)}" loading="lazy"><figcaption>${esc(p.photo.credit)} <a href="${esc(p.photo.sourceURL)}" target="_blank" rel="noopener noreferrer">来源</a> · <a href="${esc(p.photo.licenseURL)}" target="_blank" rel="noopener noreferrer">许可</a></figcaption></figure>`:\'\'}<div class="place-head"><div class="number">',1);p.write_text(s,encoding='utf-8')
lines=['# 五处场馆图片记录','', '访问与检查日期：2026-10-18。来源核读不等于其他人员独立签署完成，未改为公开审核通过。','']
for place in data['places']:
 f=place.get('photo');lines+=['## '+place['name'],'']
 if f:lines += [f['caption'],'','作者：'+f['author'],'许可：'+f['license'],'来源：'+f['sourceURL'],'许可链接：'+f['licenseURL'],'处理：'+f['changes'],'']
 else:lines += ['陆定一祖居照片线索： https://www.sohu.com/a/435356261_120054268','该文署素材来源为堰桥街道宣传办，摄影为敖翔、吴镇界；尚未找到明确转载许可，未复制入系统。注意不能用县前西街的陆定一故居代替惠山老陆巷祖居。','原网页门额照片位于“带你去陆定一祖居看看”之后，可联系权利人或团队现场拍摄补充。','']
Path('V1/docs/五处场馆图片来源.md').write_text('\n'.join(lines),encoding='utf-8')
