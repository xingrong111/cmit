import React from 'react'
import { Text, View } from '@tarojs/components'
import styles from './index.module.scss'

export const SectionCard: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <View className={`${styles.card} ${className}`}>
    {title && <Text className={styles.title}>{title}</Text>}
    {children}
  </View>
)
