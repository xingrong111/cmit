const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  try {
    const result = await db.collection('statistics_explanation')
      .where({ publishStatus: 'published' })
      .limit(1)
      .get()
    return { code: 0, message: 'ok', data: result.data[0] || null }
  } catch (err) {
    console.error('[getStatisticsExplanation] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  }
}
