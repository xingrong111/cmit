from pathlib import Path
import urllib.request, json, websocket, time, base64, hashlib

out=Path('E:/CMIT/v2/docs/路线阅读修复核对')
out.mkdir(parents=True,exist_ok=True)
target=json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:9252/json/new?about:blank',method='PUT'),timeout=10))
ws=websocket.create_connection(target['webSocketDebuggerUrl'],suppress_origin=True,timeout=30)
seq=0
def call(method,params=None):
 global seq
 seq+=1
 ws.send(json.dumps({'id':seq,'method':method,'params':params or {}}))
 while True:
  r=json.loads(ws.recv())
  if r.get('id')==seq:
   if 'error' in r:raise RuntimeError(r['error'])
   return r.get('result',{})
def js(code):
 r=call('Runtime.evaluate',{'expression':code,'returnByValue':True,'awaitPromise':True})
 if 'exceptionDetails' in r:raise RuntimeError(r['exceptionDetails'])
 return r.get('result',{}).get('value')
def wait(code):
 for _ in range(100):
  if js('Boolean('+code+')'):return
  time.sleep(.15)
 raise AssertionError(code)
def shot(name):
 (out/(name+'.png')).write_bytes(base64.b64decode(call('Page.captureScreenshot',{})['data']))

call('Page.enable');call('Runtime.enable')
stub=r"""(()=>{
 const realFetch=window.fetch;window.__routeRequests=[];window.__failRoute=false;
 window.fetch=async(input,init)=>{const url=String(input);if(url.includes('/api/guide/routes')){const b=JSON.parse(init.body);window.__routeRequests.push(b);return new Response(JSON.stringify(window.__failRoute?{error:{message:'地图服务暂时不可用'}}:{durationMinutes:6,distanceMeters:450,legs:b.placeIds.map(id=>({placeId:id,name:'测试场馆',durationMinutes:6,steps:[{instruction:'沿道路前行'}],points:[b.origin,{latitude:31.57,longitude:120.3}]}))}),{status:window.__failRoute?502:200,headers:{'Content-Type':'application/json'}})}const res=await realFetch(input,init);if(url.includes('/api/guide/config')){const data=await res.json();data.browserMapKey='ui-test-only';return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}})}return res;};
 class LatLng{constructor(lat,lng){this.lat=lat;this.lng=lng}getLat(){return this.lat}getLng(){return this.lng}}
 class MapMock{constructor(canvas,s){this.center=s.center;this.zoom=s.zoom;this.handlers={};window.__map=this;canvas.style.background='#dce7da';canvas.addEventListener('click',()=>this.handlers.click?.({latLng:new LatLng(31.569,120.301)}));}on(k,cb){this.handlers[k]=cb}removeControl(){}getCenter(){return this.center}getZoom(){return this.zoom}setCenter(c){this.center=c}setZoom(z){this.zoom=z}fitBounds(){}destroy(){}}
 class Layer{constructor(){this.handlers={};window.__layers=window.__layers||[];window.__layers.push(this)}on(k,cb){this.handlers[k]=cb}setMap(){}setGeometries(){}updateGeometries(){}}
 window.TMap={LatLng,Map:MapMock,MultiMarker:Layer,MultiPolyline:Layer,MarkerStyle:class{},PolylineStyle:class{},LatLngBounds:class{},constants:{DEFAULT_CONTROL_ID:{ZOOM:'z',ROTATION:'r'}}};
})()"""
call('Page.addScriptToEvaluateOnNewDocument',{'source':stub})
call('Emulation.setDeviceMetricsOverride',{'width':1440,'height':1000,'deviceScaleFactor':1,'mobile':False})
call('Page.navigate',{'url':'http://127.0.0.1:3210/web/#radar'});wait("document.querySelector('[data-action=add]')")
js("document.querySelector('[data-action=add]').click()");wait("document.querySelector('.ink-map-origin button')");assert js("location.hash==='#route'")
js("window.__layers.find(x=>x.handlers.click).handlers.click({geometry:{id:document.querySelector('[data-stop-id]').dataset.stopId}})");assert not js("document.querySelector('.ink-map-origin button').disabled")
js("document.querySelector('.ink-map-origin button').click()");wait("document.querySelector('.walking-result')");assert js("__routeRequests.length===1 && Number.isFinite(__routeRequests[0].origin.latitude)")
assert js("document.querySelector('#origin-status').innerText.includes('已生成')")
js("window.__failRoute=true;document.querySelector('.live-map-canvas').click();document.querySelector('.ink-map-origin button').click()");wait("document.querySelector('.route-error')");assert js("document.querySelector('.route-error').innerText.includes('地图服务暂时不可用')")
js("window.__failRoute=false;document.querySelector('[data-action=plan]').click()");wait("document.querySelector('.walking-result')");shot('route-desktop')
for width in [1440,390]:
 call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False});time.sleep(.5);info=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,items:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+.1).slice(0,10).map(e=>({c:e.className,w:e.clientWidth,right:e.getBoundingClientRect().right}))})");print(info,flush=True);assert info['scroll']<=info['width'];assert not js("document.querySelector('.label')");shot('route-'+str(width))
print('Add navigates to route; map selection, confirm, automatic plan, visible failure, retry and responsive width passed',flush=True)
ws.close()
