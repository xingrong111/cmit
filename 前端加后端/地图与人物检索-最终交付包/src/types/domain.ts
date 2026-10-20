export type Status =
  | 'loading'
  | 'empty'
  | 'no-result'
  | 'error'
  | 'pending'
  | 'to-verify'
  | 'to-review'
  | 'published'
export type GeoView = 'origin' | 'birthplace' | 'activity'
export type PersonType = '人物' | '团体'

export interface ProvinceStat {
  code: string
  name: string
  publishedCount: number | null
  verifiedCount: number | null
  pendingCount: number
  status: 'published' | 'pending'
  coverage: string
  updatedAt: string
  officialCountLabel: string | null
  officialCountType: string
  officialScope: string
  matchLevel: string
  sourceUrl?: string
  sourceDate?: string
  note: string
}

export interface PersonSummary {
  id: string
  name: string
  aliases: string[]
  type: PersonType
  category: string
  provinceCode: string
  provinceName: string
  birthYear?: number
  deathYear?: number
  birthplace?: string
  activityPlace?: string
  contribution?: string
  detailUrl?: string
  sourceLabel: string
  publishStatus: 'published'
}

export interface PersonListQuery {
  provinceCode?: string
  birthplaceProvince?: string
  activityProvince?: string
  keyword?: string
  period?: 'all' | '1919-1949' | '出生符合' | '牺牲符合'
  personType?: 'all' | PersonType
  geoView?: GeoView
  page?: number
  pageSize?: number
}

export interface PersonListResult {
  items: PersonSummary[]
  total: number
  hasMore: boolean
  coverage: string
}

export interface StatisticsExplanation {
  period: string
  admission: string[]
  geography: string[]
  deduplication: string[]
  coverage: string
  updatedAt: string
}
