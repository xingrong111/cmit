import json,urllib.request,http.cookiejar,urllib.error
from pathlib import Path
site='https://shanhe-youji-20261017.bushystar3.chatgpt.site'
req=urllib.request.Request(site+'/api/guide/chat',data=json.dumps({'question':'你叫什么名字？','history':[]}).encode(),headers={'Content-Type':'application/json','Origin':site},method='POST')
try:
 opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 opener.open(site,timeout=20).read()
 with opener.open(req,timeout=30) as response:
  d=json.load(response);result={k:d.get(k) for k in ['status','mode','modelStatus','modelError','answer']}
except urllib.error.HTTPError as e:result={'error':str(e),'detail':e.read().decode('utf-8',errors='replace')[:1200]}
except Exception as e:result={'error':str(e)}
(Path(__file__).resolve().parents[1]/'docs/Sites小迹检查.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
