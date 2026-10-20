from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
for width in [390,1440]:
 size(width);nav('home/index');wait("document.querySelector('.home-hero')")
 js("document.querySelector('.home-hero').scrollIntoView({block:'start'})")
 time.sleep(.5)
 assert js('document.documentElement.scrollWidth<=innerWidth')
 assert js("document.querySelector('.hero-cta').innerText.includes('走近人物')")
 assert js("document.querySelector('.hero-label').innerText.includes('循迹读人')")
 shot('首页卷首精修-'+str(width)+'.png')
 js("document.querySelector('.hero-cta').click()")
 wait("location.hash.includes('/pages/people/index')")
print('首页卷首通过：手机/桌面、入口跳转、无横向溢出。');ws.close()
