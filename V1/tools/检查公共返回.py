from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
nav('person/index?id=P002');call('Page.reload');time.sleep(1)
wait("document.querySelector('.page-return uni-button')")
js("document.querySelector('.page-return uni-button').click()")
wait("location.hash.includes('/pages/people/index')")
print('通过：直接打开人物页，返回入口兜底到人物索引。')
ws.close()
