"""基础语法检查，不替代微信开发者工具编译与真机测试。"""
from pathlib import Path
import json, subprocess, re, sys
import xml.etree.ElementTree as ET
sys.stdout.reconfigure(encoding='utf-8')
root = Path(__file__).resolve().parents[2]
scripts = list((root/'miniprogram').rglob('*.js')) + list((root/'server').rglob('*.js')) + list((root/'preview').glob('*.js'))
for p in scripts:
    r = subprocess.run(['node','--check',str(p)],capture_output=True,text=True,encoding='utf-8')
    assert r.returncode == 0, (str(p),r.stderr)
jsons = list((root/'miniprogram').rglob('*.json'))
for p in jsons: json.loads(p.read_text(encoding='utf-8-sig'))
wxmls = list((root/'miniprogram').rglob('*.wxml'))
for p in wxmls:
    # WXML允许逻辑&&与布尔属性，归一化后检查标签闭合和引号。
    s = p.read_text(encoding='utf-8').replace('&','&amp;')
    s = re.sub(r'(?<=\s)(wx:else|show-location)(?=[\s/>])',r'\1="true"',s)
    ET.fromstring('<root xmlns:wx="urn:wx">'+s+'</root>')
app = json.loads((root/'miniprogram'/'app.json').read_text(encoding='utf-8'))
for p in app['pages']:
    for suffix in ['.js','.wxml','.json']: assert (root/'miniprogram'/(p+suffix)).exists(),p+suffix
result = {'jsSyntaxFiles':len(scripts),'jsonFiles':len(jsons),'wxmlStructureFiles':len(wxmls),'registeredPages':len(app['pages']),'passed':True,'limitation':'不是微信编译或真机检查'}
(root/'docs'/'静态检查.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
