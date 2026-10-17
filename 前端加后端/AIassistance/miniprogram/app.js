App({
  globalData: { position: null, routeIds: [], privacyResolve: null },
  onLaunch() {
    try { const ids=wx.getStorageSync('yingji-route-v1');if(Array.isArray(ids))this.globalData.routeIds=[...new Set(ids.filter(id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(id)))].slice(0,4); } catch(e) {}

    if (wx.onNeedPrivacyAuthorization) wx.onNeedPrivacyAuthorization(resolve => {
      this.globalData.privacyResolve = resolve;
      wx.navigateTo({ url: '/pages/privacy/index', fail: () => { resolve({ event: 'disagree' }); this.globalData.privacyResolve = null; } });
    });
  }
});
