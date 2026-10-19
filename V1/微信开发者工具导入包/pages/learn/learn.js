const cardPortraits=require('../../utils/人物卡片素材.json');
const { learnerId, request } = require('../../utils/learning-api.js');

function presentGroups(items) {
  const groups = [];
  for (const level of items) {
    let group = groups.find(item => item.name === level.person_name);
    if (!group) {
      group = { name: level.person_name, personId: level.reading_person_id, levels: [] };
      groups.push(group);
    }
    group.levels.push(level);
  }
  return groups.map(group => {
    const beginner = group.levels.find(level => level.difficulty === '入门');
    const advanced = group.levels.find(level => level.difficulty === '进阶');
    const both = Boolean(beginner && beginner.completed && advanced && advanced.completed);
    const row = {
      personId:group.personId, group:beginner&&beginner.group, name: group.name,
      mark: group.name.slice(0, 1), photo:cardPortraits[beginner&&beginner.group]||null, beginnerDone:!!(beginner&&beginner.completed),advancedDone:!!(advanced&&advanced.completed), entryCount:beginner?beginner.draw_count:5,advancedCount:advanced?advanced.draw_count:8,
      archive: group.personId ? `已接入人物档案，可结合史料学习。` : '本组人物档案持续整理中。',
      both,
      status: '待挑战',
      earned: false,
      primaryId: '',
      primaryLabel: '',
      reviewId: '',
      reviewLabel: '',
      reviewAdvancedId: ''
    };
    if (!beginner || !beginner.completed) {
      row.primaryId = beginner ? beginner.id : '';
      row.primaryLabel = '开始入门';
    } else if (!advanced || !advanced.completed) {
      row.status = '入门已完成';
      row.earned = true;
      row.primaryId = advanced ? advanced.id : '';
      row.primaryLabel = '开始进阶';
      row.reviewId = beginner.id;
      row.reviewLabel = '复习入门';
    } else {
      row.status = '已完成';
      row.earned = true;
      row.reviewId = beginner.id;
      row.reviewLabel = '复习入门';
      row.primaryId=advanced.id;row.primaryLabel='复习进阶';
    }
    return row;
  });
}

Page({__returnPrevious(){const fallback=()=>wx.switchTab({url:'/pages/people/index'});if(getCurrentPages().length>1)wx.navigateBack({delta:1,fail:fallback});else fallback();},
 openGroup(e){this.focusGroup=e.currentTarget.dataset.group;this.setData({filter:'all'});this.paint();wx.pageScrollTo({scrollTop:0,duration:0});},
 showPhotoSource(e){const g=this.data.visible.find(x=>x.name===e.currentTarget.dataset.name);if(g&&g.photo)wx.showModal({title:'图注与来源',content:g.photo.caption+'\n'+g.photo.credit+(g.photo.sourceURL?'\n'+g.photo.sourceURL:''),showCancel:false});},
  onLoad(o){this.focusGroup=/^(QQB|LYS|SZZ|LDY|JZY)$/.test(o.group||'')?o.group:'';},
  allChallenges(){this.focusGroup='';this.setData({filter:'all'});this.paint();},
  back(){if(getCurrentPages().length>1)wx.navigateBack();else wx.switchTab({url:'/pages/people/index'});},
  data: {
    focusName:'', stages:[], loading: true, error: '', filter: 'all', continueId: '',
    beginnerDone: 0, advancedDone: 0, total: 5, beginnerPercent: 0, advancedPercent: 0, visible: []
  },
  readPerson(e){const id=e.currentTarget.dataset.id;if(id)wx.navigateTo({url:'/pages/person/index?id='+encodeURIComponent(id)})},
  onShow() {const token=wx.getStorageSync('yingji:token')||'';if(wx.getStorageSync('yingji:learning-account')!==token){wx.removeStorageSync('yingji:attempt');wx.setStorageSync('yingji:learning-account',token);}
    this.setData({ continueId: wx.getStorageSync('yingji:attempt') || '' });
    this.load();
  },
  async load() {
    this.setData({ loading: true, error: '' });
    try {
      const data = await request(`/api/levels?learner_id=${learnerId()}`);
      this.levels=data.items;this.groups = presentGroups(data.items);
      this.paint();
    } catch (error) {
      this.setData({ loading: false, error: error.message });
    }
  },
  paint() {
    const groups = this.groups || [];
    const progressGroups=this.focusGroup?groups.filter(x=>x.group===this.focusGroup):groups;const total = progressGroups.length || 5;
    const beginnerDone = progressGroups.filter(group => group.status !== '待挑战').length;
    const advancedDone = progressGroups.filter(group => group.status === '已完成').length;
    const visible = groups.filter(group=>!this.focusGroup||group.group===this.focusGroup).filter(group => this.data.filter === 'done' ? group.both : this.data.filter === 'open' ? !group.both : true);
    this.setData({
      focusName: this.focusGroup?(this.levels||[]).find(x=>x.group===this.focusGroup)?.person_name||'':'',
      stages:(this.levels||[]).filter(x=>x.group===this.focusGroup).filter(x=>this.data.filter==='done'?x.completed:this.data.filter==='open'?!x.completed:true).map(x=>({...x,locked:x.difficulty==='进阶'&&!(this.levels||[]).find(y=>y.group===x.group&&y.difficulty==='入门')?.completed})),
      loading: false,
      beginnerDone,
      advancedDone,
      total,
      beginnerPercent: Math.round((beginnerDone * 100) / total),
      advancedPercent: Math.round((advancedDone * 100) / total),
      visible
    });
  },
  setFilter(event) {
    this.setData({ filter: event.currentTarget.dataset.filter }, () => this.paint());
  },
  async begin(event) {
    if (this.busy) return;
    this.busy = true;
    try {
      const attempt = await request('/api/attempts', 'POST', { level_id: event.currentTarget.dataset.id, learner_id: learnerId() });
      wx.setStorageSync('yingji:attempt', attempt.id);
      wx.removeStorageSync(`yingji:earned:${attempt.id}`);
      wx.navigateTo({ url: `/pages/quiz/quiz?id=${attempt.id}` });
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    } finally {
      this.busy = false;
    }
  },
  resume() {
    wx.navigateTo({ url: `/pages/quiz/quiz?id=${this.data.continueId}` });
  },
  openHonors() {
    wx.navigateTo({ url: '/pages/honors/honors' });
  }
});
