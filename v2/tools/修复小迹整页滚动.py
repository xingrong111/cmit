from pathlib import Path
p=Path('V1/frontend/src/pages/assistant/index.vue');s=p.read_text(encoding='utf-8').replace('<view class="module-frame">','<view class="module-frame assistant-flow" :style="\'height:\'+frameHeight+\'!important\'">',1).replace('ref="frame" :src="url"','ref="frame" :src="url" @load="fitFrame" scrolling="no"',1).replace("import {ref} from 'vue'","import {ref,onBeforeUnmount} from 'vue'").replace('const frame=ref(null);', '''const frame=ref(null);const frameHeight=ref('1000px');let frameObserver=null;
function fitFrame(){
 // #ifdef H5
 frameObserver?.disconnect();const el=frame.value,d=el?.contentDocument;if(!d?.body)return;d.documentElement.style.overflow='hidden';d.body.style.overflow='hidden';
 const resize=()=>{const height=Math.ceil(d.body.getBoundingClientRect().height)+4;if(height>0&&frameHeight.value!==height+'px')frameHeight.value=height+'px'};
 frameObserver=new ResizeObserver(resize);frameObserver.observe(d.body);resize();
 // #endif
}
onBeforeUnmount(()=>frameObserver?.disconnect());''');p.write_text(s,encoding='utf-8')
p=Path('V1/frontend/src/styles/合并视觉.css');css='''
/* 小迹内容随整页滚动，避免固定窗口挤压回答。 */
html body uni-app uni-page:has(.assistant-flow),html body uni-page uni-page-wrapper:has(.assistant-flow),html body uni-page-wrapper uni-page-body:has(.assistant-flow){height:auto!important;min-height:100dvh!important;overflow:visible!important}
html body .app-shell:has(.assistant-flow){height:auto!important;min-height:100dvh;overflow:visible!important;display:block}
html body .app-shell:has(.assistant-flow) .shell-body{height:auto;overflow:visible}
''';p.write_text(p.read_text(encoding='utf-8')+css,encoding='utf-8')
p=Path('V1/services/guide/web/app.js');s=p.read_text(encoding='utf-8').replace('function fitAssistantViewport(){','function fitAssistantViewport(){\n if(window.frameElement?.parentElement.classList.contains(\'assistant-flow\'))return;');p.write_text(s,encoding='utf-8')
