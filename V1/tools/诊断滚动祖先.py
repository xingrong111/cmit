from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
nav('radar/index');time.sleep(1)
print(js("(()=>{let n=document.querySelector('iframe'),a=[];while(n){let s=getComputedStyle(n);a.push({tag:n.tagName,cls:n.className,h:n.clientHeight,scroll:n.scrollHeight,overflow:s.overflow,height:s.height});n=n.parentElement}return a})()"))
ws.close()
