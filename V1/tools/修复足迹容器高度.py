from pathlib import Path
p=Path('V1/frontend/src/pages/radar/index.vue');s=p.read_text(encoding='utf-8').replace(':style="{height:frameHeight}"',':style="\'height:\'+frameHeight+\'!important\'"');s+='''
<style>
/* 足迹使用页面单一滚动，不继承聊天模块的整屏裁切布局。 */
uni-page:has(.radar-frame),uni-page-wrapper:has(.radar-frame),uni-page-body:has(.radar-frame){height:auto!important;min-height:100dvh!important;overflow:visible!important}
.app-shell:has(.radar-frame){height:auto!important;min-height:100dvh;overflow:visible!important;display:block}
.app-shell:has(.radar-frame) .shell-body{height:auto;overflow:visible;min-height:0}
.app-shell:has(.radar-frame) .page-return{margin-bottom:14px}
</style>
''';p.write_text(s,encoding='utf-8')
