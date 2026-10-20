const config = require('../config');
function request(path, options) {
  options = options || {};
  let task;
  const promise = new Promise((resolve, reject) => {
    task = wx.request({ url: config.apiBase + path.replace(/^\/api/,''), method: options.method || 'GET', data: options.data,
      timeout: options.timeout || 55000, header: { 'content-type': 'application/json' },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
        else reject({ message: res.data && res.data.error ? res.data.error.message : '服务暂时不可用', code: res.data && res.data.error ? res.data.error.code : 'HTTP_ERROR' });
      },
      fail(err) { reject({ message: /abort/.test(err.errMsg) ? '已停止本次请求' : '连接失败，请检查服务和网络', cancelled: /abort/.test(err.errMsg) }); }
    });
  });
  return { promise, abort: () => task && task.abort() };
}
function query(values) {
  return Object.keys(values).filter(k => values[k] !== undefined && values[k] !== null && values[k] !== '').map(k => encodeURIComponent(k) + '=' + encodeURIComponent(values[k])).join('&');
}
function sources(items) { wx.navigateTo({ url: '/pages/source/index', success(res) { res.eventChannel.emit('sources', { items }); } }); }
function team(type,id){const map={"IP-QC": "P009", "IP-SZZ": "P004", "IP-LDY": "P014"};const target=type==='person'?map[id]:id;if(!target)return wx.showToast({title:'该人物暂无阅读档案',icon:'none'});wx.navigateTo({url:config.teamPages[type]+'?id='+encodeURIComponent(target)}); }
function assetURL(path){return config.apiBase.replace(/\/api\/guide$/,'')+path;}
module.exports = { request, query, sources, team, assetURL };
