from pathlib import Path
p=Path(__file__).resolve().parents[1]/'frontend/src/pages/province/index.vue'
s=p.read_text(encoding='utf-8').replace('ref,computed','ref,computed,onMounted,onBeforeUnmount').replace('import {onLoad}','import {onLoad,onShow}')
s=s.replace('function select(e)', '''// #ifdef H5
function syncRegion(){if(!location.hash.includes('/pages/province/index'))return;const v=new URLSearchParams(location.hash.split('?')[1]||'').get('code')||'';if(options.some(p=>p.code===v)){code.value=v;query.value=''}}
onMounted(()=>window.addEventListener('hashchange',syncRegion));onBeforeUnmount(()=>window.removeEventListener('hashchange',syncRegion));onShow(syncRegion)
// #endif
function select(e)''')
p.write_text(s,encoding='utf-8')
