from pathlib import Path
import os,subprocess,socket,json,time,sys,urllib.request
sys.stdout.reconfigure(encoding='utf-8')
r=Path(__file__).resolve().parents[1]
node=Path(os.environ['USERPROFILE'])/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
def running(port):
 with socket.socket() as s:s.settimeout(.3);return s.connect_ex(('127.0.0.1',port))==0
processes=[]
if not any(running(p) for p in [3110,3111,3112,3113,3114]):
 with (r/'docs/合并预览日志.log').open('ab') as log:
  p=subprocess.Popen([str(node),str(r/'启动服务.mjs')],cwd=r,stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW)
  processes.append({'name':'合并服务','pid':p.pid})
else:print('检测到已有服务，将复用现有端口，不终止其他进程。')
if not running(9227):
 browsers=[Path(os.environ.get('PROGRAMFILES(X86)','C:/Program Files (x86)'))/'Microsoft/Edge/Application/msedge.exe',Path(os.environ['PROGRAMFILES'])/'Google/Chrome/Application/chrome.exe']
 browser=next((p for p in browsers if p.exists()),None)
 if browser:
  profile=r.parent/'tmp/合并页面浏览器';profile.mkdir(exist_ok=True)
  with (r/'docs/浏览器复测日志.log').open('ab') as log:
   p=subprocess.Popen([str(browser),'--headless=new','--disable-gpu','--remote-debugging-port=9227','--remote-allow-origins=*','--user-data-dir='+str(profile),'about:blank'],stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW)
   processes.append({'name':'页面验证浏览器','pid':p.pid})
def ready():
 try:
  with urllib.request.urlopen('http://127.0.0.1:3110/api/reading/people?limit=1',timeout=2) as response:return response.status==200
 except Exception:return False
for i in range(120):
 if all(running(p) for p in [3110,3111,3112,3113,3114,9227]) and ready():break
 time.sleep(.25)
print(json.dumps({'processes':processes,'preview':ready(),'browser':running(9227)},ensure_ascii=False))
