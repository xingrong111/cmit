from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
size(390);nav('me/index');call('Page.reload');time.sleep(1);wait("document.querySelector('.my-space')")
js("[...document.querySelectorAll('.preference-card uni-button')].find(b=>b.textContent==='大字号').click()")
assert js("document.querySelector('.preference-sample').classList.contains('reading-large')")
js("[...document.querySelectorAll('.preference-card uni-button')].find(b=>b.textContent==='标准字号').click()")
nav('learning/index');time.sleep(1);wait("document.querySelector('iframe')?.contentDocument?.querySelectorAll('.person-card').length===5")
js("document.querySelector('iframe').contentDocument.querySelector('[data-hall=done]').click()")
assert js("document.querySelector('iframe').contentDocument.querySelectorAll('.person-card').length===0")
js("document.querySelector('iframe').contentDocument.querySelector('[data-hall=all]').click()")
assert js("document.querySelector('iframe').contentDocument.querySelectorAll('.person-card').length===5")
for i in range(15):
 call('Input.dispatchMouseEvent',{'type':'mouseWheel','x':320,'y':650,'deltaX':0,'deltaY':400});time.sleep(.08)
assert js("(()=>{const f=document.querySelector('iframe'),r=f.contentDocument.querySelector('#open-honors').getBoundingClientRect();return r.bottom+f.getBoundingClientRect().top<=innerHeight+5})()")
nav('learning/index?group=QQB');call('Page.reload');time.sleep(1)
wait("document.querySelector('iframe')?.contentDocument?.querySelectorAll('.stage-card').length===2")
assert js("document.querySelector('iframe').contentDocument.querySelectorAll('.stage-card button')[1].disabled")
print('通过：字号切换、五组筛选、长页面滚到底、主题入门与进阶锁定。未创建答题记录。');ws.close()


