import React, { useEffect, useState } from 'react'
import { Image, ScrollView, Text, View } from '@tarojs/components'
import Taro, { useDidShow, useLoad } from '@tarojs/taro'
import { BottomNav } from '@/components/BottomNav'
import { TextField } from '@/components/FormControls'
import { SectionCard } from '@/components/SectionCard'
import { StatusMessage } from '@/components/StatusMessage'
import { callFunction } from '@/services/cloud'
import chinaProvinces from '@/data/chinaProvinces.json'
import type { PersonListResult, PersonSummary } from '@/types/domain'
import styles from './index.module.scss'

const provinceOptions = [
  { code: '', name: '全部' },
  ...chinaProvinces.features.map(feature => ({
    code: feature.properties.区划码,
    name: feature.properties.地名,
  })),
]
const provinceNames = provinceOptions.map(option => option.name)

const PeoplePage: React.FC = () => {
  const [provinceCode, setProvinceCode] = useState('')
  const [provinceName, setProvinceName] = useState('全部省份')
  const [provinceScope, setProvinceScope] = useState('')
  const [provinceNote, setProvinceNote] = useState('')
  const [birthplaceProvince, setBirthplaceProvince] = useState('')
  const [activityProvince, setActivityProvince] = useState('')
  const [keyword, setKeyword] = useState('')
  const [result, setResult] = useState<PersonListResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [activeGeoPicker, setActiveGeoPicker] = useState<'籍贯' | '出生地' | '活动地' | null>(null)

  useLoad(options => {
    if (options.provinceCode) setProvinceCode(options.provinceCode)
    if (options.provinceName) setProvinceName(options.provinceName)
  })

  useDidShow(() => {
    const pending = Taro.getStorageSync('peopleProvince')
    if (pending) {
      setProvinceCode(pending.code || '')
      setProvinceName(pending.name || '全部省份')
      setProvinceScope(pending.scope || '')
      setProvinceNote(pending.note || '')
      Taro.removeStorageSync('peopleProvince')
    }
  })

  useEffect(() => {
    let active = true
    setLoading(true)
    setFailed(false)
    callFunction<PersonListResult>('getPeople', {
      provinceCode,
      birthplaceProvince,
      activityProvince,
      keyword,
    })
      .then(data => {
        if (active) setResult(data)
      })
      .catch(error => {
        console.error('[People] 人物名单加载失败', error)
        if (active) {
          setResult(null)
          setFailed(true)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [provinceCode, birthplaceProvince, activityProvince, keyword, reloadKey])

  const clearFilters = () => {
    setProvinceCode('')
    setProvinceName('全部省份')
    setProvinceScope('')
    setProvinceNote('')
    setBirthplaceProvince('')
    setActivityProvince('')
    setKeyword('')
  }

  const people = result?.items || []
  const hasFilters = Boolean(provinceCode || birthplaceProvince || activityProvince || keyword)

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.heroBanner}>
          <Image
            className={styles.heroImage}
            src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=respectful%20historical%20Chinese%20revolutionary%20memorial%20scene%2C%20distant%20silhouettes%20of%20marching%20people%20on%20a%20mountain%20ridge%2C%20traditional%20ink%20wash%20painting%2C%20warm%20sepia%20and%20ivory%2C%20solemn%20and%20hopeful%2C%20no%20text%2C%20wide%20panorama&image_size=landscape_16_9"
            mode="aspectFill"
          />
          <View className={styles.heroShade} />
        </View>
        <Text className={styles.kicker}>英迹 · 山河英雄谱</Text>
        <Text className={styles.title}>{provinceName === '全部省份' ? '人物名单' : `${provinceName}人物名单`}</Text>
        <Text className={styles.subtitle}>按人物、事件与地域线索检索已发布资料</Text>
      </View>

      <SectionCard className={styles.searchCard}>
        <TextField value={keyword} placeholder="姓名 / 事件" icon="search" onChange={setKeyword} />
        <View className={styles.geoFilters}>
          <GeoPicker
            label="籍贯"
            value={provinceName === '全部省份' ? '' : provinceName}
            selectedIndex={provinceOptions.findIndex(option => option.code === provinceCode)}
            open={activeGeoPicker === '籍贯'}
            onToggle={() => setActiveGeoPicker(activeGeoPicker === '籍贯' ? null : '籍贯')}
            onChange={index => {
              const option = provinceOptions[index]
              setProvinceCode(option.code)
              setProvinceName(option.code ? option.name : '全部省份')
              setActiveGeoPicker(null)
            }}
          />
          <GeoPicker
            label="出生地"
            value={birthplaceProvince}
            selectedIndex={provinceNames.indexOf(birthplaceProvince || '全部')}
            open={activeGeoPicker === '出生地'}
            onToggle={() => setActiveGeoPicker(activeGeoPicker === '出生地' ? null : '出生地')}
            onChange={index => {
              setBirthplaceProvince(provinceOptions[index].name === '全部' ? '' : provinceOptions[index].name)
              setActiveGeoPicker(null)
            }}
          />
          <GeoPicker
            label="活动地"
            value={activityProvince}
            selectedIndex={provinceNames.indexOf(activityProvince || '全部')}
            open={activeGeoPicker === '活动地'}
            onToggle={() => setActiveGeoPicker(activeGeoPicker === '活动地' ? null : '活动地')}
            onChange={index => {
              setActivityProvince(provinceOptions[index].name === '全部' ? '' : provinceOptions[index].name)
              setActiveGeoPicker(null)
            }}
          />
        </View>
      </SectionCard>

      <SectionCard title={result ? `已发布资料 · ${result.total} 条` : '已发布资料'}>
        {(provinceScope || provinceNote) && <View className={styles.provinceNote}>
          {provinceScope && <Text>{provinceScope}</Text>}
          {provinceNote && <Text>{provinceNote}</Text>}
        </View>}
        {loading ? (
          <StatusMessage status="loading" />
        ) : failed ? (
          <StatusMessage
            status="error"
            detail="名单暂时无法加载，请检查网络后重试。"
            action="重新加载"
            onAction={() => setReloadKey(value => value + 1)}
          />
        ) : people.length === 0 ? (
          <StatusMessage
            status={hasFilters ? 'no-result' : 'empty'}
            detail={hasFilters ? '请尝试其他人物、事件或地域关键词，或清除筛选条件。' : '当前没有可公开展示的已发布资料。'}
            action={hasFilters ? '清除筛选' : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          />
        ) : (
          people.map(person => <PersonRow key={person.id} person={person} />)
        )}
        {result && <Text className={styles.coverage}>{result.coverage}</Text>}
        {!loading && !failed && people.length > 0 && <Text className={styles.moreNote}>更多人物正在持续整理中…</Text>}
      </SectionCard>

      <View className={styles.geoNote}>
        <Text>籍贯主归属用于省份统计；出生地与活动地仅作为独立字段检索，不计入省份统计。</Text>
      </View>
      <BottomNav current="人物" />
    </View>
  )
}

type GeoPickerProps = {
  label: string
  value: string
  selectedIndex: number
  open: boolean
  onToggle: () => void
  onChange: (index: number) => void
}

const GeoPicker: React.FC<GeoPickerProps> = ({
  label,
  value,
  selectedIndex,
  open,
  onToggle,
  onChange,
}) => (
  <View className={`${styles.geoPicker} ${open ? styles.geoPickerOpen : ''}`}>
    <View
      className={`${styles.geoSelect} ${value ? styles.geoSelectActive : ''}`}
      onClick={onToggle}
    >
      <Text className={styles.geoValue}>{value || label}</Text>
      <View className={`${styles.geoChevron} ${open ? styles.geoChevronOpen : ''}`} />
    </View>
    {open && (
      <View className={styles.geoMenu}>
        <ScrollView
          className={styles.geoMenuScroll}
          scrollY
          enhanced
          scrollIntoView={`province-${Math.max(0, selectedIndex)}`}
        >
          {provinceNames.map((name, index) => (
            <View
              key={name}
              id={`province-${index}`}
              className={`${styles.geoOption} ${index === selectedIndex ? styles.geoOptionActive : ''}`}
              onClick={() => onChange(index)}
            >
              <Text>{name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    )}
  </View>
)

const PersonRow: React.FC<{ person: PersonSummary }> = ({ person }) => {
  const openSource = () => {
    if (!person.detailUrl) return
    if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined') {
      window.open(person.detailUrl, '_blank', 'noopener,noreferrer')
      return
    }
    Taro.setClipboardData({ data: person.detailUrl })
      .then(() => Taro.showToast({ title: '来源链接已复制', icon: 'none' }))
      .catch(error => {
        console.error('[People] 来源链接复制失败', error)
        Taro.showToast({ title: '来源链接暂不可用', icon: 'none' })
      })
  }

  return (
    <View className={styles.person}>
      <Text className={styles.personName}>{person.name}</Text>
      <Text className={styles.meta}>{person.aliases.length ? `别名：${person.aliases.join('、')}` : '暂无公开别名'} · {person.category}</Text>
      <Text className={styles.meta}>{person.birthYear || '—'}—{person.deathYear || '—'} · 籍贯主归属：{person.provinceName}</Text>
      <Text className={styles.contribution}>{person.contribution}</Text>
      <View className={styles.sourceRow}>
        <Text className={styles.sourceLabel}>{person.sourceLabel}</Text>
        {person.detailUrl && <Text className={styles.sourceLink} onClick={openSource}>查看来源</Text>}
      </View>
    </View>
  )
}

export default PeoplePage
