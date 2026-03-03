import React, { createContext, useContext, useState } from "react"
import i18n, { getUserLang } from "../i18n"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null)

  const login = (credentials) => {
    const lang = getUserLang(credentials.username)
    i18n.changeLanguage(lang)
    setAuth(credentials)
  }

  const logout = () => {
    i18n.changeLanguage('en')
    setAuth(null)
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
