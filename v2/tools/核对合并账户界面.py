from pathlib import Path
import time,json,sys
exec(Path('E:/CMIT/v2/tools/核对地图与场馆封面.py').read_text(encoding='utf-8').split("call('Page.enable')")[0].replace('9246','9249').replace('docs/地图与场馆封面核对','docs/邮箱注册核对'))
call('Page.enable');call('Runtime.enable');call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True});width=int(sys.argv[1]) if len(sys.argv)>1 else 1440
call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False});call('Page.navigate',{'url':(sys.argv[2] if len(sys.argv)>2 else 'http://127.0.0.1:3210')+'/#/pages/me/index'});wait("document.querySelector('.my-account-section')");time.sleep(.5)
assert not js("document.querySelector('.nav-auth-entry')")
js("[...document.querySelectorAll('.account-tabs uni-button')].find(x=>x.innerText==='邮箱注册').click()")
wait("document.querySelector('.code-field')");js("document.querySelector('#my-account').scrollIntoView({block:'start'})")
info=js("(()=>{const p=document.querySelector('.my-account-section');return {embeddedForms:p.querySelectorAll('iframe').length,inputs:p.querySelectorAll('uni-input').length,verificationField:Boolean(p.querySelector('.code-field')),overflow:document.documentElement.scrollWidth>innerWidth}})()")
assert info['embeddedForms']==0 and info['inputs']==5 and not info['overflow'],info
shot('合并注册-'+str(width));(out/('界面-'+str(width)+'.json')).write_text(json.dumps(info,indent=2));print(info);ws.close()
