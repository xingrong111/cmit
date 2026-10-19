from pathlib import Path
import shutil,json,re
root=Path(__file__).resolve().parent;v=root/'V1';site=root/'Sites发布版'
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
dump=lambda p,x:p.write_text(json.dumps(x,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
pub=site/'public';pub.mkdir(exist_ok=True);lib=site/'lib/项目';lib.mkdir(exist_ok=True);data=site/'data';data.mkdir(exist_ok=True)
shutil.copytree(v/'frontend/dist/build/h5',pub,dirs_exist_ok=True)
html=(pub/'index.html').read_text(encoding='utf-8')
html=html.replace('</body>','<a href="/vr/互动故事.html" style="position:fixed;left:14px;bottom:94px;z-index:9999;padding:9px 13px;border:1px solid #bd9a67;background:#fbf5e9ed;color:#982b28;border-radius:24px;font:12px sans-serif;text-decoration:none;box-shadow:0 3px 18px #0001">江姐互动故事 ↗</a></body>')
dump(data/'首页HTML.json',html);(pub/'index.html').unlink()
for src,dst in [(v/'services/account/public',pub/'modules/account'),(v/'services/学习/public',pub/'modules/learning'),(v/'services/guide/web',pub/'web'),(v/'services/guide/preview',pub/'preview'),(v/'services/guide/media',pub/'media')]:
 if src.exists():shutil.copytree(src,dst,dirs_exist_ok=True,ignore=shutil.ignore_patterns('browser-profile','playwright-profile','edge-profile','.env','.env.*','*.log'))
vr=pub/'vr';vr.mkdir(exist_ok=True)
for name in ['场景预览.html','场景样式.css','全景交互.js']:
 t=(v/'江姐VR示例'/name).read_text(encoding='utf-8').replace('http://127.0.0.1:3110/','/')
 (vr/name).write_text(t,encoding='utf-8')
shutil.copytree(v/'江姐VR示例/素材',vr/'素材',dirs_exist_ok=True)
guide=lib/'guide';guide.mkdir(exist_ok=True)
for f in (v/'services/guide/server/src').glob('*.js'):
 if f.name not in ['server.js','poi.js']:shutil.copy2(f,guide/f.name)
for src,name in [(v/'services/guide/server/data/content.json','导览资料.json'),(v/'services/account/topics.json','讨论主题.json'),(v/'services/学习/题库.json','题库.json'),(v/'services/学习/levels.json','关卡.json'),(v/'services/学习/honors.json','荣誉.json')]:shutil.copy2(src,data/name)
t=(v/'services/学习/learn.js').read_text(encoding='utf-8')
start=t.index('function sample(');t=t[start:]
t=t.replace("const levels = options.levels || readJson(path.join(root, 'levels.json'));","const levels = options.levels;")
t=t.replace("const honors = options.honors || readJson(path.join(root, 'honors.json'));","const honors = options.honors;")
t=t.replace("const bankFile = options.questions ? null : readJson(questionBankPath);","const bankFile = null;")
t=t.replace("const storePath = options.storePath || process.env.LEARNING_PROGRESS_PATH || path.join(root, 'data', 'progress.json');","const storePath = ''; ")
t=t.replace('const persistEnabled = options.persist !== false;','const persistEnabled = false;')
t=t.replace('let store = emptyStore();','let store = options.initialStore || emptyStore();')
t=t.replace('return {\n    levels(learnerIdValue)', 'return {\n    snapshot:()=>store,\n    levels(learnerIdValue)')
t=t.replace('module.exports = { createLearning };','export { createLearning };')
prefix="const learnerIdPattern=/^[A-Za-z0-9_-]{8,160}$/;\nconst crypto={randomUUID:()=>globalThis.crypto.randomUUID(),randomInt:(bound)=>{const max=4294967296-4294967296%bound;let n;do{n=globalThis.crypto.getRandomValues(new Uint32Array(1))[0]}while(n>=max);return n%bound;}};\n"
(lib/'学习逻辑.js').write_text(prefix+t,encoding='utf-8')
# 线上沿用Sites身份服务，不发布本机演示密码或创建第二套密码系统。
p=pub/'modules/account/app.js';t=p.read_text(encoding='utf-8');a=t.index('function login()');b=t.index('async function me()',a)
replacement="""function login(){layout('登录','线上使用ChatGPT身份验证',`<section class="card"><div class="eyebrow">山河有迹 · 线上账户</div><h2>继续你的学习</h2><p class="muted">阅读公开资料无需登录。登录后可保存挑战进度、提交评论；评论审核通过后公开。线上账户与本机演示账户分别保存。</p><a class="primary full" href="/signin-with-chatgpt?return_to=%2F%23%2Fpages%2Faccount%2Findex" target="_top">使用ChatGPT登录</a><p class="notice">无需在本站输入或保存密码。管理员权限由服务端指定，普通登录不授予管理员。</p></section>`,false)}\nfunction register(){login()}\n"""
t=t[:a]+replacement+t[b:]
t=t.replace("state.user = data.user;if(data.user?.id)","state.user = data.user;if(data.user){state.token='sites';localStorage.setItem('yingji_token','sites')}else{state.token='';localStorage.removeItem('yingji_token')}if(data.user?.id)")
t=re.sub(r"document.querySelector\('#logout'\).onclick = async \(\) => .*?;\s*\n", "document.querySelector('#logout').onclick=()=>{window.top.location.href='/signout-with-chatgpt?return_to=%2F'};\n",t)
t=t.replace('普通账户注册、登录','线上身份登录').replace('普通注册不会获得审核入口','普通登录不会获得审核入口')
p.write_text(t,encoding='utf-8')
manifest=load(site/'.openai/hosting.json');manifest['d1']='DB';manifest['r2']=None;dump(site/'.openai/hosting.json',manifest)
# 删除模板占位页面，首页由根路由返回现有完整应用。
if (site/'app/page.tsx').exists():(site/'app/page.tsx').unlink()
p=site/'app/layout.tsx';t=p.read_text(encoding='utf-8').replace('Starter Project','山河有迹').replace('A clean starting point for building your site.','循迹读人，探索革命历史与文化足迹。').replace('lang="en"','lang="zh-CN"');t=re.sub(r'  other: \{.*?\},\n','',t,flags=re.S);p.write_text(t,encoding='utf-8')
print('现有网页、模块页面、导览纯逻辑与全景已准备；未复制本机账户、学习记录或密钥。')
