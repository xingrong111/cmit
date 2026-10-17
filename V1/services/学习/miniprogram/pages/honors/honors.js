const { learnerId, request } = require('../../utils/api.js');

function honorRows(data) {
  const rows = [];
  for (const title of data.titles) {
    if (title.scope === 'group') {
      for (const group of title.groups) {
        rows.push({ key: `${title.id}-${group.group_id}`, scope: 'group', mark: title.name.slice(0, 1), name: title.name, detail: `${group.person_name} · ${title.condition}`, state: group.state, progress: '', earned: group.state === '已获得' });
      }
    } else {
      rows.push({ key: title.id, scope: 'cross', mark: title.name.slice(0, 1), name: title.name, detail: title.condition, state: title.state, progress: title.progress, earned: title.state === '已获得' });
    }
  }
  return rows;
}

Page({
  data: {
    loading: true, error: '', filter: 'all', groupOpen: true, crossOpen: true,
    current: '暂无', earnedCount: 0, totalCount: 0, percent: 0, note: '', completed: 0,
    groupItems: [], crossItems: []
  },
  onShow() { this.load(); },
  async load() {
    this.setData({ loading: true, error: '' });
    try {
      this.honorData = await request(`/api/honors?learner_id=${learnerId()}`);
      this.paint();
    } catch (error) {
      this.setData({ loading: false, error: error.message });
    }
  },
  paint() {
    const rows = honorRows(this.honorData);
    const earned = rows.filter(row => row.earned);
    const current = ['理想点灯人', '星火传承者', '红色寻迹者', '追光探寻者', '星火初学者'].find(name => earned.some(row => row.name === name)) || '暂无';
    this.setData({
      loading: false,
      current,
      earnedCount: earned.length,
      totalCount: rows.length,
      percent: rows.length ? Math.round((earned.length * 100) / rows.length) : 0,
      note: this.honorData.note,
      completed: this.honorData.completed_groups,
      groupItems: rows.filter(row => row.scope === 'group'),
      crossItems: rows.filter(row => row.scope === 'cross')
    });
  },
  setFilter(event) { this.setData({ filter: event.currentTarget.dataset.filter }); },
  toggleGroup() { this.setData({ groupOpen: !this.data.groupOpen }); },
  toggleCross() { this.setData({ crossOpen: !this.data.crossOpen }); },
  hall() { wx.navigateBack({ fail() { wx.reLaunch({ url: '/pages/learn/learn' }); } }); }
});
