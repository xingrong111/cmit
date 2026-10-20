from pathlib import Path
r=Path(__file__).resolve().parents[1]/'services/guide/web'
p=r/'index.html';p.write_text(p.read_text(encoding='utf-8').replace('<link rel="stylesheet" href="/web/雷达精修.css">',''),encoding='utf-8')
p=r/'统一视觉.css';s=p.read_text(encoding='utf-8');marker='/* 雷达页面精修 */'
if marker in s:s=s[:s.index(marker)]
p.write_text(s+'\n'+marker+'\n'+(r/'雷达精修.css').read_text(encoding='utf-8'),encoding='utf-8')
