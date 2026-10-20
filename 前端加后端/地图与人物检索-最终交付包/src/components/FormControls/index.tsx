import React from 'react'
import { Input, Picker, Text, View } from '@tarojs/components'
import styles from './index.module.scss'

type TextFieldProps = {
  value: string
  placeholder: string
  onChange: (value: string) => void
  icon?: 'search'
}

type SelectFieldProps = {
  label: string
  value: string
  range: string[]
  selectedIndex: number
  onChange: (index: number) => void
}

export const TextField: React.FC<TextFieldProps> = ({ value, placeholder, onChange, icon }) => (
  icon === 'search' ? (
    <View className={styles.searchBox}>
      <View className={styles.searchIcon}>
        <View className={styles.searchGlass} />
        <View className={styles.searchHandle} />
      </View>
      <Input
        className={styles.searchInput}
        value={value}
        placeholder={placeholder}
        placeholderClass={styles.placeholder}
        onInput={event => onChange(event.detail.value)}
      />
    </View>
  ) : (
    <Input
      className={styles.input}
      value={value}
      placeholder={placeholder}
      placeholderClass={styles.placeholder}
      onInput={event => onChange(event.detail.value)}
    />
  )
)

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  range,
  selectedIndex,
  onChange,
}) => (
  <Picker
    mode="selector"
    range={range}
    value={selectedIndex}
    onChange={event => onChange(Number(event.detail.value))}
  >
    <View className={styles.select}>
      <View className={styles.selectText}>
        <Text className={styles.label}>{label}</Text>
        <Text className={styles.value}>{value}</Text>
      </View>
      <View className={styles.chevron} />
    </View>
  </Picker>
)
