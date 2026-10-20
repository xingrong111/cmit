from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9231'))
size(1440);nav('home/index');wait("document.querySelector('.brand-logo img')?.naturalWidth>0")
js("localStorage.setItem('yingji:first-guide:v1','done')")
assert js("document.querySelector('link[rel=icon]').href.includes('网站图标')||decodeURI(document.querySelector('link[rel=icon]').href).includes('网站图标')")
shot('品牌Logo-桌面.png')
size(390);time.sleep(.4);assert js('document.documentElement.scrollWidth<=390');shot('品牌Logo-手机.png')
assert js("document.querySelector('.brand-logo').getBoundingClientRect().width>=40")
print('桌面与手机Logo加载、图标链接、页面宽度检查通过');ws.close()
