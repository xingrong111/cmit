import React from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'

const items = [
  { label: '山河', path: '/pages/index/index', icon: 'mountain' },
  { label: '人物', path: '/pages/people/index', icon: 'person' },
  { label: '足迹', path: '/pages/footprint/index', icon: 'pin' },
  { label: '互动', path: '/pages/interaction/index', icon: 'message' },
  { label: '文创', path: '/pages/learning/index', icon: 'gift' },
  { label: '我的', path: '/pages/profile/index', icon: 'profile' },
]

export const BottomNav: React.FC<{ current: string }> = ({ current }) => (
  <View className={styles.shell}>
    <View className={styles.brand} onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}>
      <Text className={styles.brandMark}>英迹</Text>
      <Text className={styles.brandName}>山河英雄谱</Text>
    </View>
    <View className={styles.nav}>
      {items.map(item => (
        <View
          key={item.label}
          className={`${styles.item} ${current === item.label ? styles.selected : ''}`}
          onClick={() => Taro.reLaunch({ url: item.path })}
        >
          <View className={`${styles.icon} ${styles[item.icon]}`}><View className={styles.iconCore} /></View>
          <Text className={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  </View>
)
