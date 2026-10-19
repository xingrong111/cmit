from pathlib import Path
exec((Path(__file__).parent/'检查合并页面.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
for width in [1440,390]:
 size(width);nav('assistant/index');call('Page.reload');time.sleep(1)
 wait("document.querySelector('.assistant-flow')&&document.querySelector('iframe')?.contentDocument?.querySelector('.assistant-starts')")
 # 独立前端演练数据，不发送模型请求、不改服务器或用户资料。
 js("document.querySelector('iframe').contentWindow.eval(\"state.messages=[{role:'user',text:'测试页面滚动'},{role:'assistant',text:Array(16).fill('这是一段用于检查长回答排版的演练文字。').join('\\\\n')}];state.followUps=['继续了解人物','看看文化路线'];assistant();\")")
 time.sleep(.5)
 result=js("(()=>{const f=document.querySelector('iframe'),d=f.contentDocument,c=d.querySelector('.conversation');return {height:c.clientHeight,overflow:d.defaultView.getComputedStyle(c).overflowY,frame:f.clientHeight,content:d.body.getBoundingClientRect().height,horizontal:d.documentElement.scrollWidth>d.defaultView.innerWidth}})()")
 print(width,result);assert result['height']>=330;assert result['overflow']=='visible';assert not result['horizontal']
 for i in range(12):
  call('Input.dispatchMouseEvent',{'type':'mouseWheel','x':width-60,'y':650,'deltaX':0,'deltaY':400});time.sleep(.1)
 assert js("(()=>{const f=document.querySelector('iframe'),r=f.contentDocument.querySelector('.composer').getBoundingClientRect();return r.bottom+f.getBoundingClientRect().top<=innerHeight+2})()"),'整页滚动后可到达输入框'
 shot('小迹长回答滚动修复-'+str(width)+'.png')
 for i in range(16):
  call('Input.dispatchMouseEvent',{'type':'mouseWheel','x':width-60,'y':650,'deltaX':0,'deltaY':-400});time.sleep(.08)
 assert js("document.querySelector('.page-return').getBoundingClientRect().top>=0")
print('通过：独立长回答演练，双尺寸整页上下滚动、输入框可达、对话不截断。');ws.close()
