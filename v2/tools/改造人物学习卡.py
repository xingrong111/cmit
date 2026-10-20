from pathlib import Path
import json
r=Path('V1');portraits=json.loads((r/'frontend/src/data/人物肖像.json').read_text(encoding='utf-8'));art=json.loads((r/'frontend/src/data/IP形象.json').read_text(encoding='utf-8'));links=json.loads((r/'人物关联.json').read_text(encoding='utf-8'));assets={}
for g in links:
 f=portraits.get(g['readingId']) if g['readingId'] else None
 if f:assets[g['group']]={'src':f['src'],'caption':f['caption'],'label':'历史人物资料图','sourceURL':f['sourceUrl'],'credit':f.get('rightsEvidence','来源及使用条件见原图页')}
 else:
  f=art[g['group']];assets[g['group']]={'src':f['src'],'caption':f['caption'],'label':'团体IP · 艺术化形象' if g['group']=='LYS' else '艺术化IP形象','sourceURL':'','credit':f['note']}
(r/'services/学习/public/人物卡片素材.js').write_text('window.learningPortraits='+json.dumps(assets,ensure_ascii=False)+';',encoding='utf-8');(r/'services/学习/miniprogram/utils/人物卡片素材.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2),encoding='utf-8')
p=r/'services/学习/public/index.html';s=p.read_text(encoding='utf-8').replace('  <script src="/modules/learning/app.js">','  <script src="/modules/learning/人物卡片素材.js"></script>\n  <script src="/modules/learning/app.js">');p.write_text(s,encoding='utf-8')
p=r/'services/学习/public/app.js';s=p.read_text(encoding='utf-8');s=s.replace('return { name: group.name, personId:', 'return { group:beginner?.group, entryCount:beginner?.draw_count||5, advancedCount:advanced?.draw_count||8, name: group.name, personId:',1)
start=s.index('visible.map(group => `<article class="card person-card">');end=s.index(".join(''));",start)
s=s[:start]+'''visible.map(group => renderLearningCard(group))'''+s[end:]
helper='''
function renderLearningCard(group){
 const photo=window.learningPortraits?.[group.group];
 const next=group.primary||(group.reviewAdvanced||group.review).replace('class="secondary"','class="primary"');
 return `<article class="card person-card journey-learning-card">
 <div class="learning-person-cover">${photo?`<img src="${escape(photo.src)}" alt="${escape(photo.caption)}" loading="lazy"><span class="learning-image-kind">${escape(photo.label)}</span>`:`<span class="honor-mark">${escape(group.name.slice(0,1))}</span>`}<div class="learning-person-heading"><span class="eyebrow">人物主题学习</span><h2>${escape(group.name)}</h2><p>${group.group==='LYS'?'一个团体 · 五位成员':'循人物经历，理解时代'}</p></div></div>
 ${photo?`<details class="learning-photo-source"><summary>图注与来源</summary><p>${escape(photo.caption)}</p><p>${escape(photo.credit)}</p>${photo.sourceURL?`<a href="${escape(photo.sourceURL)}" target="_blank" rel="noopener noreferrer">查看来源 ↗</a>`:''}</details>`:''}
 <div class="learning-two-steps"><div class="learning-step ${group.beginnerCompleted?'is-done':'is-current'}"><span class="step-dot">${group.beginnerCompleted?'✓':'1'}</span><div><strong>入门 · ${group.entryCount}题</strong><small>${group.beginnerCompleted?'已完成':'待挑战'}</small></div></div><span class="step-connector" aria-hidden="true"></span><div class="learning-step ${group.advancedCompleted?'is-done':group.beginnerCompleted?'is-current':'is-locked'}"><span class="step-dot">${group.advancedCompleted?'✓':'2'}</span><div><strong>进阶 · ${group.advancedCount}题</strong><small>${group.advancedCompleted?'已完成':group.beginnerCompleted?'已解锁':'完成入门后解锁'}</small></div></div></div>
 <div class="person-actions">${group.personId?`<button class="card-reading-link" data-reading="${escape(group.personId)}">阅读档案 ↗</button>`:'<span class="learning-card-note">答后可查看解析与依据</span>'}<div class="learning-next-actions">${group.beginnerCompleted?group.review:''}${next}</div></div></article>`;
}
'''
s=s.replace('function paintLearn() {',helper+'\nfunction paintLearn() {',1);p.write_text(s,encoding='utf-8')
p=r/'services/学习/miniprogram/pages/learn/learn.js';s=p.read_text(encoding='utf-8');s="const cardPortraits=require('../../utils/人物卡片素材.json');\n"+s;s=s.replace('mark: group.name.slice(0, 1),',"mark: group.name.slice(0, 1), photo:cardPortraits[beginner&&beginner.group]||null, beginnerDone:!!(beginner&&beginner.completed),advancedDone:!!(advanced&&advanced.completed), entryCount:beginner?beginner.draw_count:5,advancedCount:advanced?advanced.draw_count:8,")
s=s.replace("      row.reviewAdvancedId = advanced.id;","      row.primaryId=advanced.id;row.primaryLabel='复习进阶';")
s=s.replace('Page({',"Page({\n showPhotoSource(e){const g=this.data.visible.find(x=>x.name===e.currentTarget.dataset.name);if(g&&g.photo)wx.showModal({title:'图注与来源',content:g.photo.caption+'\\n'+g.photo.credit+(g.photo.sourceURL?'\\n'+g.photo.sourceURL:''),showCancel:false});},",1);p.write_text(s,encoding='utf-8')
p=r/'services/学习/miniprogram/pages/learn/learn.wxml';s=p.read_text(encoding='utf-8');start=s.index('      <view class="person-main">');end=s.index('    <button class="secondary" bindtap="openHonors">',start)
s=s[:start]+'''      <view class="learning-person-cover"><view class="learning-portrait-wrap"><image wx:if="{{item.photo}}" class="learning-card-portrait" src="{{item.photo.src}}" mode="aspectFill"/><text class="learning-image-kind">{{item.photo.label}}</text></view><view class="copy"><view class="eyebrow">人物主题学习</view><view class="section">{{item.name}}</view><view class="aux">{{item.group==='LYS'?'一个团体 · 五位成员':'循人物经历，理解时代'}}</view></view></view>
      <button class="learning-photo-source" data-name="{{item.name}}" bindtap="showPhotoSource">图注与来源</button>
      <view class="learning-two-steps"><view class="learning-step {{item.beginnerDone?'is-done':'is-current'}}"><text class="step-dot">{{item.beginnerDone?'✓':'1'}}</text><view><view>入门 · {{item.entryCount}}题</view><view class="step-note">{{item.beginnerDone?'已完成':'待挑战'}}</view></view></view><view class="step-connector"></view><view class="learning-step {{item.advancedDone?'is-done':item.beginnerDone?'is-current':'is-locked'}}"><text class="step-dot">{{item.advancedDone?'✓':'2'}}</text><view><view>进阶 · {{item.advancedCount}}题</view><view class="step-note">{{item.advancedDone?'已完成':item.beginnerDone?'已解锁':'完成入门后解锁'}}</view></view></view></view>
      <view class="person-actions"><button wx:if="{{item.personId}}" class="card-reading-link" data-id="{{item.personId}}" bindtap="readPerson">阅读档案 ↗</button><view class="learning-next-actions"><button wx:if="{{item.reviewId}}" class="secondary" data-id="{{item.reviewId}}" bindtap="begin">{{item.reviewLabel}}</button><button wx:if="{{item.primaryId}}" class="primary" data-id="{{item.primaryId}}" bindtap="begin">{{item.primaryLabel}}</button></view></view>
    </view>
'''+s[end:];p.write_text(s,encoding='utf-8')
