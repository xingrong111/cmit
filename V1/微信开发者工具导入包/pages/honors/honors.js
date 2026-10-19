const badgeRecords=require('../../utils/称号徽章.json');
const { learnerId, request } = require('../../utils/learning-api.js');

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

Page({__returnPrevious(){const fallback=()=>wx.switchTab({url:'/pages/people/index'});if(getCurrentPages().length>1)wx.navigateBack({delta:1,fail:fallback});else fallback();},
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
    const current=earned.length?earned[earned.length-1].name:'尚未获得';
    this.setData({
      loading: false,
      current,
      currentBadge:badgeRecords[earned[earned.length-1]?.key||'H-PATH-1']?.badge,
      earnedCount: earned.length,
      totalCount: rows.length,
      percent: rows.length ? Math.round((earned.length * 100) / rows.length) : 0,
      note: this.honorData.note,
      completed: this.honorData.completed_groups,
      groupItems: rows.filter(row => row.scope === 'group'),
      crossItems: rows.filter(row => row.scope === 'cross'),
      pathItems:rows.map((row,i)=>({...row,index:i+1,next:!row.earned&&rows.findIndex(x=>!x.earned)===i,badge:badgeRecords[row.key]?.badge||''})),
      nextGoal:rows.find(row=>!row.earned)?.detail||'五段成长已完成，可以继续复习。'
    });
  },
  setFilter(event) { this.setData({ filter: event.currentTarget.dataset.filter }); },
  toggleGroup() { this.setData({ groupOpen: !this.data.groupOpen }); },
  toggleCross() { this.setData({ crossOpen: !this.data.crossOpen }); },
  hall(){wx.reLaunch({url:'/pages/learn/learn'});}
});
