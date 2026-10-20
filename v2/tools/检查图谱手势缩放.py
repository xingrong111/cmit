from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
def transform():return js("(()=>{let m=new DOMMatrix(getComputedStyle(document.querySelector('.graph-stage')).transform);return{s:m.a,x:m.e,y:m.f}})()")
def wheel(x,y,dy):
 call('Input.dispatchMouseEvent',{'type':'mouseWheel','x':x,'y':y,'deltaY':dy,'deltaX':0});time.sleep(.25)
size(1366);nav('graph/index?id=P009');wait("document.querySelector('.graph-ready')")
js("document.querySelector('.graph-viewport').scrollIntoView({block:'center'})");time.sleep(.4)
rct=js("(()=>{let r=document.querySelector('.graph-viewport').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()")
x=rct['x']+rct['w']*.65;y=rct['y']+rct['h']*.45
before=transform();page_y=js('scrollY');wheel(x,y,-100);after=transform();assert after['s']>before['s'];assert js('scrollY')==page_y
wx=(x-rct['x']-before['x'])/before['s'];wy=(y-rct['y']-before['y'])/before['s']
assert abs(after['x']+wx*after['s']-(x-rct['x']))<1
assert abs(after['y']+wy*after['s']-(y-rct['y']))<1
wheel(x,y,100);assert abs(transform()['s']-before['s'])<.002
for _ in range(10):wheel(x,y,-160)
assert transform()['s']<=2.001
js("document.querySelector('.reset-button').click()")
size(390);nav('graph/index?id=P009');wait("document.querySelector('.graph-ready')");time.sleep(.5)
js("document.querySelector('.graph-viewport').scrollIntoView({block:'center'})");time.sleep(.3)
rct=js("(()=>{let r=document.querySelector('.graph-viewport').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()")
cx=rct['x']+rct['w']/2;cy=rct['y']+rct['h']/2
before=transform()
def touch(kind,distance):
 call('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind=='touchEnd' else [{'x':cx-distance/2,'y':cy,'id':1},{'x':cx+distance/2,'y':cy,'id':2}]})
touch('touchStart',80);time.sleep(.2);touch('touchMove',140);time.sleep(.3);after=transform()
assert after['s']>before['s']*1.5
wx=(rct['w']/2-before['x'])/before['s'];wy=(rct['h']/2-before['y'])/before['s']
assert abs(after['x']+wx*after['s']-rct['w']/2)<2
assert abs(after['y']+wy*after['s']-rct['h']/2)<2
touch('touchMove',50);time.sleep(.3);assert transform()['s']<before['s']
touch('touchEnd',0);assert not js("document.querySelector('.inspector-open')")
js("document.querySelector('.reset-button').click()")
print('鼠标滚轮与双指缩放、缩放锚点、范围限制和手势防误触通过');ws.close()
