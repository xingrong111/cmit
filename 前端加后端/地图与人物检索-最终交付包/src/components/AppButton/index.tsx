import React from 'react'
import { Button } from '@tarojs/components'
import styles from './index.module.scss'

type AppButtonProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  loading?: boolean
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export const AppButton: React.FC<AppButtonProps> = ({
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  style,
  onClick,
}) => (
  <Button
    className={`${styles.button} ${styles[variant]} ${className}`}
    style={style}
    disabled={disabled || loading}
    loading={loading}
    onClick={onClick}
  >
    {loading ? '提交中…' : children}
  </Button>
)
