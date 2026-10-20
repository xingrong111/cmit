from pathlib import Path
import subprocess,os,sys,json
sys.stdout.reconfigure(encoding='utf-8')
r=Path(__file__).resolve().parents[1]
node=Path(os.environ['USERPROFILE'])/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
env={**os.environ,'NODE_ENV':'production','FORCE_COLOR':'0'}
results=[]
for platform in ['h5','mp-weixin']:
 args=[str(node),str(r/'frontend/node_modules/@dcloudio/vite-plugin-uni/bin/uni.js'),'build']
 if platform!='h5':args+=['-p',platform]
 print('构建',platform,flush=True)
 result=subprocess.run(args,cwd=r/'frontend',env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 text=result.stdout.decode('utf-8',errors='replace');(r/'docs'/('合并构建-'+platform+'.log')).write_text(text,encoding='utf-8')
 print(text[-4500:],flush=True);results.append({'platform':platform,'exitCode':result.returncode})
 if result.returncode:sys.exit(result.returncode)
for tool in ['组装小程序.py','整理双端.py']:
 result=subprocess.run([sys.executable,str(r/'tools'/tool)],cwd=r,env={**env,'PYTHONIOENCODING':'utf-8'})
 if result.returncode:sys.exit(result.returncode)
(r/'docs/合并构建结果.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
