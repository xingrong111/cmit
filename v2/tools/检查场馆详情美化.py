from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
for width in [1440,390]:
 size(width);nav('radar/index');call('Page.reload');time.sleep(1)
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('#places article')")
 js("document.querySelector('iframe').contentDocument.querySelectorAll('#places [data-action=place]')[1].click()")
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('.venue-story')")
 time.sleep(.4)
 result=js("(()=>{const f=document.querySelector('iframe'),d=f.contentDocument;return {overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth,outerReturnHidden:getComputedStyle(document.querySelector('.page-return')).display==='none',detailReturn:d.querySelectorAll('.venue-return').length,title:d.querySelector('.hero h2').textContent}})()")
 print(width,result);assert not result['overflow'];assert result['outerReturnHidden'];assert result['detailReturn']==1
 shot('场馆详情美化-'+str(width)+'.png')
 js("document.querySelector('iframe').contentDocument.querySelector('.venue-return').click()")
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('#places article')")
 assert js("getComputedStyle(document.querySelector('.page-return')).display!=='none'")
print('通过：场馆详情双尺寸无横向溢出，单一返回入口可恢复列表。');ws.close()
