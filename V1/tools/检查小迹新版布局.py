from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
for width in [1440,390]:
 size(width);nav('assistant/index');call('Page.reload');time.sleep(1)
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('.assistant-starts')")
 result=js("(()=>{const f=document.querySelector('iframe'),d=f.contentDocument,b=d.querySelector('.composer').getBoundingClientRect();return {overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth,inputBottom:b.bottom,innerHeight:f.clientHeight,top:f.getBoundingClientRect().top,outerHeight:innerHeight,starts:d.querySelectorAll('.assistant-starts button').length}})()")
 print(width,result);assert not result['overflow'];assert result['inputBottom']<=result['innerHeight']+2;assert result['inputBottom']+result['top']<=result['outerHeight']+2
 shot('小迹导览新版-'+str(width)+'.png')
 js("document.querySelector('iframe').contentDocument.querySelector('[data-action=scenario][data-value=history]').click()")
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('[data-action=scenario][data-value=history].active')")
 assert js("!document.querySelector('iframe').contentDocument.querySelector('.reading-selector').hidden")
print('通过：小迹双尺寸布局、输入框可见、三条快捷提问与史料模式切换。');ws.close()
