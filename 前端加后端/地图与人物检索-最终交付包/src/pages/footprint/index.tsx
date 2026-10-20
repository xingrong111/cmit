import React from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppButton } from '@/components/AppButton'
import { BottomNav } from '@/components/BottomNav'
import { SectionCard } from '@/components/SectionCard'
import { StatusMessage } from '@/components/StatusMessage'
import styles from './index.module.scss'

export default function FootprintPage() {
  return (
    <View className={styles.page}>
      <Text className={styles.title}>足迹</Text>
      <SectionCard>
        <StatusMessage status="pending" detail="历史足迹地图属于独立定位功能，当前页面尚未接入定位服务。" />
        <AppButton variant="secondary" onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}>
          返回山河
        </AppButton>
      </SectionCard>
      <BottomNav current="足迹" />
    </View>
  )
}
