import React from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppButton } from '@/components/AppButton'
import { BottomNav } from '@/components/BottomNav'
import { SectionCard } from '@/components/SectionCard'
import { StatusMessage } from '@/components/StatusMessage'
import styles from './index.module.scss'

export default function LearningPage() {
  return (
    <View className={styles.page}>
      <Text className={styles.title}>文创</Text>
      <SectionCard>
        <StatusMessage status="pending" detail="文创内容与商品服务尚未接入，当前不展示虚构商品或购买记录。" />
        <AppButton variant="secondary" onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}>
          返回山河
        </AppButton>
      </SectionCard>
      <BottomNav current="文创" />
    </View>
  )
}
