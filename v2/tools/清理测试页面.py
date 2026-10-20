import json,urllib.request,sys
sys.stdout.reconfigure(encoding='utf-8')
tabs=json.load(urllib.request.urlopen('http://127.0.0.1:9227/json/list',timeout=10));count=0
for tab in tabs:
 if tab.get('type')=='page' and 'http://127.0.0.1:3110/?mergecheck=20261015' in tab.get('url',''):
  urllib.request.urlopen('http://127.0.0.1:9227/json/close/'+tab['id'],timeout=10).read();count+=1
print('已关闭独立测试浏览器中的旧测试页：',count)
