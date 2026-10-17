from pathlib import Path
import zipfile,xml.etree.ElementTree as E,json,re,sys
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).resolve().parents[2];out=root/'V1/docs/资料更新-20261017';out.mkdir(exist_ok=True)
z=zipfile.ZipFile(root/'籍贯补充40条.xlsx');ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
strings=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns)]
sheets={}
for f in ['xl/worksheets/sheet1.xml','xl/worksheets/sheet2.xml']:
 rows=[]
 for row in E.fromstring(z.read(f)).findall('.//m:sheetData/m:row',ns):
  cells={}
  for c in row.findall('m:c',ns):
   v=c.find('m:v',ns);text=v.text if v is not None else ''.join(c.find('m:is',ns).itertext()) if c.find('m:is',ns) is not None else ''
   if c.get('t')=='s':text=strings[int(text)]
   cells[c.get('r')]=text
  rows.append(cells)
 sheets[f]=rows
zipdata={}
with zipfile.ZipFile(root/'回填结果.zip') as z:
 for f in z.namelist():
  if not f.endswith('.md'):continue
  b=z.read(f)
  try:t=b.decode('utf-8-sig')
  except UnicodeDecodeError:t=b.decode('gb18030')
  zipdata[f]=t
(out/'原始回填提取.json').write_text(json.dumps({'excel':sheets,'zip':zipdata},ensure_ascii=False,indent=2),encoding='utf-8')
print('EXCEL',json.dumps(sheets,ensure_ascii=False))
for f,t in zipdata.items():
 print('\n###',f,'\n',t[:3800] if len(zipdata)<5 else '\n'.join(t.splitlines()[:22]))
