from pathlib import Path
import json
r=Path(__file__).resolve().parents[1]
p=r/'frontend/src/components/PersonPortrait.vue';s=p.read_text(encoding='utf-8')
if 'preferIP' not in s:
 s=s.replace(":src=\"ready?asset.src:art.src\"",":src=\"ready&&!preferIP?asset.src:art.src\"").replace(":aria-label=\"ready?asset.caption:art.caption\"",":aria-label=\"ready&&!preferIP?asset.caption:art.caption\"")
 s=s.replace('<button v-if="ready||artReady" class="portrait-credit"', '<button v-if="ready&amp;&amp;artReady" class="portrait-mode" @tap.stop="preferIP=!preferIP">{{preferIP?\'看史料照\':\'看IP形象\'}}</button><text v-if="ready&amp;&amp;!preferIP&amp;&amp;asset.shortCaption" class="portrait-photo-caption">{{asset.shortCaption}}</text><button v-if="ready||artReady" class="portrait-credit"').replace('&amp;&amp;','&&')
 s=s.replace("{{ready?'图注与来源 ↗':'艺术化IP · 设计说明 ↗'}}","{{ready&&!preferIP?'史料照片 · 图注来源 ↗':'艺术化IP · 设计说明 ↗'}}")
 s=s.replace("const failed=ref(false);","const failed=ref(false);const preferIP=ref(false);")
 s=s.replace("watch(()=>props.personId,()=>failed.value=false)","watch(()=>props.personId,()=>{failed.value=false;preferIP.value=false})")
 s=s.replace("const src=ready.value?asset.value.src:art.value.src", "const src=ready.value&&!preferIP.value?asset.value.src:art.value.src")
 s=s.replace("if(!ready.value){uni.showModal", "if(!ready.value||preferIP.value){uni.showModal")
 s+='''\n<style>.portrait-mode{position:absolute;top:14px;right:14px;z-index:3;background:#fffaf1ed;border:1px solid #bd9a67;border-radius:18px;min-height:30px;padding:5px 10px;font-size:10px;line-height:1.4;display:flex;align-items:center;justify-content:center;color:#982b28;margin:0}.portrait-photo-caption{position:absolute;left:16px;right:16px;bottom:48px;font-size:10px;text-align:center;background:#fffaf1e8;color:#75604b;padding:4px 6px;border-radius:5px;z-index:2}</style>\n'''
 p.write_text(s,encoding='utf-8')
p=r/'frontend/src/data/人物肖像.json';d=json.loads(p.read_text(encoding='utf-8'));d['P002']['shortCaption']='七君子合影 · 史良为左起第二人';p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
