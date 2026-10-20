Page({ data: { items: [] }, onLoad() { this.getOpenerEventChannel().on('sources', value => this.setData({ items: value.items || [] })); },
 copy(e) { wx.setClipboardData({ data: e.currentTarget.dataset.url }); }
});
