from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
for width in [390,1440]:
 size(width);nav('home/index');wait("document.querySelectorAll('.slide-tabs uni-button').length===3")
 js("document.querySelector('.story-carousel').scrollIntoView({block:'start'})")
 for i in range(3):
  js(f"document.querySelectorAll('.slide-tabs uni-button')[{i}].click()")
  time.sleep(.6)
  assert js(f"document.querySelectorAll('.slide-tabs uni-button')[{i}].classList.contains('selected')")
  assert js('document.documentElement.scrollWidth<=innerWidth')
  shot('首页轮播-'+str(width)+'-'+str(i+1)+'.png')
 js("document.querySelectorAll('.slide-action')[2].click()")
 wait("window.sceneReady===true")
 assert js("location.pathname.includes('/panorama/jiang/')")
 nav('home/index');wait("document.querySelector('.slide-action')")
 js("document.querySelectorAll('.slide-tabs uni-button')[1].click()")
 time.sleep(.6);js("document.querySelectorAll('.slide-action')[1].click()")
 wait("location.hash.includes('person/index?id=P009')")
print('通过：两种尺寸、三屏切换、档案跳转、第一幕场景加载，无横向溢出。');ws.close()
