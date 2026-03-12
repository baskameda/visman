import React from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { clearAll } from './api/db'
import LoginPage    from './pages/LoginPage'
import VisitListPage from './pages/VisitListPage'

function AppInner() {
  const { auth, logout } = useAuth()

  const handleLogout = () => {
    clearAll()  // wipe cached visits and queue on explicit logout
    logout()
  }

  if (!auth) return <LoginPage />
  return <VisitListPage onLogout={handleLogout} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
