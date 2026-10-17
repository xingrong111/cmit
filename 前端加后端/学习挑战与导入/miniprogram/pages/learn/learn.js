const { learnerId, request } = require('../../utils/api.js');

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
      name: group.name,
      mark: group.name.slice(0, 1),
      archive: group.personId ? `人物档案 ${group.personId} 由成员2提供。` : '这一组还没有阅读库人物编号。',
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
      row.reviewAdvancedId = advanced.id;
    }
    return row;
  });
}

Page({
  data: {
    loading: true, error: '', filter: 'all', continueId: '',
    beginnerDone: 0, advancedDone: 0, total: 5, beginnerPercent: 0, advancedPercent: 0, visible: []
  },
  onShow() {
    this.setData({ continueId: wx.getStorageSync('yingji:attempt') || '' });
    this.load();
  },
  async load() {
    this.setData({ loading: true, error: '' });
    try {
      const data = await request(`/api/levels?learner_id=${learnerId()}`);
      this.groups = presentGroups(data.items);
      this.paint();
    } catch (error) {
      this.setData({ loading: false, error: error.message });
    }
  },
  paint() {
    const groups = this.groups || [];
    const total = groups.length || 5;
    const beginnerDone = groups.filter(group => group.status !== '待挑战').length;
    const advancedDone = groups.filter(group => group.status === '已完成').length;
    const visible = groups.filter(group => this.data.filter === 'done' ? group.both : this.data.filter === 'open' ? !group.both : true);
    this.setData({
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
