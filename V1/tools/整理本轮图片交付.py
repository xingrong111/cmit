from pathlib import Path
import json,zipfile
r=Path(__file__).resolve().parents[1];folder=r/'docs/剩余人物图片核对包'
p=r/'frontend/src/data/人物肖像.json';d=json.loads(p.read_text(encoding='utf-8'));d['P004']['identityEvidence']='文件逐图说明标注宋振中；新华社另有生前照片，两幅图不按同一原片合并，不互相移植日期或图注。拍摄年龄未确认。';p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
data=json.loads((folder/'逐图来源与待核事项.json').read_text(encoding='utf-8'))
for x in data:
 if x['id']=='P004':x['productionNote']='此包为新华社网页版本，仅作核对；成品接入另一个有公有领域标注的Commons文件。两者不按同一原片合并。'
(folder/'逐图来源与待核事项.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
p=r/'docs/人物照片补全/照片接入记录.json';a=json.loads(p.read_text(encoding='utf-8'))
for x in a:
 if x['personId']=='P004':x['identityBasis']=d['P004']['identityEvidence']
p.write_text(json.dumps(a,ensure_ascii=False,indent=2),encoding='utf-8')
(folder/'本轮搜集结果.md').write_text('''# 本轮图片搜集结果

6位的配图文件均已找到并保存。它们不都已经取得公开使用依据。

|人物|搜集到的内容|当前处理|
|---|---|---|
|史砚芬|雨花台烈士陵园人物条目配图|已保存供核对；照片／后绘肖像性质和使用依据待核|
|宋振中|新华社幼年生前照片；另定位Commons文件|保留各自来源，不视为同一原片；成品按Commons文件公有领域标注接入，拍摄日期不推定|
|张应春|江苏省档案馆发布的习刀舞合影，原图注明左一|保留整幅合影；保管单位苏州市吴江区档案馆；使用依据待核|
|许晓轩|中国青年网转载配图，图注“许晓轩像”，新华社发|已保存供核对；原片和公开使用依据待核|
|郭纲琳|新华社报道明确图注的资料照片|已保存供核对，保留水印；使用依据待核|
|钱振标|中红网系列报道中的烈士遗像|已保存供核对，保留水印；仅为补充来源，不冒称官方名录或原始照片档案|

核对入口：图片核对入口.html。每张原图对应逐图来源与待核事项.json中的原始页面、图片地址、最终地址、机构、访问日期及文件SHA-256。

本包仅供团队研究核对，不代表五张待确认图片已经获准进入公开成品。没有移除水印、AI修脸、补色或编造拍摄年份。禁止把图注里的“遗像”“像”自动改成“生前照片”。
''',encoding='utf-8')
z=r/'docs/剩余人物图片核对包.zip'
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as f:
 for item in folder.rglob('*'):
  if item.is_file():f.write(item,Path(folder.name)/item.relative_to(folder))
print('已保存本轮六位配图与逐图来源，压缩包已生成')
