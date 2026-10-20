from pathlib import Path
p=Path(__file__).parent/'检查合并交付.py';s=p.read_text(encoding='utf-8-sig').replace("data/全国收录.json","data/合并人物目录.json").replace('len(data)==119','len(data)==390').replace("for p in data})==119","for p in data})==390").replace("p['provinceCode'] in codes","p['provinceCode'] in codes or not p['provinceCode']").replace("if p['type']=='人物'","if p['provinceCode']").replace('sum(counts.values())==119','sum(counts.values())==170').replace("'records':119","'records':390")
p.write_text(s,encoding='utf-8')
