const api = require('../../utils/wenchuang-api.js')
const { decorate, assetLabel, formatDate } = require('../../utils/wenchuang-meta.js')

Page({__returnPrevious(){const fallback=()=>wx.switchTab({url:'/pages/people/index'});if(getCurrentPages().length>1)wx.navigateBack({delta:1,fail:fallback});else fallback();},
  data: { loading: true, error: '', errorTitle: '', needLogin: false, mock: '', item: null, fresh: true, subtitle: '', saves: [], hint: '', busyFile: '' },
  onLoad(q) { this.id = q.id || ''; this.fresh = q.view !== '1'; this.setData({ fresh: this.fresh }) },
  onShow() { this.load() },
  load() {
    this.setData({ loading: true, error: '', hint: '', mock: api.mockMode() })
    api.listClaims().then(claims => {
      const c = claims.find(x => x.product_id === this.id)
      if (!c) return this.setData({ loading: false, item: null, errorTitle: '这件作品还没有领取', error: '回到详情页看看解锁条件。' })
      const assets = (c.assets || []).filter(f => api.FILE_RE.test(f))
      const item = decorate({ id: c.product_id, name: c.name, claimed: true })
      const date = formatDate(c.claimed_at)
      this.setData({
        loading: false, item,
        subtitle: this.fresh ? `「${c.name}」已收入你的收藏` : (date ? '领取于 ' + date : '已在你的收藏中'),
        saves: assets.map((file, i) => ({ file, label: assetLabel(file, i, assets.length) }))
      })
    }).catch(e => this.setData({ loading: false, needLogin: e.status === 401, errorTitle: e.status === 401 ? '登录后查看收藏与领取' : '暂时无法展开', error: api.errorText(e) }))
  },
  onErrorAction() { this.data.needLogin ? api.requireLogin(this.id) : this.load() },
  preview() {
    const cover = this.data.item && this.data.item.cover
    if (cover) wx.previewImage({ urls: [cover] })
    else wx.showToast({ title: '正式图稿上架后可放大查看', icon: 'none' })
  },
  save(e) {
    const file = e.currentTarget.dataset.file
    if (this.data.busyFile) return
    this.setData({ busyFile: file, hint: '' })
    api.saveClaimedImage(this.id, file).then(() => this.setData({ busyFile: '', hint: /\.pdf$/i.test(file) ? '纪念册已打开，可从右上角菜单保存' : '已保存到相册' }))
      .catch(err => this.setData({ busyFile: '', hint: api.errorText(err) }))
  },
  goCollection() { wx.redirectTo({ url: '/pages/wenchuang/collection' }) },
  goIndex() { wx.redirectTo({ url: '/pages/wenchuang/index' }) },
  goBackNav() { this.data.fresh ? this.goIndex() : this.goCollection() }
})
