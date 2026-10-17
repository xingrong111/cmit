import React, { PropsWithChildren } from 'react'
import Taro, { useDidHide, useDidShow } from '@tarojs/taro'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useDidShow(() => {
    if (process.env.TARO_ENV === 'weapp') {
      Taro.cloud.init({ env: 'yingji-prod-d0gxyyt7e193f6f07', traceUser: true })
    }
  })
  useDidHide(() => {})
  return children
}

export default App
