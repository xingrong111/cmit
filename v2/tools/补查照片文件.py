exec(open(__file__.replace('补查照片文件.py','检索人物照片.py'),encoding='utf-8').read().split('names=')[0])
titles=['Qijunzi.jpg','Qin Bangxian.jpg','被上海⽇本纱⼚资本家枪杀的共产党员顾正红烈⼠肖像照⽚.jpg','Jiang Zhuyun.jpg','江竹筠.jpg','Zhou Enlai 1927.jpg','恽代英.jpg']
d=get({'titles':'|'.join('File:'+s for s in titles),'prop':'imageinfo','iiprop':'url|extmetadata'})
(out/'补查文件记录.json').write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
for p in d.get('query',{}).get('pages',{}).values():
 if not p.get('imageinfo'):print(p['title'],'未找到');continue
 m=p['imageinfo'][0]['extmetadata'];clean=lambda k:re.sub('<[^>]+>',' ',m.get(k,{}).get('value',''))[:450]
 print(p['title'],clean('LicenseShortName'),clean('ImageDescription'),clean('Credit'))
