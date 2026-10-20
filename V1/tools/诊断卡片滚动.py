from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
size(1440);nav('radar/index');call('Page.reload');time.sleep(1)
wait("document.querySelector('iframe')?.contentDocument?.querySelector('#places article')")
for i in range(6):
 call('Input.dispatchMouseEvent',{'type':'mouseWheel','x':1100,'y':750,'deltaX':0,'deltaY':350});time.sleep(.25)
 print(js("(()=>{const f=document.querySelector('iframe'),d=f.contentDocument;return {outer:scrollY,inner:f.contentWindow.scrollY,height:d.documentElement.scrollHeight,viewport:f.clientHeight,last:d.querySelector('#places article:last-child').getBoundingClientRect().bottom}})()"))
ws.close()
