"""本地预览交互及截图检查：需要Python websocket-client、Microsoft Edge。"""
from pathlib import Path
import subprocess, json, time, urllib.request, websocket, base64, socket
ROOT = Path(__file__).resolve().parent.parent
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
base = f'http://127.0.0.1:{port}'
import os
env = dict(os.environ, PORT=str(port), PUBLIC_MODE='false', MODEL_API_KEY='', TENCENT_MAP_KEY='')
server = subprocess.Popen(['node', 'src/server.js'], cwd=ROOT/'server', env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
browser = None; ws = None; results = []; errors = []
try:
    for _ in range(60):
        try:
            urllib.request.urlopen(base+'/health', timeout=1); break
        except Exception: time.sleep(.1)
    browser = subprocess.Popen([EDGE,'--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9245','--remote-allow-origins=*','--user-data-dir='+str(ROOT/'preview'/'browser-profile'),base], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    for _ in range(60):
        try:
            targets = json.loads(urllib.request.urlopen('http://127.0.0.1:9245/json', timeout=1).read())
            target = next(t for t in targets if t.get('type')=='page' and base in t.get('url',''))
            break
        except Exception: time.sleep(.15)
    ws = websocket.create_connection(target['webSocketDebuggerUrl'], timeout=20)
    seq = 0
    def call(method, params=None):
        global seq
        seq += 1; ws.send(json.dumps(dict(id=seq,method=method,params=params or {})))
        while True:
            msg = json.loads(ws.recv())
            if msg.get('method')=='Runtime.exceptionThrown': errors.append(msg['params'])
            if msg.get('id')==seq:
                assert 'error' not in msg, msg
                return msg.get('result',{})
    def ev(code):
        r=call('Runtime.evaluate',dict(expression=code,returnByValue=True,awaitPromise=True))
        assert 'exceptionDetails' not in r,r
        return r.get('result',{}).get('value')
    def wait(code):
        for _ in range(80):
            if ev(code): return
            time.sleep(.1)
        raise AssertionError('页面等待失败: '+code)
    def check(name, code):
        assert ev(code), name
        results.append(dict(check=name,passed=True))
    def shot(name):
        out=ROOT/'preview'/'images';out.mkdir(exist_ok=True)
        ev("document.querySelector('.place-mini')?.scrollIntoView({block:'center'})" if name=='05-助手地点建议.png' else 'window.scrollTo(0,0)')
        result=call('Page.captureScreenshot',dict(format='png',captureBeyondViewport=False))
        (out/name).write_bytes(base64.b64decode(result['data']))
    call('Runtime.enable');call('Page.enable')
    call('Emulation.setDeviceMetricsOverride',dict(width=430,height=920,deviceScaleFactor=1,mobile=True))
    wait("document.querySelector('#ask')!==null")
    wait("document.querySelector('.guide-character')?.complete===true && document.querySelector('.guide-character').naturalWidth>0")
    check('原创导览员图像加载且AI标识可见',"document.querySelector('.guide-character').naturalWidth===1024 && document.querySelector('.guide-welcome').textContent.includes('AI生成形象')")
    ev("document.querySelector('[data-action=motion]').click()")
    check('暂停动效停止角色动画',"getComputedStyle(document.querySelector('.guide-character')).animationName==='none'")
    ev("document.querySelector('[data-action=motion]').click()")
    check('资料试读状态明确',"document.querySelector('#screen').textContent.includes('待独立复核')")
    check('六栏导航与独立目录可用',"document.querySelectorAll('#nav button').length===6 && document.querySelector('.brand').textContent.includes('山河英雄谱')")
    ev("document.querySelector('[data-action=menu]').click()")
    check('模块目录实际展开',"!document.querySelector('#module-menu').hidden")
    ev("document.querySelector('[data-action=menu]').click();document.querySelector('[data-action=scenario][data-value=history]').click();document.querySelector('#person').value='IP-LYS';document.querySelector('#person').dispatchEvent(new Event('change'))")
    check('五组人物选择可用',"state.personId==='IP-LYS' && document.querySelector('#person').options.length===6")
    ev("document.querySelector('#person').value='';document.querySelector('#person').dispatchEvent(new Event('change'))")
    check('人物选择只在史料问答场景显示',"!document.querySelector('.reading-selector').hidden && state.scene==='history'")
    ev("document.querySelector('[data-action=scenario][data-value=guide]').click()")
    check('文化探索场景不强制人物选择',"document.querySelector('.reading-selector').hidden && state.mode==='guide'")
    check('小迹与偏好选择器可见',"document.querySelector('.guide-copy').textContent.includes('小迹') && document.querySelector('#guide-city')!==null")
    shot('01-AI阅读助手.png')
    ev("document.querySelector('#guide-city').value='常州市';document.querySelector('#guide-time').value='1小时';document.querySelector('[data-action=recommend]').click()")
    wait("!state.busy && state.messages.length===2")
    check('偏好选择真实进入导览且返回结构化卡片',"state.guideContext.city==='常州市' && state.guideContext.timeBudget==='1小时' && state.messages.at(-1).presentation.kind==='places' && document.querySelector('.place-mini')!==null")
    ev("document.querySelector('[data-action=reset-guide]').click()")
    ev("state.mode='auto'")
    ev("ask('瞿秋白如何求学？')")
    wait("!state.busy && state.messages.length===2")
    check('回答和提问有复制及修改操作',"document.querySelector('[data-action=copy-message]')!==null && document.querySelector('[data-action=edit-message]')!==null")
    ev("document.querySelector('[data-action=edit-message]').click()")
    check('修改提问恢复原文到输入框',"document.querySelector('#question').value==='瞿秋白如何求学？'")
    check('消息头像与纯图标操作',"document.querySelector('.speaker-line .xiaoj-avatar')!==null && document.querySelector('[data-action=copy-message]').textContent==='' && document.querySelector('[data-action=edit-message]').getAttribute('aria-label')==='修改提问'")
    ev("document.querySelector('[data-message-index=\"1\"]').scrollIntoView({block:'start'})")
    shot('06-小迹对话.png')
    check('开始对话后欢迎形象收起',"document.querySelector('.guide-welcome')===null")
    check('问答读到实际后端与原始出处',"document.querySelector('.conversation').textContent.includes('北京俄文专修馆') && document.querySelector('.source a').href.includes('xinhuanet.com')")
    ev("state.mode='help'; ask('如何使用历史足迹？')")
    wait("!state.busy && state.messages.length===4")
    check('操作导览给出入口',"document.querySelector('.conversation').textContent.includes('打开历史足迹雷达')")
    ev("state.mode='auto';ask('无锡文化路线怎么安排？')")
    wait("!state.busy && state.messages.length===6")
    check('路线导览给出真实地点和可操作入口',"document.querySelector('.conversation').textContent.includes('陆定一祖居陈列馆') && document.querySelector('[data-value=route]')!==null && document.querySelector('[data-action=place][data-value=\"PLACE-WX-LDY\"]')!==null")
    check('助手地点卡可操作且待核入口明确',"document.querySelector('.place-mini').textContent.includes('入口待核验') && state.messages.at(-1).placeCards.length>0")
    shot('05-助手地点建议.png')
    ev("ask('只有一小时，少走一点')")
    wait("!state.busy && state.messages.length===8")
    check('连续追问保留城市并更新时间偏好',"state.guideContext.city==='无锡市' && state.guideContext.timeBudget==='一小时' && state.guideContext.walking==='尽量少步行'")
    ev("document.querySelector('[data-action=reset-guide]').click()")
    check('新导览清除本次需求和对话',"state.messages.length===0 && !state.guideContext.city")
    ev("go('radar')");wait("document.querySelectorAll('#places article').length===3")
    check('城市资料不是伪造GPS',"document.querySelector('#screen').textContent.includes('入口坐标待核验') && !document.querySelector('#screen').textContent.includes('距您')")
    check('地图列表切换与选中地点样式',"document.querySelector('[data-action=view][data-value=list]')!==null && document.querySelector('#places .selected-place')!==null")
    wait("document.querySelector('.theme-map-art').complete")
    check('地图底图资源加载成功',"document.querySelector('.theme-map-art').naturalWidth>0")
    check('主题地图读取真实地点名称并标明示意',"document.querySelectorAll('.theme-map-card .map-pin').length===3 && document.querySelector('.map-caption').textContent.includes('不代表入口坐标')")
    ev("document.querySelector('[data-action=map-zoom][data-value=in]').click()")
    check('地图缩放实际改变图层',"state.mapZoom>1 && document.querySelector('.theme-map-layer').style.transform.includes('1.2')")
    ev("document.querySelector('[data-action=map-zoom][data-value=reset]').click()")
    ev("const viewport=document.querySelector('.theme-map-viewport');viewport.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:100,clientY:100,pointerId:1}));document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:130,clientY:115,pointerId:1}));document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1}));")
    check('示意图支持拖动',"document.querySelector('.theme-map-layer').style.transform.replaceAll(' ','').includes('translate(30px,15px)')")
    shot('02-历史足迹雷达.png')
    ev("document.querySelector('[data-action=add]').click()")
    check('加入路线实际修改选择',"state.stops.length===1")
    ev("place('PLACE-WX-LDY')");wait("document.querySelector('#screen').textContent.includes('老陆巷4号')")
    check('场馆出处与开放未知明确',"document.querySelector('#screen').textContent.includes('开放与预约信息尚未核实') && document.querySelector('.source a').href.includes('wuxi.gov.cn')")
    check('详情主操作固定且证据说明可折叠',"document.querySelector('.detail-dock')!==null && document.querySelector('details.card:not(.source)').open===false")
    shot('03-历史地点详情.png')
    ev("go('route')");wait("document.querySelector('.route-stop')!==null")
    check('路线保留用户选择',"document.querySelector('.route-stop').textContent.includes('陆定一')")
    check('路线页区分编排和导航核验状态',"document.querySelector('#stops').textContent.includes('已选地点 · 入口待核验')")
    check('未核路径不估算步行和总时长',"document.querySelector('#itinerary-summary').textContent.includes('30') && document.querySelectorAll('#itinerary-summary .metric strong')[1].textContent==='—'")
    ev("document.querySelector('.stay').value='45';document.querySelector('.stay').dispatchEvent(new Event('change'));document.querySelector('#budget').value='60';document.querySelector('#budget').dispatchEvent(new Event('change'))")
    check('自定停留预算生效并保存到本机',"document.querySelector('#itinerary-summary').textContent.includes('45') && JSON.parse(localStorage.getItem('yingji-stay-v1'))['PLACE-WX-LDY']===45")
    check('路线地图随所选站点展示且标为顺序示意',"document.querySelector('#route-map-slot .map-pin').textContent.includes('陆定一') && document.querySelector('#route-map-slot .map-caption').textContent.includes('不是道路路径')")
    check('路线计划可复制且不伪造到访',"document.querySelector('[data-action=copy-plan]')!==null && document.querySelector('.plan-summary').textContent.includes('不代表已到访')")
    shot('04-文化路线.png')
    ev("document.querySelector('[data-action=remove]').click()")
    wait("state.stops.length===0 && document.querySelector('#stops').textContent.includes('从一处历史地点开始')")
    check('移除路线地点生效',"state.stops.length===0")
    ev("go('radar'); state.city='常州市'; radar()")
    wait("document.querySelectorAll('#places article').length===2")
    check('切换城市避免错配',"document.querySelector('#places').textContent.includes('瞿秋白纪念馆') && !document.querySelector('#places').textContent.includes('陆定一')")
    check('移动页面无横向溢出',"document.documentElement.scrollWidth<=430")
    assert not errors,errors
    results.append(dict(check='无浏览器运行异常',passed=True))
    (ROOT/'preview'/'交互检查.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    print('PASS:',len(results),'browser checks; 5 screenshots')
finally:
    if ws: ws.close()
    for p in [browser,server]:
        if p:
            p.terminate()
            try: p.wait(timeout=5)
            except subprocess.TimeoutExpired: p.kill()
