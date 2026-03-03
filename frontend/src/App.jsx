import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage             from './pages/LoginPage'
import InviterDashboard      from './pages/InviterDashboard'
import InvitationHistoryPage from './pages/InvitationHistoryPage'
import SecurityDashboard     from './pages/SecurityDashboard'
import GatekeeperDashboard   from './pages/GatekeeperDashboard'
import AdminDashboard        from './pages/AdminDashboard'

function RequireAuth({ children }) {
  const { auth } = useAuth()
  return auth ? children : <Navigate to="/login" replace />
}

function RoleRedirect() {
  const { auth } = useAuth()
  if (!auth) return <Navigate to="/login" replace />
  const routes = {
    INVITER:    '/inviter',
    SECURITY:   '/security',
    GATEKEEPER: '/gatekeeper',
    ADMIN:      '/admin',
  }
  return <Navigate to={routes[auth.role] ?? '/inviter'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/"                element={<RoleRedirect />} />
      <Route path="/inviter"         element={<RequireAuth><InviterDashboard /></RequireAuth>} />
      <Route path="/inviter/history" element={<RequireAuth><InvitationHistoryPage /></RequireAuth>} />
      <Route path="/security"        element={<RequireAuth><SecurityDashboard /></RequireAuth>} />
      <Route path="/gatekeeper"      element={<RequireAuth><GatekeeperDashboard /></RequireAuth>} />
      <Route path="/admin"           element={<RequireAuth><AdminDashboard /></RequireAuth>} />
      <Route path="*"                element={<Navigate to="/" replace />} />
    </Routes>
  )
}
