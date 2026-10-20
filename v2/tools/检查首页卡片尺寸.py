from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
for width in [390,1440]:
 size(width);nav('home/index');wait("document.querySelectorAll('.featured-grid .person-card').length===3")
 assert js("[...document.querySelectorAll('.roll-mark>uni-text')].slice(0,4).map(x=>x.innerText).join('')==='山河长卷'")
 assert js('document.documentElement.scrollWidth<=innerWidth')
 if width>650:
  for selector in ['.person-card','.person-card-art']:
   dimensions=js("[...document.querySelectorAll('.featured-grid "+selector+"')].map(x=>({w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height,top:x.getBoundingClientRect().top}))")
   for key in ['w','h','top']:assert max(d[key] for d in dimensions)-min(d[key] for d in dimensions)<2,(selector,key,dimensions)
  ys=js("[...document.querySelectorAll('.featured-grid .card-read')].map(x=>x.getBoundingClientRect().top)")
  assert max(ys)-min(ys)<2
 js("document.querySelector('.featured-grid').scrollIntoView({block:'start'})")
 time.sleep(.3);shot('首页等高卡片-'+str(width)+'.png')
 js("document.querySelector('.longroll-banner').scrollIntoView({block:'center'})")
 shot('山河长卷题签-'+str(width)+'.png')
 js("document.querySelector('.longroll-banner .light-button').click()")
 wait("location.hash.includes('/pages/timeline/index')")
print('通过：桌面三卡等宽等高、图片区与按钮对齐，手机单列，长卷题签及跳转正常。');ws.close()
