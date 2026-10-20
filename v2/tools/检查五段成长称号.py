from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
for width in [1440,390]:
 size(width);nav('learning/index');call('Page.reload');time.sleep(1)
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('#open-honors')")
 js("document.querySelector('iframe').contentDocument.querySelector('#open-honors').click()")
 wait("document.querySelector('iframe')?.contentDocument?.querySelectorAll('.badge-album-card').length===5")
 value=js("(()=>{const f=document.querySelector('iframe'),d=f.contentDocument;return {names:[...d.querySelectorAll('.badge-album-card h3')].map(x=>x.textContent),next:d.querySelectorAll('.badge-album-card.next').length,overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()")
 print(width,value);assert len(value['names'])==5 and not value['overflow'];assert value['next']<=1
 shot('五段学习成长称号-'+str(width)+'.png')
 js("document.querySelector('iframe').contentDocument.querySelector('#hall').click()")
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('.challenge-grid')")
print('通过：五段路线、单一次目标、双尺寸无溢出及返回学习。');ws.close()
