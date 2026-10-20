from pathlib import Path
from urllib.parse import urlsplit
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
events=[]
def call(method,p=None):
 global seq
 seq+=1;ws.send(json.dumps({'id':seq,'method':method,'params':p or {}}))
 while True:
  result=json.loads(ws.recv())
  if result.get('method') in ['Network.responseReceived','Network.loadingFailed']:events.append(result)
  if result.get('id')==seq:return result.get('result',{})
call('Network.enable');size(1366);call('Page.navigate',{'url':'https://shanhe-youji-20261017.bushystar3.chatgpt.site/?diag=1#/pages/person/index?id=P009'});time.sleep(8)
print('frame element',js("(()=>{const f=document.querySelector('.person-panorama-frame');return f?{src:f.src,sandbox:f.getAttribute('sandbox'),html:f.outerHTML}:null})()"))
def tree(x):
 f=x['frame'];u=urlsplit(f.get('url',''));print('frame',u.scheme+'://'+u.netloc+u.path,'unreachable',f.get('unreachableUrl',''));[tree(c) for c in x.get('childFrames',[])]
tree(call('Page.getFrameTree')['frameTree'])
print('state',js("(()=>{try{const f=document.querySelector('.person-panorama-frame'),w=f?.contentWindow;return {text:f?.contentDocument?.body?.innerText,ready:w?.panoramaReady,state:w?.panoramaState}}catch(e){return {message:String(e)}}})()"))
for e in events:
 if e['method']=='Network.loadingFailed':print('failed',e['params'].get('errorText'),e['params'].get('blockedReason'))
 else:
  r=e['params']['response']
  if '/panorama/' in r['url']:print('response',r['url'],r['status'],r.get('mimeType'),{k:v for k,v in r.get('headers',{}).items() if k.lower() in ['x-frame-options','content-security-policy','content-type']})
shot('线上全景诊断.png');ws.close()
