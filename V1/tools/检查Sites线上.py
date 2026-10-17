import json,urllib.request,concurrent.futures
from pathlib import Path
from urllib.parse import quote
site='https://shanhe-youji-20261017.bushystar3.chatgpt.site'
paths=['/','/api/reading/people','/api/account/me','/api/learning/levels','/api/guide/config','/api/guide/places','/web/','/modules/account/','/modules/learning/','/vr/场景预览.html']
def check(p):
 try:
  req=urllib.request.Request(site+quote(p,safe='/?=&'),headers={'User-Agent':'Mozilla/5.0'})
  with urllib.request.urlopen(req,timeout=30) as resp:
   b=resp.read();d=json.loads(b) if 'application/json' in resp.headers.get('Content-Type','') else {}
   return {'path':p,'status':resp.status,'bytes':len(b),'items':len(d.get('items',[])),'modelConfigured':d.get('modelConfigured'),'mapConfigured':d.get('walkingConfigured'),'error':d.get('error')}
 except Exception as e:return {'path':p,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(check,paths))
out=Path(__file__).resolve().parents[1]/'docs/Sites线上检查.json';out.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results,ensure_ascii=False,indent=2))
