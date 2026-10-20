from pathlib import Path
prefix=Path('E:/CMIT/版本预览/核对改版页面.py').read_text(encoding='utf-8').split('size(1440);results=[]')[0]
exec(prefix)
results=[]
for width in [1440,390]:
 size(width)
 for route in ['home','people','learning','assistant','me']:
  call('Page.navigate',{'url':'http://127.0.0.1:3210/#/pages/'+route+'/index'});time.sleep(3)
  js("document.querySelector('.welcome-top uni-button,.welcome-top button')?.click()")
  assert js('document.documentElement.scrollWidth<=innerWidth'),(width,route)
  if route=='people':
   js("[...document.querySelectorAll('.directory-segments uni-button')].find(e=>e.textContent.includes('全国名单'))?.click()")
   wait("document.querySelector('.name-monogram')")
   print('seal',js("getComputedStyle(document.querySelector('.name-monogram')).color"))
   shot('V2-人物朱章-'+str(width)+'.png')
   js("[...document.querySelectorAll('.directory-segments uni-button')].find(e=>e.textContent.includes('IP专项')).click()")
   time.sleep(.5)
   print('photos',js("[...document.querySelectorAll('.ip-card-image img')].map(x=>({src:x.src,loaded:x.complete&&x.naturalWidth>0}))"))
   shot('V2-专题真人图-'+str(width)+'.png')
  else:shot('V2-'+route+'-'+str(width)+'.png')
  results.append({'page':route,'width':width,'overflow':False})
(r/'V2外观核对.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results,ensure_ascii=False));ws.close()
