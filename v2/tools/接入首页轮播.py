from pathlib import Path
r=Path(__file__).resolve().parents[1]
p=r/'frontend/src/pages/home/index.vue';s=p.read_text(encoding='utf-8')
if '<HomeCarousel/>' not in s:
 start=s.index('<view class="home-hero">');end=s.index('<view class="opening-strip">',start)
 s=s[:start]+'<HomeCarousel/>'+s[end:]
 s=s.replace("import {ref} from 'vue';","import {ref} from 'vue';import HomeCarousel from '../../components/首页轮播.vue';")
 p.write_text(s,encoding='utf-8')
# 轮播取代旧卷首，删除本轮已不再使用的旧样式，控制微信包体。
p=r/'frontend/src/styles/页面精修.css';s=p.read_text(encoding='utf-8')
start=s.find('.home-hero{min-height:430px');end=s.find('@media(prefers-reduced-motion:reduce)',start)
if start>=0 and end>start:p.write_text(s[:start]+s[end:],encoding='utf-8')
