from pathlib import Path

prefix = Path('E:/CMIT/版本预览/核对改版页面.py').read_text(encoding='utf-8').split('size(1440);results=[]')[0]
exec(prefix)
call('Network.enable')
call('Network.setCacheDisabled', {'cacheDisabled': True})
size(1440)
for route, selector, name in [
    ('people/index', '.people-cover-heading', '人物专题背景'),
    ('timeline/index', '.timeline-cover-heading', '长卷专题背景'),
    ('me/index', '.my-cover', '我的专题背景'),
]:
    call('Page.navigate', {'url': 'http://127.0.0.1:3210/#/pages/' + route})
    wait('document.querySelector(%r)' % selector)
    time.sleep(1.5)
    info = js('''(() => {const e=document.querySelector(%r),s=getComputedStyle(e);return {background:s.backgroundImage,font:getComputedStyle(e.querySelector('.page-title')||e.querySelector('.chronicle-name')).fontSize,overflow:document.documentElement.scrollWidth>innerWidth}})()''' % selector)
    print(name, info, js('document.documentElement.dataset.appearance'), js('document.querySelector(%r).className' % selector), js('[...document.styleSheets].map(s=>s.href).filter(Boolean).slice(-5)'))
    shot(name + '.png')
ws.close()
