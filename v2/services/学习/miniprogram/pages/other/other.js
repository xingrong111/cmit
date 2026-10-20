Page({
  data: { name: '', owner: '', tab: 'mountain' },
  onLoad(query) {
    const name = query.name || '山河';
    const tab = name === '足迹' ? 'trace' : name === '我的' ? 'me' : 'mountain';
    this.setData({ name, owner: query.owner || '', tab });
    wx.setNavigationBarTitle({ title: name });
  },
  back() { wx.reLaunch({ url: '/pages/learn/learn' }); }
});
