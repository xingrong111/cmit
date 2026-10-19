from pathlib import Path
css='''
/* 足迹页采用单一页面滚动，覆盖嵌入聊天模块的定高容器。 */
html body uni-app uni-page:has(.radar-frame),html body uni-page uni-page-wrapper:has(.radar-frame),html body uni-page-wrapper uni-page-body:has(.radar-frame){height:auto!important;min-height:100dvh!important;overflow:visible!important}
html body .app-shell:has(.radar-frame){height:auto!important;overflow:visible!important;display:block}
'''
p=Path('V1/frontend/src/styles/合并视觉.css');p.write_text(p.read_text(encoding='utf-8')+css,encoding='utf-8')
p=next(Path('V1/frontend/dist/build/h5/assets').glob('index-BOZmKpeJ.css'));p.write_text(p.read_text(encoding='utf-8')+css,encoding='utf-8')
