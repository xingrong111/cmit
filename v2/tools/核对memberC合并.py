from pathlib import Path

prefix = Path('E:/CMIT/版本预览/核对改版页面.py').read_text(encoding='utf-8').split('size(1440);results=[]')[0]
exec(prefix)
call('Network.enable')
call('Network.setCacheDisabled', {'cacheDisabled': True})
size(1440)
for route, selector, name in [
    ('home/index', '.onboard-card', 'memberC-首页'),
    ('guide/index', '.qs-steps', 'memberC-使用指南'),
    ('assistant/index', '.assistant-stage iframe', 'memberC-小迹'),
    ('people/index', '.people-cover-heading', 'memberC-人物'),
]:
    call('Page.navigate', {'url': 'http://127.0.0.1:3210/#/pages/' + route})
    wait('document.querySelector(%r)' % selector if route != 'home/index' else "document.querySelector('.story-carousel')")
    time.sleep(1.4)
    info = js('''(() => ({url:location.href,companion:!!document.querySelector('.xiaoji-root'),onboard:!!document.querySelector('.onboard-card'),guide:!!document.querySelector('.qs-steps'),tip:!!document.querySelector('.page-tip'),overflow:document.documentElement.scrollWidth>innerWidth,iframeHeight:document.querySelector('.assistant-stage iframe')?.getBoundingClientRect().height||0,iframeText:document.querySelector('.assistant-stage iframe')?.contentDocument?.body?.innerText.slice(0,70)||''}))()''')
    print(name, info)
    shot(name + '.png')
ws.close()
