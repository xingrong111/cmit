from pathlib import Path
exec((Path('E:/CMIT/V1/tools/检查合并页面.py')).read_text(encoding='utf-8-sig').split('results=[]')[0].replace('9227','9228'))
size(1366);nav('registry/index?id=P0180');wait("document.body.innerText.includes('高特')&&document.body.innerText.includes('河北省人')")
assert js("document.body.innerText.includes('彝县')&&document.body.innerText.includes('华北军区烈士陵园')")
nav('registry/index?id=P0196');wait("document.body.innerText.includes('余光奎')&&document.body.innerText.includes('湖南省桑植县')")
nav('registry/index?id=P0207');wait("document.body.innerText.includes('梁重馨')&&document.body.innerText.includes('广西兴业')")
print('网页新地域、字段差异说明、未合并身份候选显示通过');ws.close()
