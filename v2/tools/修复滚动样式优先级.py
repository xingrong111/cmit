from pathlib import Path
p=Path('V1/frontend/src/pages/radar/index.vue');s=p.read_text(encoding='utf-8').replace('uni-page:has(.radar-frame),uni-page-wrapper:has(.radar-frame),uni-page-body:has(.radar-frame)', 'html body uni-app uni-page:has(.radar-frame),html body uni-page uni-page-wrapper:has(.radar-frame),html body uni-page-wrapper uni-page-body:has(.radar-frame)');p.write_text(s,encoding='utf-8')
# 同步本轮已构建的同一条CSS规则，随后整理双端；源码与产物保持一致。
for p in Path('V1/frontend/dist/build/h5').rglob('*.css'):
 s=p.read_text(encoding='utf-8');new=s.replace('uni-page:has(.radar-frame),uni-page-wrapper:has(.radar-frame),uni-page-body:has(.radar-frame)','html body uni-app uni-page:has(.radar-frame),html body uni-page uni-page-wrapper:has(.radar-frame),html body uni-page-wrapper uni-page-body:has(.radar-frame)')
 if new!=s:p.write_text(new,encoding='utf-8')
