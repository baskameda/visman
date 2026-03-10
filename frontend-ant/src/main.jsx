import React, { useMemo, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import i18next from 'i18next'
import dayjs from 'dayjs'
import 'dayjs/locale/de'
import 'dayjs/locale/it'
import 'dayjs/locale/fr'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/ru'

import { ThemeProvider, useTheme } from './context/ThemeContext'
import { AuthProvider }            from './context/AuthContext'
import { HelpProvider }            from './context/HelpContext'
import { LicenceProvider }         from './context/LicenceContext'
import App from './App'
import './i18n/index.js'
import './a11y.css'
import './api/licenceInterceptor'   // installs the licence-enforcement axios interceptor

dayjs.locale('en')

// ── Cat 1: sync <html lang="…"> with i18n language ────────────────────────────
function LangSync() {
  useEffect(() => {
    const sync = (lng) => {
      document.documentElement.lang = lng === 'zh' ? 'zh-Hans' : lng
    }
    sync(i18next.language ?? 'en')
    i18next.on('languageChanged', sync)
    return () => i18next.off('languageChanged', sync)
  }, [])
  return null
}

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
      colorBgContainer:    dark ? '#1f1f1f' : '#ffffff',
      colorBgLayout:       dark ? '#141414' : '#f5f5f5',
      // Cat 2: accessible secondary text — #8c8c8c fails AA on white (3.37:1)
      colorTextSecondary:  dark ? '#a0a0a0' : '#6b6b6b',
      colorTextDescription: dark ? '#a0a0a0' : '#6b6b6b',
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
      <LangSync />
      <AuthProvider>
        <LicenceProvider>
          <HelpProvider>
            <App />
          </HelpProvider>
        </LicenceProvider>
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
