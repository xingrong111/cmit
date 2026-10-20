from pathlib import Path
import json,subprocess,sys,os,urllib.request,time,socket,collections
sys.stdout.reconfigure(encoding='utf-8')
r=Path(__file__).resolve().parents[1]
node=Path(os.environ['USERPROFILE'])/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
def read(p):return p.read_text(encoding='utf-8-sig')
data=json.loads(read(r/'frontend/src/data/合并人物目录.json'));provinces=json.loads(read(r/'frontend/src/data/省份目录.json'));geo=json.loads(read(r/'frontend/src/data/中国省界.json'))
assert len(data)==390 and len({p['id'] for p in data})==390
codes={p['code'] for p in provinces};assert len(codes)==34
assert all(p['provinceCode'] in codes or not p['provinceCode'] for p in data)
assert {str(f['properties']['区划码']) for f in geo['features']}==codes
counts=collections.Counter(p['provinceCode'] for p in data if p['provinceCode']);assert sum(counts.values())==178
assert all(p['reviewStatus']=='pending' for p in data)
config=json.loads(read(r/'小程序端/微信开发者工具导入包/app.json'))
assert len(config['pages'])==27 and len(config['tabBar']['list'])==5
assert len(set(config['pages']))==len(config['pages'])
for route in config['pages']:
 for ext in ['.js','.json','.wxml']:assert (r/'小程序端/微信开发者工具导入包'/(route+ext)).exists(),route+ext
for target in ['网页端','小程序端']:
 assert not any(p.name.startswith('.env') and p.is_file() for p in (r/target).rglob('*'))
 native=r/'小程序端/微信开发者工具导入包'
 sizes=collections.Counter()
 for p in native.rglob('*'):
  if p.is_file():sizes[p.relative_to(native).parts[0]]+=p.stat().st_size
print('微信包体积（KiB）',dict((k,round(v/1024)) for k,v in sizes.items()),flush=True)
results={}
tests=[('阅读接口','services/reading',['--test','tests/*.test.js']),('导览接口','services/guide/server',['--test','test/*.test.js']),('学习接口','services/学习',['--test','tests/*.test.js']),('模块联动','',['tools/检查本轮修复.mjs']),('登录与学习权限','',['tools/检查学习合并.mjs'])]
for name,folder,args in tests:
 print('验证',name,flush=True)
 result=subprocess.run([str(node),*args],cwd=r/folder,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 text=result.stdout.decode('utf-8',errors='replace');(r/'docs'/('合并测试-'+name+'.log')).write_text(text,encoding='utf-8')
 results[name]=result.returncode==0;print(text[-1600:],flush=True)
 if result.returncode:print('检查失败：'+name)
result={'records':390,'provinceCountsSum':sum(counts.values()),'regions':34,'pages':27,'tabs':5,'reviewStatusPreserved':True,'privateEnvCopied':False,'testResults':results,'nativeTotalBytes':sum(sizes.values()),'deviceTest':False}
(r/'docs/合并交付检查.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
assert all(results.values())
