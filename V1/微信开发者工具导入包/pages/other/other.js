Page({__returnPrevious(){const fallback=()=>wx.switchTab({url:'/pages/people/index'});if(getCurrentPages().length>1)wx.navigateBack({delta:1,fail:fallback});else fallback();},
  data: { name: '', owner: '', tab: 'mountain' },
  onLoad(query) {
    const name = query.name || '山河';
    const tab = name === '足迹' ? 'trace' : name === '我的' ? 'me' : 'mountain';
    this.setData({ name, owner: query.owner || '', tab });
    wx.setNavigationBarTitle({ title: name });
  },
  back() { wx.reLaunch({ url: '/pages/learn/learn' }); }
});
