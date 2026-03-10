import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import i18n, { getUserLang } from "../i18n"
import { getUserProfile } from "../api/operatonApi"

const AuthContext = createContext(null)
const SESSION_MS = 9 * 60 * 60 * 1000   // 9 hours

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null)

  const logout = useCallback(() => {
    localStorage.removeItem('loginAt')
    i18n.changeLanguage('en')
    setAuth(null)
  }, [])

  const login = async (credentials) => {
    let full = credentials
    try {
      const profile = await getUserProfile(credentials)
      full = {
        ...credentials,
        firstName: profile.firstName ?? '',
        lastName:  profile.lastName  ?? '',
      }
    } catch {
      // profile fetch failed — proceed without name
    }
    localStorage.setItem('loginAt', Date.now().toString())
    sessionStorage.setItem('greeting_pending', '1')
    const lang = getUserLang(full.username)
    i18n.changeLanguage(lang)
    setAuth(full)
  }

  // Cat 7: reset the session clock without re-authenticating
  const extendSession = useCallback(() => {
    localStorage.setItem('loginAt', Date.now().toString())
    // Spread auth into a new object so the auto-logout useEffect re-runs
    // and picks up the fresh loginAt value from localStorage.
    setAuth(prev => prev ? { ...prev } : prev)
  }, [])

  // Auto-logout after 9 hours
  useEffect(() => {
    if (!auth) return
    const loginAt = parseInt(localStorage.getItem('loginAt') ?? '0', 10)
    const remaining = loginAt + SESSION_MS - Date.now()
    if (remaining <= 0) { logout(); return }
    const id = setTimeout(logout, remaining)
    return () => clearTimeout(id)
  }, [auth, logout])

  return (
    <AuthContext.Provider value={{ auth, login, logout, extendSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
