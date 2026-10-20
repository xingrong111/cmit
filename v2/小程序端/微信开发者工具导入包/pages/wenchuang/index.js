const api = require('../../utils/wenchuang-api.js')
const { CATEGORIES, decorate } = require('../../utils/wenchuang-meta.js')

Page({__returnPrevious(){const fallback=()=>wx.switchTab({url:'/pages/people/index'});if(getCurrentPages().length>1)wx.navigateBack({delta:1,fail:fallback});else fallback();},
  data: { loading: true, error: '', errorTitle: '', needLogin: false, mock: '', guest: false, summary: '', total: 0, unlockPercent: 0, cats: [], category: '全部', shown: [] },
  onShow() {
    const back = api.takeReturnProduct()
    if (back) return wx.redirectTo({ url: '/pages/wenchuang/detail?id=' + back })
    this.load()
  },
  load() {
    this.setData({ loading: true, error: '', mock: api.mockMode() })
    api.listProducts().then(products => {
      this.products = products.map(decorate)
      this.setData({ loading: false, total: products.length })
      this.paint()
    }).catch(e => this.setData({ loading: false, needLogin: e.status === 401, errorTitle: e.status === 401 ? '登录后查看收藏与领取' : '暂时无法展开', error: api.errorText(e) }))
  },
  paint() {
    const products = this.products || []
    const guest = products.some(p => p.guest)
    const cats = ['全部'].concat(CATEGORIES.filter(c => products.some(p => p.category === c)))
    let category = this.data.category
    if (cats.indexOf(category) < 0) category = '全部'
    const shown = products.filter(p => category === '全部' || p.category === category)
    const unlocked = products.filter(p => p.unlocked).length
    const claimed = products.filter(p => p.claimed).length
    const total = products.length
    this.setData({
      guest, cats, category, shown,
      summary: guest ? '登录后可查看你的解锁进度与领取' : (total ? `已解锁 ${unlocked} / ${total} 件 · 已领取 ${claimed} 件` : ''),
      unlockPercent: total ? Math.round(unlocked / total * 100) : 0
    })
  },
  setCategory(e) { this.setData({ category: e.currentTarget.dataset.cat }); this.paint() },
  openDetail(e) { wx.navigateTo({ url: '/pages/wenchuang/detail?id=' + e.currentTarget.dataset.id }) },
  goCollection() { wx.navigateTo({ url: '/pages/wenchuang/collection' }) },
  onErrorAction() { this.data.needLogin ? api.requireLogin() : this.load() },
  login() { api.requireLogin() }
})
