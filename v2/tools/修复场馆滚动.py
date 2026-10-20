from pathlib import Path
p=Path('V1/frontend/src/pages/radar/index.vue');s=p.read_text(encoding='utf-8')
s=s.replace('<view class="module-frame">','<view class="module-frame radar-frame" :style="{height:frameHeight}">',1).replace('ref="frame" :src="url"','ref="frame" :src="url" @load="fitFrame" scrolling="no"',1)
s=s.replace("import {ref} from 'vue'","import {ref,onBeforeUnmount} from 'vue'")
s=s.replace("const frame=ref(null);",'''const frame=ref(null);const frameHeight=ref('900px');let frameObserver=null;
function fitFrame(){
 // #ifdef H5
 frameObserver?.disconnect();const el=frame.value,d=el?.contentDocument;if(!d?.body)return;
 d.documentElement.style.overflow='hidden';d.body.style.overflow='hidden';
 const resize=()=>{const height=Math.ceil(d.body.getBoundingClientRect().height)+4;if(height>0&&frameHeight.value!==height+'px')frameHeight.value=height+'px'};
 frameObserver=new ResizeObserver(resize);frameObserver.observe(d.body);resize();
 // #endif
}
onBeforeUnmount(()=>frameObserver?.disconnect());''')
s=s.replace('.module-frame{width:100%;height:calc(100vh - 170px)}','.module-frame{width:100%;height:calc(100vh - 170px)}.module-frame.radar-frame{min-height:400px}')
p.write_text(s,encoding='utf-8')
