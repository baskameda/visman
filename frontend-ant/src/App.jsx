import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth }    from './context/AuthContext'
import { useLicence } from './context/LicenceContext'
import FeatureNotLicensed from './components/FeatureNotLicensed'

import LoginPage              from './pages/LoginPage'
import InviterDashboard       from './pages/InviterDashboard'
import SecurityDashboard      from './pages/SecurityDashboard'
import GatekeeperDashboard    from './pages/GatekeeperDashboard'
import InvitationHistoryPage  from './pages/InvitationHistoryPage'
import AdminDashboard            from './pages/AdminDashboard'
import SupervisorAssignmentPage from './pages/SupervisorAssignmentPage'
import EntrancesPage            from './pages/EntrancesPage'
import LocationsPage            from './pages/LocationsPage'
import PerformancePage          from './pages/PerformancePage'
import LicencePage              from './pages/LicencePage'

// ── Guard: redirect to /login if not authenticated ────────────────────────────
function RequireAuth({ children }) {
  const { auth } = useAuth()
  return auth ? children : <Navigate to="/login" replace />
}

// ── Guard: show FeatureNotLicensed when the feature toggle is off ─────────────
function LicenceGuard({ feature, children }) {
  const { featureActive } = useLicence()
  return featureActive[feature] ? children : <FeatureNotLicensed feature={feature} />
}

// ── Maps each role to the feature that controls its pages ─────────────────────
const ROLE_FEATURE = { SECURITY: 'security', INVITER: 'inviter', GATEKEEPER: 'gatekeeper' }

// ── Watcher: auto-logout when the user's own role feature is deactivated ──────
function LicenceWatcher() {
  const { auth, logout }  = useAuth()
  const { featureActive } = useLicence()
  const navigate          = useNavigate()

  useEffect(() => {
    if (!auth) return
    const feature = ROLE_FEATURE[auth.role]
    if (!feature) return                        // ADMIN has no feature gate
    if (featureActive[feature] === false) {
      logout()
      navigate('/login', { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureActive.security, featureActive.inviter, featureActive.gatekeeper, auth?.role])

  return null
}

export default function App() {
  const { auth } = useAuth()

  // Determine the default landing page from role
  const home = !auth ? '/login'
    : auth.role === 'SECURITY'   ? '/security'
    : auth.role === 'GATEKEEPER' ? '/gatekeeper'
    : auth.role === 'ADMIN'      ? '/admin'
    : '/inviter'

  return (
    <>
      <LicenceWatcher />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/inviter" element={
          <RequireAuth><LicenceGuard feature="inviter"><InviterDashboard /></LicenceGuard></RequireAuth>
        } />
        <Route path="/security" element={
          <RequireAuth><LicenceGuard feature="security"><SecurityDashboard /></LicenceGuard></RequireAuth>
        } />
        <Route path="/gatekeeper" element={
          <RequireAuth><LicenceGuard feature="gatekeeper"><GatekeeperDashboard /></LicenceGuard></RequireAuth>
        } />
        <Route path="/history" element={
          <RequireAuth><LicenceGuard feature="inviter"><InvitationHistoryPage /></LicenceGuard></RequireAuth>
        } />
        <Route path="/admin" element={
          <RequireAuth><AdminDashboard /></RequireAuth>
        } />
        <Route path="/supervisor-admin" element={
          <RequireAuth><SupervisorAssignmentPage /></RequireAuth>
        } />
        <Route path="/entrances" element={
          <RequireAuth><EntrancesPage /></RequireAuth>
        } />
        <Route path="/locations" element={
          <RequireAuth><LocationsPage /></RequireAuth>
        } />
        <Route path="/performance" element={
          <RequireAuth><LicenceGuard feature="gamification"><PerformancePage /></LicenceGuard></RequireAuth>
        } />
        <Route path="/licence" element={
          <RequireAuth><LicencePage /></RequireAuth>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
    </>
  )
}
