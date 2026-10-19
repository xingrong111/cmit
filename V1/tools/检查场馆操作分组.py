from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
for width in [1440,390]:
 size(width);nav('radar/index');call('Page.reload');time.sleep(1)
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('#places article')")
 js("document.querySelector('iframe').contentDocument.querySelector('#places [data-action=place]').click()")
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('.venue-action-bar')")
 result=js("(()=>{const d=document.querySelector('iframe').contentDocument;return {buttons:[...d.querySelectorAll('.venue-action-bar button')].map(b=>b.textContent),referenceCount:d.querySelectorAll('.venue-reference-grid>details').length,overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth,routeDuplicates:d.querySelectorAll('[data-action=page][data-value=route]').length}})()")
 print(width,result);assert result['buttons']==['问小迹','查看路线','加入路线'] or result['buttons']==['问小迹','查看路线','已加入路线'];assert not result['overflow'];assert result['referenceCount']==3
 js("document.querySelector('iframe').contentDocument.querySelector('.venue-poi-fold').open=true")
 assert js("document.querySelector('iframe').contentDocument.querySelector('[data-action=copy-poi]')!==null")
 js("document.querySelector('iframe').contentDocument.querySelector('.venue-poi-fold').open=false;window.scrollTo(0,document.body.scrollHeight)")
 time.sleep(.2);shot('场馆按钮与信息分组-'+str(width)+'.png')
 js("document.querySelector('iframe').contentDocument.querySelector('.venue-action-bar [data-action=page]').click()")
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('.web-route-layout')")
print('通过：操作栏顺序、折叠资料、路线跳转及双尺寸无溢出。');ws.close()

