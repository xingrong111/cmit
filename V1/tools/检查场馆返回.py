from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
def child(code):return "(()=>{const d=document.querySelector('iframe').contentDocument;return "+code+"})()"
size(1440);nav('radar/index');call('Page.reload');time.sleep(1)
wait(child("d.querySelector('#places [data-action=place]')"))
js(child("d.querySelector('#places [data-action=place]').click()"))
wait(child("d.querySelector('.venue-return')&&d.querySelector('.detail-dock')"))
js(child("d.querySelector('.venue-return').click()"))
wait(child("d.querySelector('.web-radar-layout')"))
assert js(child("!!d.querySelector('#places [data-action=place]')"))
shot('场馆卡片与返回-1440.png')
print('通过：雷达进入地点详情，显式返回恢复场馆列表。')
ws.close()
