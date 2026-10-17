import React from 'react'
import { Text, View } from '@tarojs/components'
import { AppButton } from '@/components/AppButton'
import styles from './index.module.scss'
import type { Status } from '@/types/domain'

const labels: Record<Status, string> = {
  loading: '正在加载资料…',
  empty: '当前还没有公开资料',
  'no-result': '没有找到匹配的人物',
  error: '资料加载失败，请稍后重试',
  pending: '资料待整理，暂不能作为完整统计',
  'to-verify': '资料待核验',
  'to-review': '资料待审核',
  published: '已发布资料',
}

export const StatusMessage: React.FC<{ status: Status; detail?: string; action?: string; onAction?: () => void }> = ({ status, detail, action, onAction }) => (
  <View className={`${styles.status} ${styles[status]}`}>
    <Text className={styles.title}>{labels[status]}</Text>
    {detail && <Text className={styles.detail}>{detail}</Text>}
    {action && onAction && <View className={styles.action}><AppButton variant="secondary" onClick={onAction}>{action}</AppButton></View>}
  </View>
)
