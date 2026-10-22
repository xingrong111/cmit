from pathlib import Path
import os,json,subprocess,tempfile,time,urllib.request,urllib.error,hashlib
r=Path('E:/CMIT/v2');node=Path(os.environ['USERPROFILE'])/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
out=r/'docs/账户审核完善核对';out.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(dir=out) as temporary:
 t=Path(temporary);assert t.resolve().is_relative_to(out.resolve())
 password='Fixture-password-2026';salt='fixture-local-only';digest=hashlib.scrypt(password.encode(),salt=salt.encode(),n=16384,r=8,p=1,dklen=64).hex()
 users=[dict(id=role,email=role+'@example.test',nickname='资料审核员' if role=='admin' else '山河读者',role='admin' if role=='admin' else 'user',passwordHash=salt+':'+digest,createdAt='2026-10-22T00:00:00Z',emailVerifiedAt='2026-10-22T00:00:00Z') for role in ['admin','reader']]
 data=t/'accounts.json';data.write_text(json.dumps(dict(users=users,comments=[],facts=[],audit=[])),encoding='utf-8')
 gateway=t/'gateway.cjs';gateway.write_text("const http=require('http');http.createServer((q,s)=>{let account=q.url.startsWith('/api/account');const u=http.request({hostname:'127.0.0.1',port:account?3312:3210,path:account?q.url.replace('/api/account','/api'):q.url,method:q.method,headers:q.headers},r=>{s.writeHead(r.statusCode,r.headers);r.pipe(s)});u.on('error',()=>{s.writeHead(502);s.end()});q.pipe(u)}).listen(3340,'127.0.0.1')")
 env={**os.environ,'PORT':'3312','DATA_FILE':str(data)}
 backend=subprocess.Popen([str(node),str(r/'services/account/server.js')],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW)
 proxy=subprocess.Popen([str(node),str(gateway)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW)
 def api(path,body=None,token=None,method=None):
  req=urllib.request.Request('http://127.0.0.1:3312/api'+path,data=json.dumps(body).encode() if body is not None else None,method=method,headers={'Content-Type':'application/json',**({'Authorization':'Bearer '+token} if token else {})})
  try:
   with urllib.request.urlopen(req,timeout=8) as response:return response.status,json.load(response)
  except urllib.error.HTTPError as e:return e.code,json.load(e)
 try:
  for _ in range(50):
   try:api('/me');break
   except Exception:time.sleep(.15)
  admin=api('/auth/login',{'email':users[0]['email'],'password':password})[1]['token'];reader=api('/auth/login',{'email':users[1]['email'],'password':password})[1]['token']
  assert api('/admin/dashboard',token=reader)[0]==403
  _,d=api('/comments',{'topicId':'P003','content':'阅读人物史料后，希望继续核对这段历史。'},reader);item=d['item'];cid=item['id'];version=item['version']
  assert api('/comments')[1]['items']==[]
  assert api('/admin/comments/'+cid+'/review',{'decision':'approved','version':version},reader)[0]==403
  assert api('/admin/comments/'+cid+'/review',{'decision':'rejected','version':version,'reason':''},admin)[0]==400
  _,d=api('/admin/comments/'+cid+'/review',{'decision':'approved','version':version},admin);version=d['item']['version'];assert len(api('/comments')[1]['items'])==1
  assert api('/admin/comments/'+cid+'/review',{'decision':'approved','version':1},admin)[0]==409
  _,d=api('/admin/comments/'+cid+'/hide',{'version':version,'reason':'请补充这段阅读感受所引用的史料来源。'},admin);version=d['item']['version'];assert not api('/comments')[1]['items']
  _,d=api('/comments/'+cid,{'version':version,'content':'修改后补充来源：人物档案中的公开史料。'},reader,method='PUT');version=d['item']['version']
  _,d=api('/admin/comments/'+cid+'/review',{'decision':'rejected','version':version,'reason':'请进一步标明来源标题。'},admin);version=d['item']['version'];assert api('/my/comments',token=reader)[1]['items'][0]['reviewReason']
  counts=api('/admin/dashboard',token=admin)[1];assert counts['commentCounts']['rejected']==1 and len(counts['reviewAudit'])==3
  # Add a pending entry for UI review and filter checks.
  api('/comments',{'topicId':'P003','content':'请审核这条新的学习感受，供界面验证。'},reader)
  exec((r/'tools/核对地图与场馆封面.py').read_text(encoding='utf-8').split("call('Page.enable')")[0].replace('9246','9251').replace('docs/地图与场馆封面核对','docs/账户审核完善核对'))
  call('Page.enable');call('Runtime.enable');call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True})
  def nav(route):
   call('Page.navigate',{'url':'http://127.0.0.1:3340/#/pages/'+route+'/index'});time.sleep(.4);call('Page.reload');time.sleep(.6)
  def login(token,id):
   js('localStorage.setItem("yingji_token",'+json.dumps(token)+');localStorage.setItem("yingji_user_id",'+json.dumps(id)+');sessionStorage.setItem("yingji:entry-choice","member")')
  results=[]
  for width in [1440,390]:
   call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False})
   nav('home');js("localStorage.removeItem('yingji_token');sessionStorage.removeItem('yingji:entry-choice')");call('Page.reload');time.sleep(.5);wait("document.querySelector('.entry-gate')");shot('新欢迎背景-'+str(width))
   login(admin,'admin');nav('admin');wait("document.querySelector('iframe')?.contentDocument?.querySelector('#adminItems .list-item')");time.sleep(1)
   info=js("(()=>{const d=document.querySelector('iframe').contentDocument;return {metrics:d.querySelectorAll('#dashboard .metric').length,overflow:d.documentElement.scrollWidth>d.defaultView.innerWidth,height:d.body.getBoundingClientRect().height,frame:document.querySelector('iframe').clientHeight}})()");assert info['metrics']==4 and not info['overflow'] and abs(info['height']-info['frame'])<10,info;results.append(info);shot('管理员工作台-'+str(width))
   js("document.querySelector('iframe').contentWindow.setAdminSearch('不存在的关键词')");wait("document.querySelector('iframe').contentDocument.querySelector('#adminItems .empty')");js("document.querySelector('iframe').contentWindow.setAdminSearch('')")
   js("document.querySelector('iframe').contentDocument.querySelector('#adminItems .text-button').click()");wait("document.querySelector('iframe').contentDocument.querySelector('.modal')");shot('审核详情-'+str(width));js("document.querySelector('iframe').contentWindow.closeModal()")
   nav('me');wait("document.querySelector('.account-role.admin')&&document.querySelector('.account-metrics')");assert js("document.querySelector('.my-account-actions').innerText.includes('审核')");shot('管理员账户-'+str(width))
   login(reader,'reader');nav('me');wait("document.querySelector('.account-role.reader')&&document.querySelector('.account-metrics')");assert not js("document.querySelector('.my-account-actions').innerText.includes('审核')");shot('普通用户账户-'+str(width))
   nav('my-comments');wait("document.querySelector('iframe')?.contentDocument?.querySelector('#myComments .list-item')");time.sleep(.5);shot('我的评论-'+str(width))
   nav('admin');wait("document.querySelector('iframe')?.contentDocument?.querySelector('.permission-card')");assert not js("document.querySelector('iframe').contentDocument.querySelector('#adminItems')")
  ws.close();(out/'结果.json').write_text(json.dumps({'roleGuards':True,'reviewApproveRejectHideResubmit':True,'versionConflict':True,'accurateCountsAndHistory':True,'views':results},ensure_ascii=False,indent=2),encoding='utf-8');print('Review lifecycle, role guards, dashboard, search, history, desktop and mobile checks passed',flush=True)
 finally:
  for process in [proxy,backend]:process.terminate();process.wait(timeout=10)
