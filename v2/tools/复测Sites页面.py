from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
site='https://shanhe-youji-20261017.bushystar3.chatgpt.site'
size(1366);call('Page.navigate',{'url':site+'/#/pages/home/index'})
wait('document.querySelectorAll(".atlas-region-chip").length===34')
time.sleep(1);shot('Sites-首页.png')
js('location.hash="/pages/assistant/index"');wait('!!document.querySelector("iframe")?.contentDocument?.querySelector("#question")')
result=js("(async()=>{const r=await fetch('/api/guide/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'你叫什么名字？',history:[]})});return {status:r.status,data:await r.json()}})()")
print(json.dumps(result,ensure_ascii=False))
(r/'docs/Sites浏览器检查.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
ws.close()
