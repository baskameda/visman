import React, { useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { ThemeProvider, CssBaseline } from '@mui/material'

import { ThemeProvider as AppThemeProvider, useAppTheme } from './context/ThemeContext'
import { createAppTheme } from './theme'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './i18n'

const fontLink = document.createElement('link')
fontLink.rel  = 'stylesheet'
fontLink.href = 'https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,400;0,6..12,600;0,6..12,700;1,6..12,400;1,6..12,700&display=swap'
document.head.appendChild(fontLink)

function ThemedApp() {
  const { dark } = useAppTheme()
  const theme = useMemo(() => createAppTheme(dark ? 'dark' : 'light'), [dark])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppThemeProvider>
        <ThemedApp />
      </AppThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
