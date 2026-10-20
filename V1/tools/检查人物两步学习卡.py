from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
for width in [1440,390]:
 size(width);nav('learning/index');call('Page.reload');time.sleep(1)
 wait("document.querySelector('iframe')?.contentDocument?.querySelectorAll('.journey-learning-card').length===5")
 wait("[...document.querySelector('iframe').contentDocument.querySelectorAll('.learning-person-cover>img')].every(x=>x.complete&&x.naturalWidth>0)")
 result=js("(()=>{const d=document.querySelector('iframe').contentDocument;return {cards:d.querySelectorAll('.journey-learning-card').length,heights:[...d.querySelectorAll('.journey-learning-card')].map(c=>Math.round(c.getBoundingClientRect().height)),steps:d.querySelectorAll('.learning-two-steps').length,overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth,art:[...d.querySelectorAll('.learning-image-kind')].map(x=>x.textContent)}})()")
 print(width,result);assert not result['overflow'];assert max(result['heights'])<350;assert result['steps']==5
 js("document.querySelector('iframe').contentDocument.querySelector('.learning-photo-source').open=true")
 assert js("document.querySelector('iframe').contentDocument.querySelector('.learning-photo-source').textContent.includes('来源')")
 js("document.querySelector('iframe').contentDocument.querySelector('.learning-photo-source').open=false;window.scrollTo(0,750)")
 time.sleep(.3);shot('人物两步学习卡-'+str(width)+'.png')
print('通过：五张图片、双阶段状态、图注来源、双尺寸无溢出及卡片高度。');ws.close()

