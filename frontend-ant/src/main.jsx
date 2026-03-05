import React, { useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/de'
import 'dayjs/locale/it'
import 'dayjs/locale/fr'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/ru'

import { ThemeProvider, useTheme } from './context/ThemeContext'
import { AuthProvider }            from './context/AuthContext'
import App from './App'
import './i18n/index.js'

dayjs.locale('en')

const sharedTokens = {
  colorPrimary:   '#1677ff',
  colorSuccess:   '#52c41a',
  colorWarning:   '#faad14',
  colorError:     '#ff4d4f',
  colorInfo:      '#1677ff',
  fontFamily:     "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize:       14,
  borderRadius:   8,
  borderRadiusLG: 12,
  borderRadiusSM: 4,
}

function ThemedApp() {
  const { dark } = useTheme()

  const theme = useMemo(() => ({
    algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      ...sharedTokens,
      colorBgContainer: dark ? '#1f1f1f' : '#ffffff',
      colorBgLayout:    dark ? '#141414' : '#f5f5f5',
    },
    components: {
      Layout: {
        siderBg:   dark ? '#1f1f1f' : '#ffffff',
        headerBg:  dark ? '#1f1f1f' : '#ffffff',
        bodyBg:    dark ? '#141414' : '#f5f5f5',
        triggerBg: dark ? '#2a2a2a' : '#f0f0f0',
      },
      Menu: {
        itemBg:            'transparent',
        itemSelectedBg:    dark ? '#1677ff22' : '#e6f4ff',
        itemSelectedColor: dark ? '#4096ff'   : '#1677ff',
        itemHoverBg:       dark ? '#ffffff0d' : '#f5f5f5',
      },
    },
  }), [dark])

  return (
    <ConfigProvider theme={theme}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
