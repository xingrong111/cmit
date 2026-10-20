from pathlib import Path
import json,urllib.request,hashlib
out=Path(r'E:\CMIT\AIassistance\docs\地点资料核对包-20261011');p=out/'04-图片许可/开放许可图片记录.json';items=json.loads(p.read_text(encoding='utf-8'))
i=dict(items[1]);i.update(id='IMG-OPEN-QBC-EXTERIOR',title='Former Residence of Qin Bangxian.jpg',place='秦邦宪故居',author='Huangchenhai',capturedAt='2017-04-03',originalPage='https://commons.wikimedia.org/wiki/File:Former_Residence_of_Qin_Bangxian.jpg',finalPage='https://commons.wikimedia.org/wiki/File:Former_Residence_of_Qin_Bangxian.jpg',assetURL='https://upload.wikimedia.org/wikipedia/commons/e/ed/Former_Residence_of_Qin_Bangxian.jpg',identityStatus='描述页标为秦邦宪故居入口，待视觉查看及第二人复核',credit='Former Residence of Qin Bangxian.jpg — Huangchenhai，CC BY-SA 4.0；原文件及许可链接见记录。未修改。',localFile=None,downloadStatus='待下载')
i.pop('sha256',None);i.pop('finalAssetURL',None)
try:
 with urllib.request.urlopen(urllib.request.Request(i['assetURL'],headers={'User-Agent':'YingjiResearch/1.0'}),timeout=20) as r:b=r.read();i['finalAssetURL']=r.url
 if not b.startswith(b'\xff\xd8'):raise ValueError('not JPEG')
 name=i['id']+'.jpg';(out/'04-图片许可'/name).write_bytes(b);i.update(localFile=name,downloadStatus='原文件已保存',sha256=hashlib.sha256(b).hexdigest())
except Exception as e:i['downloadStatus']='本轮未取得图像文件：'+type(e).__name__
items.append(i);p.write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf-8')
print(i['downloadStatus'])
