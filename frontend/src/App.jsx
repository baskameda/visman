import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import LoginPage              from './pages/LoginPage'
import InviterDashboard       from './pages/InviterDashboard'
import SecurityDashboard      from './pages/SecurityDashboard'
import GatekeeperDashboard    from './pages/GatekeeperDashboard'
import InvitationHistoryPage  from './pages/InvitationHistoryPage'
import AdminDashboard         from './pages/AdminDashboard'

function RequireAuth({ children }) {
  const { auth } = useAuth()
  return auth ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { auth } = useAuth()

  const home = !auth ? '/login'
    : auth.role === 'SECURITY'   ? '/security'
    : auth.role === 'GATEKEEPER' ? '/gatekeeper'
    : auth.role === 'ADMIN'      ? '/admin'
    : '/inviter'

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/inviter"   element={<RequireAuth><InviterDashboard /></RequireAuth>} />
      <Route path="/security"  element={<RequireAuth><SecurityDashboard /></RequireAuth>} />
      <Route path="/gatekeeper"element={<RequireAuth><GatekeeperDashboard /></RequireAuth>} />
      <Route path="/history"   element={<RequireAuth><InvitationHistoryPage /></RequireAuth>} />
      <Route path="/admin"     element={<RequireAuth><AdminDashboard /></RequireAuth>} />
      <Route path="*"          element={<Navigate to={home} replace />} />
    </Routes>
  )
}
