from pathlib import Path
p=Path('V1/services/guide/web/app.js');s=p.read_text(encoding='utf-8');s=s.replace("const active=state.page==='place'?'radar':state.page;", "const active=state.page==='place'?'radar':state.page;\n  try{if(parent!==window){const back=parent.document.querySelector('.page-return');if(back)back.style.display=state.page==='place'?'none':'';}}catch{}")
s=s.replace("const layout=panel('web-detail-layout',articles);screen.append(layout);", "const layout=panel('web-detail-layout',articles);layout.querySelector('article.card')?.classList.add('venue-story');layout.querySelector('.visit-focus')?.closest('.card')?.classList.add('venue-highlights');screen.append(layout);")
p.write_text(s,encoding='utf-8')
