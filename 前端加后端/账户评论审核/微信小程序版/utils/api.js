const base = () => getApp().globalData.apiBase.replace(/\/$/, '')
const token = () => wx.getStorageSync('yingji:token') || ''
function request(path, method = 'GET', data) {
  return new Promise((resolve, reject) => wx.request({
    url: base() + path, method, data, timeout: 12000,
    header: { 'content-type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) },
    success: res => res.statusCode >= 200 && res.statusCode < 300 ? resolve(res.data) : reject(new Error(res.data?.error?.message || '请求失败，请稍后重试。')),
    fail: () => reject(new Error('暂时无法连接服务。开发者工具请确认已关闭“校验合法域名”，真机需配置 HTTPS。'))
  }))
}
module.exports = { request, setToken: value => wx.setStorageSync('yingji:token', value), clearToken: () => wx.removeStorageSync('yingji:token') }
