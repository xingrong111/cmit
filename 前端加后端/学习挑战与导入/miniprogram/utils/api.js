const app = getApp();

function learnerId() {
  let id = wx.getStorageSync('yingji:learner') || '';
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) {
    id = `lrn${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    wx.setStorageSync('yingji:learner', id);
  }
  return id;
}

function request(path, method = 'GET', data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.api}${path}`,
      method,
      data,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
        else reject(new Error((res.data && res.data.error) || '请求失败'));
      },
      fail() { reject(new Error('暂时无法连接资料服务。请先运行 node server.js，并关闭域名校验。')); }
    });
  });
}

module.exports = { learnerId, request };
