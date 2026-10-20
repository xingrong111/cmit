const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const MAX_LIMIT = 100

async function loadAll(conditions) {
  const countResult = await db.collection('people').where(conditions).count()
  const batches = []
  for (let skip = 0; skip < countResult.total; skip += MAX_LIMIT) {
    batches.push(db.collection('people').where(conditions).skip(skip).limit(MAX_LIMIT).get())
  }
  const results = await Promise.all(batches)
  return results.flatMap(result => result.data)
}

function matchesPeriod(person, period) {
  if (!period || period === 'all') return true
  const birthInRange = person.birthYear >= 1919 && person.birthYear <= 1949
  const deathInRange = person.deathYear >= 1919 && person.deathYear <= 1949
  if (period === '出生符合') return birthInRange
  if (period === '牺牲符合') return deathInRange
  if (period === '1919-1949') return birthInRange || deathInRange
  return true
}

exports.main = async (event) => {
  try {
    const { provinceCode, birthplaceProvince = '', activityProvince = '', keyword = '', period = 'all', personType = 'all' } = event || {}
    const conditions = {
      publishStatus: 'published',
      ...(provinceCode ? { provinceCode: String(provinceCode).trim() } : {})
    }
    if (personType !== 'all') conditions.type = personType

    const people = await loadAll(conditions)
    const normalized = String(keyword).trim().toLowerCase()
    const items = people.filter(person => {
      const identityValues = [
        person.name,
        ...(person.aliases || []),
        person.category,
        person.contribution
      ]
      const keywordMatched = !normalized || identityValues
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalized))
      const birthplaceMatched = !birthplaceProvince || String(person.birthplace || '').includes(birthplaceProvince)
      const activityMatched = !activityProvince || String(person.activityPlace || '').includes(activityProvince)
      return keywordMatched && birthplaceMatched && activityMatched && matchesPeriod(person, period)
    })

    return {
      code: 0,
      message: 'ok',
      data: {
        items,
        total: items.length,
        hasMore: false,
        coverage: '仅展示已发布资料；当前来源为部分覆盖样本'
      }
    }
  } catch (err) {
    console.error('[getPeople] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  }
}
