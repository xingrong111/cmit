import React, { useEffect, useState } from 'react'
import { Text, View } from '@tarojs/components'
import { BottomNav } from '@/components/BottomNav'
import { SectionCard } from '@/components/SectionCard'
import { StatusMessage } from '@/components/StatusMessage'
import { callFunction } from '@/services/cloud'
import type { StatisticsExplanation } from '@/types/domain'
import styles from './index.module.scss'

const StatisticsPage: React.FC = () => {
  const [data, setData] = useState<StatisticsExplanation | null>(null)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setFailed(false)
    callFunction<StatisticsExplanation>('getStatisticsExplanation')
      .then(result => {
        if (active) setData(result)
      })
      .catch(error => {
        console.error('[Statistics] 统计说明加载失败', error)
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [reloadKey])

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.kicker}>统计口径说明</Text>
        <Text className={styles.title}>数字从哪里来</Text>
        <Text className={styles.subtitle}>让每一个省份数字都能回到逐人记录与公开依据。</Text>
      </View>
      {failed ? (
        <SectionCard>
          <StatusMessage
            status="error"
            detail="统计说明暂时无法加载，请检查网络后重试。"
            action="重新加载"
            onAction={() => setReloadKey(value => value + 1)}
          />
        </SectionCard>
      ) : !data ? (
        <SectionCard><StatusMessage status="loading" /></SectionCard>
      ) : (
        <View>
          <SectionCard title="统计范围">
            <Text className={styles.body}>{data.period}</Text>
            <Text className={styles.body}>{data.coverage}</Text>
            <Text className={styles.updated}>更新时间：{data.updatedAt}</Text>
          </SectionCard>
          <RuleCard title="纳入条件" items={data.admission} />
          <RuleCard title="地理口径" items={data.geography} />
          <RuleCard title="去重与发布" items={data.deduplication} />
          <SectionCard title="状态说明">
            <View className={styles.statusLine}>
              <Text className={styles.badge}>已发布</Text>
              <Text className={styles.statusText}>完成必要核验并允许用户检索的资料。</Text>
            </View>
            <View className={styles.statusLine}>
              <Text className={styles.badgePending}>待整理</Text>
              <Text className={styles.statusText}>当前没有足够公开样本，不能解释为历史人数为0。</Text>
            </View>
          </SectionCard>
        </View>
      )}
      <BottomNav current="人物" />
    </View>
  )
}

const RuleCard: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <SectionCard title={title}>
    <View>
      {items.map(item => (
        <View className={styles.rule} key={item}>
          <Text className={styles.dot}>·</Text>
          <Text className={styles.body}>{item}</Text>
        </View>
      ))}
    </View>
  </SectionCard>
)

export default StatisticsPage
