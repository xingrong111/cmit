// 小程序文创接口。独立打开本目录时 STANDALONE=true，走演示数据。
// 拷进主小程序后改为 false，并确认 base 指向统一入口 /api/wenchuang。
const STANDALONE = false
const base = 'http://127.0.0.1:3210/api/wenchuang'
const ID_RE = /^WC\d{3}$/
const FILE_RE = /^[A-Za-z0-9_-]+\.(png|jpe?g|webp|pdf)$/i
const RETURN_KEY = 'yingji:wc:return-product'

function token() { return wx.getStorageSync('yingji:token') || '' }
function fail(message, status, code) { return Object.assign(new Error(message), { status, code }) }
function errorText(e) {
  if (!e) return '操作失败，请稍后重试'
  if (e.status === 401) return '请先登录账户'
  if (e.status === 403) return '还没有满足解锁条件，继续学习挑战就能解锁'
  if (e.code === 'ASSET_PENDING') return '这件作品还在整理上架，暂时不能领取'
  return e.message || '操作失败，请稍后重试'
}

const MOCK_PRODUCTS = [
  { id: 'WC001', name: '针线里的黎明', condition: { type: 'group_title', title_id: 'H-GROUP-BEGINNER', group_id: 'JZY' }, unlocked: true, progress: 1, required: 1, asset_status: '已就绪' },
  { id: 'WC002', name: '山河初识', condition: { type: 'distinct_titles', count: 1 }, unlocked: true, progress: 1, required: 1, asset_status: '待素材' },
  { id: 'WC003', name: '循迹成长纪念册', condition: { type: 'distinct_titles', count: 5 }, unlocked: false, progress: 2, required: 5, asset_status: '待素材' }
]
const MOCK_ASSETS = { WC001: ['WC001-front.png', 'WC001-back.png'] }

function mockMode() {
  if (!STANDALONE) return ''
  return wx.getStorageSync('yingji:wc:mock') || '1'
}
function publicCatalog() {
  return MOCK_PRODUCTS.map(p => ({ id: p.id, name: p.name, condition: p.condition, required: p.required, progress: 0, unlocked: false, claimed: false, asset_status: '待素材', assets: [], guest: true }))
}
function mockClaimed() { try { return wx.getStorageSync('yingji:wc:mock-claims') || {} } catch (e) { return {} } }

function mockRequest(mode, path, method) {
  return new Promise((resolve, reject) => setTimeout(() => {
    try {
      if (mode === 'login' && path === '/products') return resolve({ products: publicCatalog() })
      if (mode === 'login') return reject(fail('请先登录账户', 401))
      if (mode === 'error') return reject(fail('暂时无法核验账户或称号，请稍后重试', 503))
      const claimed = mockClaimed()
      if (path === '/products') {
        if (mode === 'empty') return resolve({ products: [] })
        return resolve({ products: MOCK_PRODUCTS.map(p => Object.assign({}, p, { claimed: !!claimed[p.id], assets: claimed[p.id] ? MOCK_ASSETS[p.id] || [] : [] })) })
      }
      if (path === '/claims') {
        if (mode === 'empty') return resolve({ claims: [] })
        return resolve({
          claims: Object.keys(claimed).map(id => {
            const p = MOCK_PRODUCTS.find(x => x.id === id)
            return { product_id: id, claimed_at: claimed[id], name: p ? p.name : id, assets: MOCK_ASSETS[id] || [] }
          })
        })
      }
      const hit = /^\/products\/(WC\d{3})\/claim$/.exec(path)
      if (hit && method === 'POST') {
        if (mode === 'claimfail') return reject(fail('文创服务暂时不可用', 500))
        const product = MOCK_PRODUCTS.find(x => x.id === hit[1])
        if (!product) return reject(fail('作品不存在', 404))
        if (claimed[product.id]) return resolve({ claim: { product_id: product.id, claimed_at: claimed[product.id] }, already_claimed: true })
        if (!product.unlocked) return reject(fail('尚未满足解锁条件', 403))
        if (product.asset_status !== '已就绪') return reject(fail('作品原图待交付，暂不能领取', 409, 'ASSET_PENDING'))
        claimed[product.id] = new Date().toISOString()
        wx.setStorageSync('yingji:wc:mock-claims', claimed)
        return resolve({ claim: { product_id: product.id, claimed_at: claimed[product.id] }, already_claimed: false })
      }
      reject(fail('接口不存在', 404))
    } catch (e) { reject(e) }
  }, mode === 'slow' ? 1600 : 250))
}

