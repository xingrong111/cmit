const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const MAX_LIMIT = 100

exports.main = async () => {
  try {
    const countResult = await db.collection('province_stats').count()
    const batches = []
    for (let skip = 0; skip < countResult.total; skip += MAX_LIMIT) {
      batches.push(db.collection('province_stats').skip(skip).limit(MAX_LIMIT).get())
    }
    const results = await Promise.all(batches)
    const items = results.flatMap(result => result.data)
    return { code: 0, message: 'ok', data: { items, updatedAt: '2026-10-10' } }
  } catch (err) {
    console.error('[getProvinceStats] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  }
}
