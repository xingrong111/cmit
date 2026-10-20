from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
def child(code):return "(()=>{const d=document.querySelector('iframe').contentDocument;return "+code+"})()"
for width in [390,1440]:
 size(width);nav('radar/index');call('Page.reload');time.sleep(.8)
 wait(child("!!d.querySelector('.radar-toolbar')&&!!d.querySelector('.web-radar-layout')"))
 assert js(child("d.querySelectorAll('.radar-toolbar').length===1"))
 assert js(child("d.documentElement.scrollWidth<=d.defaultView.innerWidth"))
 assert js(child("d.defaultView.getComputedStyle(d.documentElement).scrollbarWidth==='none'"))
 assert js(child("!!d.querySelector('.radar-toolbar #city')&&!!d.querySelector('.radar-toolbar [data-action=locate]')"))
 js(child("d.defaultView.scrollTo(0,150)"));time.sleep(.2)
 assert js(child("d.defaultView.scrollY>0")),'隐藏滚动条不能禁用滚动'
 js(child("d.defaultView.scrollTo(0,0)"))
 shot('雷达界面精修-'+str(width)+'.png')
 js(child("d.querySelector('[data-action=view][data-value=list]').click()"))
 wait(child("!!d.querySelector('.web-radar-layout.list-only')"))
 assert js(child("d.querySelectorAll('.radar-toolbar').length===1"))
 js(child("d.querySelector('[data-action=page][data-value=route]').click()"))
 wait(child("!!d.querySelector('.web-route-layout')"))
 assert js(child("d.documentElement.scrollWidth<=d.defaultView.innerWidth"))
print('通过：双尺寸雷达布局、隐藏滚动条、定位/城市控件保留、列表切换与路线入口。');ws.close()
