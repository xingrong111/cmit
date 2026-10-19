from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
size(390);nav('graph/index?id=P009');wait("document.querySelector('.graph-ready')")
js("document.querySelector('.graph-viewport').scrollIntoView({block:'center'})");time.sleep(.5)
before=js("document.querySelector('.graph-stage').style.transform")
rect=js("(()=>{let r=document.querySelector('.graph-viewport').getBoundingClientRect();return{x:r.left+30,y:r.top+40}})()")
call('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{**rect,'id':1}]})
call('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':rect['x']+45,'y':rect['y']+25,'id':1}]})
call('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
time.sleep(.4)
assert js("document.querySelector('.graph-stage').style.transform")!=before
js("document.querySelectorAll('.zoom-controls .zoom-button')[1].click()")
assert js("document.querySelector('.graph-stage').style.transform")!=before
js("document.querySelector('.reset-button').click()")
assert js('document.documentElement.scrollWidth<=390')
shot('新版图谱-手机画布.png');print('手机画布拖动、缩放与复位通过');ws.close()
