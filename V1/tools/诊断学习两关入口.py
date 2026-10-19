from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
nav('learning/index');call('Page.reload');time.sleep(2)
print(js("({hash:location.hash,frame:document.querySelector('iframe')?.src,text:document.querySelector('iframe')?.contentDocument?.body.innerText.slice(-1000),assets:document.querySelector('iframe')?.contentDocument?.querySelectorAll('.journey-learning-card').length})"));ws.close()
