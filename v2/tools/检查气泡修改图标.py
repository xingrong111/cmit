from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
for width in [1440,390]:
 size(width);nav('assistant/index');call('Page.reload');time.sleep(1);wait("document.querySelector('iframe')?.contentDocument?.querySelector('.assistant-starts')")
 js("document.querySelector('iframe').contentWindow.eval(\"state.messages=[{role:'user',text:'这个小程序有哪些功能？'}];assistant();\")")
 data=js("(()=>{const d=document.querySelector('iframe').contentDocument,b=d.querySelector('.conversation>.user'),icon=b.querySelector('.icon-button');return {height:b.getBoundingClientRect().height,iconPosition:d.defaultView.getComputedStyle(icon.parentElement).position,iconOpacity:d.defaultView.getComputedStyle(icon).opacity}})()")
 print(width,data);assert data['height']<60 and data['iconPosition']=='absolute'
 js("document.querySelector('iframe').contentDocument.querySelector('.user [data-action=edit-message]').click()")
 assert js("document.querySelector('iframe').contentDocument.querySelector('#question').value==='这个小程序有哪些功能？'")
print('通过：单行提问气泡高度收紧，修改图标不占行且可回填提问。');ws.close()
