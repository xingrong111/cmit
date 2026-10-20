const api = require('../../utils/wenchuang-api.js')
const { decorate, formatDate } = require('../../utils/wenchuang-meta.js')

Page({__returnPrevious(){const fallback=()=>wx.switchTab({url:'/pages/people/index'});if(getCurrentPages().length>1)wx.navigateBack({delta:1,fail:fallback});else fallback();},
  data: { loading: true, error: '', errorTitle: '', needLogin: false, mock: '', items: [] },
  onShow() { this.load() },
  load() {
    this.setData({ loading: true, error: '', mock: api.mockMode() })
    api.listClaims().then(claims => this.setData({
      loading: false,
      items: claims.map(c => Object.assign(decorate({ id: c.product_id, name: c.name, claimed: true }), { date: formatDate(c.claimed_at) }))
    })).catch(e => this.setData({ loading: false, needLogin: e.status === 401, errorTitle: e.status === 401 ? '登录后查看收藏与领取' : '暂时无法展开', error: api.errorText(e) }))
  },
  onErrorAction() { this.data.needLogin ? api.requireLogin() : this.load() },
  goIndex() { wx.navigateBack({ fail() { wx.redirectTo({ url: '/pages/wenchuang/index' }) } }) },
  openItem(e) { wx.navigateTo({ url: '/pages/wenchuang/success?id=' + e.currentTarget.dataset.id + '&view=1' }) }
})
