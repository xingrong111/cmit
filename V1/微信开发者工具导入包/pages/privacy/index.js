Page({__returnPrevious(){const fallback=()=>wx.switchTab({url:'/pages/me/index'});if(getCurrentPages().length>1)wx.navigateBack({delta:1,fail:fallback});else fallback();}, agree() { const app = getApp(); if (app.globalData.privacyResolve) { app.globalData.privacyResolve({ event: 'agree', buttonId: 'agree-privacy' }); app.globalData.privacyResolve = null; } wx.navigateBack(); },
 decline() { const app = getApp(); if (app.globalData.privacyResolve) { app.globalData.privacyResolve({ event: 'disagree' }); app.globalData.privacyResolve = null; } wx.navigateBack(); },
 open() { if (wx.openPrivacyContract) wx.openPrivacyContract({}); },
 onUnload() { const app = getApp(); if (app.globalData.privacyResolve) { app.globalData.privacyResolve({ event: 'disagree' }); app.globalData.privacyResolve = null; } }
});
