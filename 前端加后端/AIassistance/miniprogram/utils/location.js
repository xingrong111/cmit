function locate() {
  return new Promise((resolve, reject) => {
    const run = () => wx.getLocation({ type: 'gcj02', isHighAccuracy: true, highAccuracyExpireTime: 5000,
      success(value) {
        if (typeof value.accuracy === 'number' && value.accuracy > 500) return reject({ message: '位置精度不足，请到开阔处重试，或手动选择城市。' });
        resolve({ latitude: value.latitude, longitude: value.longitude, type: 'gcj02' });
      }, fail() { reject({ message: '未能获取位置。你仍可手动选择城市，或在小程序设置中开启位置权限。' }); }
    });
    if (wx.requirePrivacyAuthorize) wx.requirePrivacyAuthorize({ success: run, fail: () => reject({ message: '你未同意位置相关隐私说明，可以继续手动浏览城市。' }) });
    else run();
  });
}
module.exports = { locate };
