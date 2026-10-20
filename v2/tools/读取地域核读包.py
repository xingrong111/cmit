from pathlib import Path,PurePosixPath
import zipfile,json
source=Path('D:/xwechat_files/wxid_wr1zoj0wew6m22_93da/msg/file/2026-10/第一组地域搜集-85条-20261016-原件核读.zip')
out=Path(__file__).resolve().parents[1]/'docs/地域回填-20261018/原始附件';out.mkdir(parents=True,exist_ok=True)
for item in zipfile.ZipFile(source).infolist():
 name=item.filename
 if not item.flag_bits&0x800:
  try:name=name.encode('cp437').decode('gb18030')
  except (UnicodeError,LookupError):pass
 rel=PurePosixPath(name)
 if rel.is_absolute() or '..' in rel.parts:raise ValueError('不安全路径')
 if item.is_dir():continue
 target=out.joinpath(*rel.parts);target.parent.mkdir(parents=True,exist_ok=True)
 target.write_bytes(zipfile.ZipFile(source).read(item))
print(out)
for p in out.rglob('*'):
 if p.name in ['校对说明.md','原件核查报告.md','最终未补全清单.json','省份归属规则与全国口径说明.json','统计与自检.json','回填表-85条.json']:
  print('\n###',p.name,'\n',p.read_text(encoding='utf-8-sig')[:16000])
