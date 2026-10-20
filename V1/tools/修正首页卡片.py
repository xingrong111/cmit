from pathlib import Path
r=Path(__file__).resolve().parents[1]/'frontend/src'
p=r/'pages/home/index.vue';s=p.read_text(encoding='utf-8').replace('class="featured-grid"','class="featured-grid people-grid"').replace(' :featured="i===0"','').replace('<text>一</text><text>九</text><text>一</text><text>六</text>','<text>山</text><text>河</text><text>长</text><text>卷</text>');p.write_text(s,encoding='utf-8')
