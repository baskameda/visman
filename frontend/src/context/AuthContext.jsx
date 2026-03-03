import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null)
  // auth = { username, password, firstName, role: 'INVITER' | 'SECURITY' | 'GATEKEEPER' | 'ADMIN' }

  const login = (credentials) => setAuth(credentials)
  const logout = () => setAuth(null)

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
