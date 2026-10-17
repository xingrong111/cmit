import React from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppButton } from '@/components/AppButton'
import { BottomNav } from '@/components/BottomNav'
import { SectionCard } from '@/components/SectionCard'
import { StatusMessage } from '@/components/StatusMessage'
import styles from './index.module.scss'

export default function ProfilePage() {
  return (
    <View className={styles.page}>
      <Text className={styles.title}>我的</Text>
      <SectionCard>
        <StatusMessage status="pending" detail="账户与个人学习记录尚未接入，当前不展示虚构的完成状态。" />
        <AppButton variant="secondary" onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}>
          返回山河
        </AppButton>
      </SectionCard>
      <BottomNav current="我的" />
    </View>
  )
}
