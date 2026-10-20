from pathlib import Path
p=Path('V1/frontend/src/pages/me/index.vue');s=p.read_text(encoding='utf-8').replace('<AppShell><view class="page-heading">','<AppShell><view class="my-space"><view class="my-cover"><image class="my-cover-art" src="/static/landscape.svg" mode="aspectFill"/><view class="page-heading">',1)
s=s.replace('</view><view class="account-overview">','</view><text class="my-cover-seal">阅过山河</text></view><view class="my-reading-stats"><view><text class="my-stat-number">{{saved.length}}</text><text>珍藏书签</text></view><view><text class="my-stat-number">{{recent.length}}</text><text>最近阅读</text></view><view><text class="my-stat-number my-stat-word">{{size===\'large\'?\'大字\':\'标准\'}}</text><text>阅读字号</text></view></view><view class="account-overview">',1)
s=s.replace('阅读有记录，学习有回响','继续你的山河之旅').replace('账户管理 ↗','管理账户').replace('<view class="empty-paper"><text','<view class="empty-paper"><image class="empty-bookmark-icon" src="/static/icons/bookmark.png" mode="aspectFit"/><text',1).replace('</view></view></AppShell>','</view></view></view></AppShell>')
p.write_text(s,encoding='utf-8')
p=Path('V1/frontend/src/pages/learning/index.vue');s=p.read_text(encoding='utf-8').replace('<view class="module-frame">','<view class="module-frame learning-flow" :style="\'height:\'+frameHeight+\'!important\'">',1).replace('ref="frame" :src="url"','ref="frame" :src="url" @load="fitFrame" scrolling="no"',1).replace("import {ref} from 'vue'","import {ref,onBeforeUnmount} from 'vue'")
fit=Path('V1/frontend/src/pages/assistant/index.vue').read_text(encoding='utf-8').split("const frameHeight=ref('1000px');",1)[1].split("const url=ref",1)[0]
# 学习脚本frame和url为同一声明，保持各自路由和账户刷新逻辑。
s=s.replace("const frame=ref(null),url=ref", "const frame=ref(null);const frameHeight=ref('1000px');"+fit+"const url=ref",1)
p.write_text(s,encoding='utf-8')
p=Path('V1/frontend/src/App.vue');s=p.read_text(encoding='utf-8').replace("@import './styles/时间长卷.css';","@import './styles/时间长卷.css';\n@import './styles/个人与学习.css';");p.write_text(s,encoding='utf-8')
p=Path('V1/services/学习/public/app.js');s=p.read_text(encoding='utf-8').replace('<p class="eyebrow">学习与探索 · 待核验</p><h1>', '<section class="learning-cover"><span class="learning-cover-seal" aria-hidden="true">学以<br>知史</span><p class="eyebrow">山河有迹 · 学习与探索</p><h1>').replace('${title}</h1>${!localStorage','${title}</h1><p class="learning-cover-sub">循人物故事，读时代篇章。</p></section>${!localStorage',1)
s=s.replace('<span class="honor-mark" aria-hidden="true"><img src="/static/icons/people.png" alt=""/></span>','<span class="honor-mark" aria-hidden="true">${escape(group.name.slice(0,1))}</span>')
s=s.replace('<section class="card"><h2>挑战进度</h2>','<section class="card learning-progress"><h2>挑战进度</h2>',1)
s=s.replace('<div class="challenge-grid">','<div class="learning-section-title"><span>人物主题挑战</span><small>读档案 · 做挑战 · 看依据</small></div><div class="challenge-grid">',1)
p.write_text(s,encoding='utf-8')
