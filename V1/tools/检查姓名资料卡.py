from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
for width in [390,1440]:
 size(width);nav('people/index');call('Page.reload');time.sleep(1);wait("document.querySelectorAll('.name-record').length===389")
 count=js("document.querySelectorAll('.name-record').length")
 assert count==389,(count,js("document.querySelector('.list-summary').innerText"))
 assert js('document.documentElement.scrollWidth<=innerWidth')
 assert js("[...document.querySelectorAll('.name-record')].every(x=>!!x.querySelector('.name-monogram')&&!!x.querySelector('.name-date')&&!!x.querySelector('.name-origin'))")
 js("document.querySelector('.province-section').scrollIntoView({block:'start'})")
 time.sleep(.3);shot('姓名资料卡精修-'+str(width)+'.png')
 js("document.querySelector('.name-record').click()")
 wait("location.hash.includes('/pages/registry/index')||location.hash.includes('/pages/person/index')")
print('通过：389张姓名卡、两种宽度、日期/籍贯显示、入口跳转与无横向溢出。');ws.close()