function request(path, method = 'GET') {
  const mode = mockMode()
  if (mode) return mockRequest(mode, path, method)
  if (!token() && path !== '/products') return Promise.reject(fail('请先登录账户', 401))
  return new Promise((resolve, reject) => wx.request({
    url: base + path, method, timeout: 12000,
    header: { Authorization: 'Bearer ' + token() },
    success: r => r.statusCode >= 200 && r.statusCode < 300
      ? resolve(r.data)
      : reject(fail((r.data && r.data.error) || '请求失败', r.statusCode, r.data && r.data.code)),
    fail: () => reject(fail('无法连接文创服务，请检查网络和 HTTPS 域名配置'))
  }))
}

function listProducts() {
  const mode = mockMode()
  if (mode === 'login') return Promise.resolve(publicCatalog())
  return request('/products').then(d => d.products || [])
}
function listClaims() { return request('/claims').then(d => d.claims || []) }
function claimProduct(id) {
  if (!ID_RE.test(id)) return Promise.reject(fail('作品编号无效'))
  return request('/products/' + encodeURIComponent(id) + '/claim', 'POST')
}

function requireLogin(productId) {
  if (token() && !mockMode()) return false
  if (mockMode() && mockMode() !== 'login') return false
  if (ID_RE.test(productId || '')) wx.setStorageSync(RETURN_KEY, productId)
  if (STANDALONE) {
    wx.showModal({ title: '请先登录', content: '独立预览没有账户页。接入主小程序后会跳到现有登录页。', showCancel: false })
    return true
  }
  wx.navigateTo({ url: '/pages/account/index' })
  return true
}
function takeReturnProduct() {
  const id = wx.getStorageSync(RETURN_KEY)
  wx.removeStorageSync(RETURN_KEY)
  return ID_RE.test(id || '') ? id : null
}
function goLearning() {
  if (STANDALONE) return wx.showToast({ title: '接入后跳转学习挑战', icon: 'none' })
  wx.navigateTo({ url: '/pages/learn/learn' })
}
function saveClaimedImage(productId, fileName) {
  if (!ID_RE.test(productId) || !FILE_RE.test(fileName)) return Promise.reject(fail('素材编号无效'))
  if (mockMode()) return Promise.reject(fail('演示数据没有真实原图，正式数据领取后即可保存'))
  return new Promise((resolve, reject) => wx.downloadFile({
    url: `${base}/claims/${productId}/assets/${fileName}`,
    header: { Authorization: 'Bearer ' + token() },
    success: r => {
      if (r.statusCode !== 200) return reject(fail('请先领取作品或稍后重试'))
      if (/\.pdf$/i.test(fileName)) return wx.openDocument({ filePath: r.tempFilePath, fileType: 'pdf', showMenu: true, success: resolve, fail: () => reject(fail('纪念册暂时无法打开')) })
      wx.saveImageToPhotosAlbum({
        filePath: r.tempFilePath,
        success: resolve,
        fail: e => reject(fail(String(e.errMsg || '').includes('auth deny') ? '请在微信设置中允许保存到相册' : '保存图片失败'))
      })
    },
    fail: () => reject(fail('图片下载失败'))
  }))
}

module.exports = { STANDALONE, FILE_RE, mockMode, errorText, listProducts, listClaims, claimProduct, requireLogin, takeReturnProduct, goLearning, saveClaimedImage }
