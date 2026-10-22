import json, time, urllib.request, websocket

BASE = 'http://127.0.0.1:9233'
browser_url = json.load(urllib.request.urlopen(BASE + '/json/version'))['webSocketDebuggerUrl']
browser = websocket.create_connection(browser_url, suppress_origin=True, timeout=20)

def send(ws, method, params=None):
    send.counter += 1
    ident = send.counter
    ws.send(json.dumps({'id': ident, 'method': method, 'params': params or {}}))
    while True:
        msg = json.loads(ws.recv())
        if msg.get('id') == ident:
            if 'error' in msg:
                raise RuntimeError(msg['error'])
            return msg.get('result', {})
send.counter = 0

context = send(browser, 'Target.createBrowserContext')['browserContextId']
try:
    target = send(browser, 'Target.createTarget', {
        'url': 'http://127.0.0.1:3210/#/pages/home/index',
        'browserContextId': context,
        'background': True,
    })['targetId']
    for _ in range(30):
        targets = json.load(urllib.request.urlopen(BASE + '/json/list'))
        page = next((x for x in targets if x['id'] == target), None)
        if page:
            break
        time.sleep(.1)
    ws = websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True, timeout=20)
    try:
        send(ws, 'Runtime.enable')
        def evaluate(script):
            result = send(ws, 'Runtime.evaluate', {'expression': script, 'returnByValue': True})
            if 'exceptionDetails' in result:
                raise RuntimeError(result['exceptionDetails'])
            return result.get('result', {}).get('value')
        for _ in range(50):
            if evaluate("!!document.querySelector('.onboard-card')"):
                break
            time.sleep(.2)
        assert evaluate("!!document.querySelector('.onboard-card')"), '新用户未显示三步引导'
        assert evaluate("!!document.querySelector('.xiaoji-root')"), '新用户未显示小迹入口'
        print('全新用户：首页三步引导显示；小迹入口显示。')
        print(evaluate("document.querySelector('.onboard-card').innerText.slice(0,250)"))
        evaluate("document.querySelector('.xiaoji-ball').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0,clientX:1200,clientY:800}))")
        evaluate("window.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,button:0,clientX:1200,clientY:800}))")
        for _ in range(20):
            if evaluate("!!document.querySelector('.xiaoji-window')"):
                break
            time.sleep(.1)
        assert evaluate("!!document.querySelector('.xiaoji-window')"), '小迹弹窗未打开'
        print('小迹悬浮入口可展开；完整对话、收起和发送控件均存在。')
        assert evaluate("!!document.querySelector('.xiaoji-full') && !!document.querySelector('.xiaoji-min') && !!document.querySelector('.xiaoji-send')")
    finally:
        ws.close()
finally:
    send(browser, 'Target.disposeBrowserContext', {'browserContextId': context})
    browser.close()
