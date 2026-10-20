from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
for width in [1440,390]:
 size(width);nav('radar/index');call('Page.reload');time.sleep(1)
 wait("document.querySelector('iframe')?.contentDocument?.querySelector('#places article')")
 time.sleep(.5)
 for i in range(16):
  call('Input.dispatchMouseEvent',{'type':'mouseWheel','x':width-65,'y':650,'deltaX':0,'deltaY':450});time.sleep(.12)
 result=js("(()=>{const f=document.querySelector('iframe'),d=f.contentDocument,c=d.querySelector('#places article:last-child'),r=c.getBoundingClientRect(),fr=f.getBoundingClientRect();return {inner:f.contentWindow.scrollY,lastBottom:r.bottom+fr.top,viewport:innerHeight,frame:f.clientHeight,content:d.body.getBoundingClientRect().height}})()")
 print(width,result)
 assert result['inner']==0,'不能出现第二层滚动'
 assert result['lastBottom']<=result['viewport']+5,'最后一张卡片应完整可见'
 shot('卡片滚动修复-'+str(width)+'.png')
 for i in range(18):
  call('Input.dispatchMouseEvent',{'type':'mouseWheel','x':width-65,'y':650,'deltaX':0,'deltaY':-450});time.sleep(.08)
 assert js("document.querySelector('.page-return').getBoundingClientRect().top>=0"),'能够向上滚回页头'
print('通过：桌面、手机宽度滚到底完整显示最后卡片，并可滚回顶部。');ws.close()
