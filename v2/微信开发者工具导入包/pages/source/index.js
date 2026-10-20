Page({__returnPrevious(){const fallback=()=>wx.switchTab({url:'/pages/radar/index'});if(getCurrentPages().length>1)wx.navigateBack({delta:1,fail:fallback});else fallback();}, data: { items: [] }, onLoad() { this.getOpenerEventChannel().on('sources', value => this.setData({ items: value.items || [] })); },
 copy(e) { wx.setClipboardData({ data: e.currentTarget.dataset.url }); }
});
