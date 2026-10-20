from pathlib import Path
p=Path(__file__).resolve().parents[1]/'frontend/src/components/山河地图.vue'
s=p.read_text(encoding='utf-8').replace("const p=[x-rect.left,y-rect.top];const f=", "const p=[x-rect.left,y-rect.top];const label=labelHits.find(a=>Math.abs(a.x-p[0])<=18&&Math.abs(a.y-p[1])<=13);if(label){choose(label.code);return}const f=")
p.write_text(s,encoding='utf-8')
