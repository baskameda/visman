import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getUserProfile } from '../api/api'

const AuthContext = createContext(null)
const STORAGE_KEY = 'gate_auth'
const SESSION_MS  = 9 * 60 * 60 * 1000   // 9 hours

function loadStored() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? null }
  catch { return null }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStored)

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('loginAt')
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full))
    localStorage.setItem('loginAt', Date.now().toString())
    sessionStorage.setItem('greeting_pending', '1')
    setAuth(full)
  }

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
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
