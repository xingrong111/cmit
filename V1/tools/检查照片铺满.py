from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
for width in [1440,390]:
 size(width);nav('radar/index');call('Page.reload');time.sleep(1)
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('#places article')")
 js("document.querySelector('iframe').contentDocument.querySelectorAll('#places [data-action=place]')[1].click()")
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('.venue-photo img')?.naturalWidth>0")
 result=js("(()=>{const d=document.querySelector('iframe').contentDocument,im=d.querySelector('.venue-photo img');return {emptyRows:[...d.querySelectorAll('.venue-service-row')].filter(e=>e.textContent.includes('暂无可确认资料')).length,fit:d.defaultView.getComputedStyle(im).objectFit,fullImage:!!d.querySelector('.venue-photo-full'),overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()")
 print(width,result);assert result['emptyRows']==0 and result['fit']=='cover' and result['fullImage'] and not result['overflow']
 shot('照片铺满与精简参观信息-'+str(width)+'.png')
print('通过：双尺寸照片铺满、可打开完整图、无空白参观条目。');ws.close()
