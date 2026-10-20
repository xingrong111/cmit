import { people } from './fixtures'
import type { PersonListQuery } from '@/types/domain'

export default async function getPeople(query: PersonListQuery) {
  const keyword = (query.keyword || '').trim().toLowerCase()
  const items = people.filter(person => {
    if (query.provinceCode && person.provinceCode !== query.provinceCode.trim()) return false
    if (query.birthplaceProvince && !person.birthplace?.includes(query.birthplaceProvince)) return false
    if (query.activityProvince && !person.activityPlace?.includes(query.activityProvince)) return false
    if (query.personType && query.personType !== 'all' && person.type !== query.personType) return false
    const searchableValues = [person.name, ...person.aliases, person.category, person.contribution]
      .filter((value): value is string => Boolean(value))
    if (keyword && !searchableValues.some(value => value.toLowerCase().includes(keyword))) return false
    if (query.period === '1919-1949' && (!person.birthYear || person.birthYear < 1919 && (!person.deathYear || person.deathYear < 1919) || person.birthYear > 1949 && (!person.deathYear || person.deathYear > 1949))) return false
    return true
  })
  return { items, total: items.length, hasMore: false, coverage: '仅展示已发布资料；当前来源为部分覆盖样本' }
}
