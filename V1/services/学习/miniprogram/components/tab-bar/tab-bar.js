Component({
  options: { virtualHost: true },
  properties: { current: { type: String, value: 'learn' } },
  methods: {
    go(event) {
      const tab = event.currentTarget.dataset.tab;
      if (tab === 'learn') {
        wx.reLaunch({ url: '/pages/learn/learn' });
        return;
      }
      const pages = { mountain: ['山河', '成员1'], trace: ['足迹', '成员4'], me: ['我的', '成员3'] };
      const [name, owner] = pages[tab];
      wx.reLaunch({ url: `/pages/other/other?name=${encodeURIComponent(name)}&owner=${encodeURIComponent(owner)}` });
    }
  }
});
