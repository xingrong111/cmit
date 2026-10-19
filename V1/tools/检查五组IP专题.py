from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
results=[]
for width in [1366,390]:
 size(width)
 for group,name in [('QQB','瞿秋白'),('SZZ','宋振中'),('LDY','陆定一'),('JZY','江竹筠'),('LYS','狼牙山五壮士')]:
  nav('ip/index?group='+group);wait("document.querySelector('#ip-intro')")
  if group in ['QQB','SZZ','LDY']:wait("!document.body.innerText.includes('正在加载')")
  assert js("document.body.innerText.includes('"+name+"的时代片段')"),(group,'name')
  assert js('document.documentElement.scrollWidth<='+str(width)),(group,width,'overflow')
  assert js("!!document.querySelector('.page-return')"),(group,'return')
  if group in ['QQB','JZY','LYS']:
   wait("document.querySelector('iframe')?.contentDocument?.querySelector('canvas')")
   assert js("document.querySelector('iframe').getBoundingClientRect().top<450"),(group,'scene position')
  else:assert js("!!document.querySelector('.ip-stage-image')&&!document.querySelector('iframe')")
  assert js("document.body.innerText.includes('史料摘读')&&document.body.innerText.includes('学习挑战')")
  if group in ['JZY','LYS','LDY']:shot('IP专题-'+group+'-'+str(width)+'.png')
  results.append({'group':group,'width':width,'passed':True})
nav('people/index');wait("document.querySelector('.directory-segments')")
js("[...document.querySelectorAll('.directory-segments uni-button')].find(b=>b.textContent.includes('IP专项')).click()")
wait("document.querySelectorAll('.ip-topic').length===5")
assert js("[...document.querySelectorAll('.ip-topic')].every(c=>c.textContent.includes('走进人物'))")
js("document.querySelectorAll('.ip-topic')[1].querySelector('uni-button').click()")
wait("location.hash.includes('group=LYS')")
print('五组专题桌面/手机布局、三组顶部场景、资料来源及索引入口通过')
(r/'docs/IP专题页面检查.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');ws.close()
