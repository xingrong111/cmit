import os,json,subprocess,time,tempfile,urllib.request,urllib.error
from pathlib import Path
r=Path('E:/CMIT/v2');out=r/'docs/邮箱注册核对';out.mkdir(exist_ok=True)
node=Path(os.environ['USERPROFILE'])/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
with tempfile.TemporaryDirectory(dir=out) as temporary:
 t=Path(temporary);assert t.resolve().is_relative_to(out.resolve())
 data=t/'accounts.json';data.write_text(json.dumps({'users':[],'comments':[],'facts':[],'audit':[]}));mail=t/'mail.json'
 helper=r/'services/account/email-verification.js';pre=t/'preload.cjs'
 pre.write_text('const fs=require("node:fs"),m=require('+json.dumps(str(helper))+');const original=m.createVerification;m.createVerification=()=>original({send:async(email,code)=>fs.writeFileSync('+json.dumps(str(mail))+',JSON.stringify({email,code}))});',encoding='utf-8')
 env={**os.environ,'PORT':'3312','DATA_FILE':str(data),'ADMIN_EMAILS':'admin@example.test'}
 proc=subprocess.Popen([str(node),'--require',str(pre),str(r/'services/account/server.js')],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW)
 def api(path,body=None,token=None):
  req=urllib.request.Request('http://127.0.0.1:3312/api'+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json',**({'Authorization':'Bearer '+token} if token else {})})
  try:
   with urllib.request.urlopen(req,timeout=5) as response:return response.status,json.load(response)
  except urllib.error.HTTPError as e:return e.code,json.load(e)
 try:
  for _ in range(50):
   try:api('/me');break
   except Exception:time.sleep(.1)
  user={'email':'user@example.test','nickname':'普通用户','password':'Test-password-2026','agreementAccepted':True,'role':'admin'}
  assert api('/auth/register',user)[0]==400
  assert api('/auth/email-code',{'email':user['email']})[0]==200
  code=json.loads(mail.read_text())['code']
  assert api('/auth/email-code',{'email':user['email']})[0]==429
  assert api('/auth/register',{**user,'emailCode':'000000'})[0]==400
  status,d=api('/auth/register',{**user,'emailCode':code});assert status==201 and d['user']['role']=='user' and d['user']['emailVerified']
  _,d=api('/auth/login',user);token=d['token'];assert api('/admin/comments',token=token)[0]==403
  admin={**user,'email':'admin@example.test'};assert api('/auth/email-code',{'email':admin['email']})[0]==200
  code=json.loads(mail.read_text())['code'];status,d=api('/auth/register',{**admin,'emailCode':code});assert status==201 and d['user']['role']=='admin'
  _,d=api('/auth/login',admin);assert api('/admin/comments',token=d['token'])[0]==200
  admin_token=d['token'];proc.terminate();proc.wait(timeout=10)
  proc=subprocess.Popen([str(node),'--require',str(pre),str(r/'services/account/server.js')],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW)
  for _ in range(50):
   try:api('/me');break
   except Exception:time.sleep(.1)
  assert api('/me',token=admin_token)[1]['user']['role']=='admin'
  assert api('/admin/comments',token=admin_token)[0]==200
  assert admin_token not in (t/'login-sessions.json').read_text()
  assert api('/auth/logout',{},token=admin_token)[0]==200
  assert api('/me',token=admin_token)[1]['user'] is None
  result={'sessionSurvivesRestart':True,'logoutRevokesSession':True,'tokensStoredHashed':True,'missingCodeRejected':True,'wrongCodeRejected':True,'emailVerified':True,'cooldownEnforced':True,'roleInjectionRejected':True,'userAdminDenied':True,'designatedVerifiedAdminAccepted':True}
  (out/'接口核对.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(result)
 finally:proc.terminate();proc.wait(timeout=10)
