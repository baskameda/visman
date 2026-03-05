import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({ dark: false, toggleDark: () => {} })

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('ld-dark') === 'true' } catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem('ld-dark', String(dark)) } catch {}
  }, [dark])

  const toggleDark = () => setDark(d => !d)

  return (
    <ThemeContext.Provider value={{ dark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }
