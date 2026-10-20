const api = require('../../utils/wenchuang-api.js')
const { decorate } = require('../../utils/wenchuang-meta.js')

Page({__returnPrevious(){const fallback=()=>wx.switchTab({url:'/pages/people/index'});if(getCurrentPages().length>1)wx.navigateBack({delta:1,fail:fallback});else fallback();},
  data: { loading: true, error: '', errorTitle: '', needLogin: false, mock: '', item: null, hint: '', busy: false, id: '' },
  onLoad(q) { this.id = q.id || ''; this.setData({ id: this.id }) },
  onShow() { this.load() },
  load() {
    if (!/^WC\d{3}$/.test(this.id)) return this.setData({ loading: false, item: null, errorTitle: '没有找到这件作品', error: '它可能已经下架，回文创馆看看其他作品。' })
    this.setData({ loading: true, error: '', hint: '', mock: api.mockMode() })
    api.listProducts().then(products => {
      const raw = products.find(p => p.id === this.id)
      if (!raw) return this.setData({ loading: false, item: null, errorTitle: '没有找到这件作品', error: '它可能已经下架，回文创馆看看其他作品。' })
      this.setData({ loading: false, item: decorate(raw) })
    }).catch(e => this.setData({ loading: false, needLogin: e.status === 401, errorTitle: e.status === 401 ? '登录后查看收藏与领取' : '暂时无法展开', error: api.errorText(e) }))
  },
  onErrorAction() { this.data.needLogin ? api.requireLogin(this.id) : this.load() },
  back() { wx.navigateBack({ fail() { wx.redirectTo({ url: '/pages/wenchuang/index' }) } }) },
  login() { api.requireLogin(this.id) },
  learning() { api.goLearning() },
  viewItem() { wx.redirectTo({ url: '/pages/wenchuang/success?id=' + this.id + '&view=1' }) },
  preview() {
    const cover = this.data.item && this.data.item.cover
    if (cover) wx.previewImage({ urls: [cover] })
    else wx.showToast({ title: '正式图稿上架后可放大查看', icon: 'none' })
  },
  claim() {
    if (this.data.busy) return
    if (api.requireLogin(this.id)) return
    this.setData({ busy: true, hint: '' })
    api.claimProduct(this.id).then(() => wx.redirectTo({ url: '/pages/wenchuang/success?id=' + this.id }))
      .catch(e => {
        this.setData({ busy: false })
        if (e.status === 401) return api.requireLogin(this.id)
        this.setData({ hint: api.errorText(e) })
      })
  }
})
