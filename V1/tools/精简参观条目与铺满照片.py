from pathlib import Path
import json
r=Path('V1/services/guide')
p=r/'preview/app.js';s=p.read_text(encoding='utf-8').replace('service.entries.map(e=>','service.entries.filter(e=>e.status!==\'unknown\'&&e.sourceIds?.length).map(e=>')
s=s.replace('<figure class="venue-photo"><img src="${esc(f.url)}" alt="${esc(f.caption)}" loading="lazy">','<figure class="venue-photo"><a class="venue-photo-full" href="${esc(f.url)}" target="_blank" rel="noopener noreferrer" aria-label="查看完整场馆照片"><img src="${esc(f.url)}" alt="${esc(f.caption)}" loading="lazy"></a>')
p.write_text(s,encoding='utf-8')
p=r/'miniprogram/pages/place/index.js';s=p.read_text(encoding='utf-8').replace('if(place.photo)place.photo.displayURL=api.assetURL(place.photo.url);',"if(place.photo)place.photo.displayURL=api.assetURL(place.photo.url);if(place.visitorService)place.visitorService.entries=place.visitorService.entries.filter(e=>e.status!=='unknown'&&e.sourceIds?.length);");p.write_text(s,encoding='utf-8')
p=r/'miniprogram/pages/place/index.wxml';s=p.read_text(encoding='utf-8').replace('mode="widthFix" bindtap="previewPhoto"','mode="aspectFill" bindtap="previewPhoto"').replace('<view class="venue-service-row">','<view wx:if="{{item.status!==\'unknown\' &amp;&amp; item.sourceIds.length}}" class="venue-service-row">');p.write_text(s,encoding='utf-8')
p=r/'miniprogram/pages/place/index.wxss';p.write_text(p.read_text(encoding='utf-8')+'\n.venue-photo-image{display:block;width:100%;height:420rpx}\n',encoding='utf-8')
p=r/'server/data/content.json';d=json.loads(p.read_text(encoding='utf-8'))
for v in d['places']:
 if v.get('photo'):v['photo']['changes']='采用来源照片或其预览图；页面等比例放大并居中裁切以填充框；未改色、未修饰。点击可查看完整图片，裁切展示沿用原图许可。'
p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
