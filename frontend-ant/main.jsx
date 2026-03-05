import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/de'
import 'dayjs/locale/it'
import 'dayjs/locale/fr'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/ru'

import { ThemeProvider, useTheme } from './context/ThemeContext'
import { AuthProvider }            from './context/AuthContext'
import { lightTheme, darkTheme }   from './theme'
import App from './App'
import './i18n/index.js'

dayjs.locale('en')

// Inner wrapper reads theme context and feeds ConfigProvider
function ThemedApp() {
  const { dark } = useTheme()
  return (
    <ConfigProvider theme={dark ? darkTheme : lightTheme}>
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
