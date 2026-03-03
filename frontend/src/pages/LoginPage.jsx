import React, { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
} from '@mui/material'
import PersonIcon        from '@mui/icons-material/Person'
import LockIcon          from '@mui/icons-material/Lock'
import VisibilityIcon    from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import SecurityIcon      from '@mui/icons-material/Security'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import AddCircleOutlineIcon   from '@mui/icons-material/AddCircleOutline'
import ContentCopyIcon        from '@mui/icons-material/ContentCopy'
import CheckIcon              from '@mui/icons-material/Check'
import { useNavigate }   from 'react-router-dom'
import { useAuth }       from '../context/AuthContext'
import { verifyIdentity, getUserGroups, getWebAdminUsers, createSuperheroAdmin } from '../api/operatonApi'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'

// ─── Role mapping ─────────────────────────────────────────────────────────────
const GROUP_ROLE_MAP = {
  Invitors:   'INVITER',
  Security:   'SECURITY',
  Porters:    'GATEKEEPER',
  webAdmins:  'ADMIN',
}

// ─── Demo accounts (non-admin – always shown) ─────────────────────────────────
// roleKey maps to t('roles.INVITER') etc. — translated at render time
const ROLE_ACCOUNTS = [
  { username: 'inviter1',    password: 'inviter123',  roleKey: 'INVITER'    },
  { username: 'security1',   password: 'security123', roleKey: 'SECURITY'   },
  { username: 'gatekeeper1', password: 'porter123',   roleKey: 'GATEKEEPER' },
]

// ─── Credential badge inside the info dialog ──────────────────────────────────
function CredBadge({ label, value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      px: 2, py: 1.2, borderRadius: 2,
      bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider',
    }}>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
        <Typography variant="body1" fontWeight={700} sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>
          {value}
        </Typography>
      </Box>
      <IconButton size="small" onClick={copy} color={copied ? 'success' : 'default'}>
        {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
      </IconButton>
    </Box>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const { t }      = useTranslation()

  // Admin button state
  const [checkingAdmin, setCheckingAdmin]   = useState(true)   // true while probing webAdmins
  const [hasAdminUser, setHasAdminUser]     = useState(false)
  const [adminAccounts, setAdminAccounts]   = useState([])     // users in webAdmins

  // Create admin state
  const [creating, setCreating]             = useState(false)
  const [createError, setCreateError]       = useState('')
  const [createdDialogOpen, setCreatedDialogOpen] = useState(false)

  // ── Check webAdmins on mount ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const members = await getWebAdminUsers()
      if (cancelled) return
      setAdminAccounts(members)
      setHasAdminUser(members.length > 0)
      setCheckingAdmin(false)
    })()
    return () => { cancelled = true }
  }, [])

  // ── Login handler ───────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await verifyIdentity(username.trim(), password)
      if (!result.authenticated) {
        setError(t('login.invalidCredentials'))
        return
      }
      const credentials = { username: username.trim(), password }
      const groups      = await getUserGroups(credentials)
      const groupIds    = groups.map(g => g.id)

      // First matching group wins; fall back to ADMIN for unmapped users
      let role = 'ADMIN'
      for (const [groupId, r] of Object.entries(GROUP_ROLE_MAP)) {
        if (groupIds.includes(groupId)) { role = r; break }
      }

      login({ ...credentials, firstName: username.trim(), role })
      const routes = { INVITER: '/inviter', SECURITY: '/security', GATEKEEPER: '/gatekeeper', ADMIN: '/admin' }
      navigate(routes[role] ?? '/inviter')
    } catch (err) {
      setError(err.response?.data?.message ?? t('login.serverError'))
    } finally {
      setLoading(false)
    }
  }

  // ── Quick-fill ──────────────────────────────────────────────────────────────
  const fillAccount = (acc) => {
    setUsername(acc.username)
    setPassword(acc.password)
    setError('')
  }

  // ── Create Superhero admin ──────────────────────────────────────────────────
  const handleCreateAdmin = async () => {
    setCreating(true)
    setCreateError('')
    try {
      await createSuperheroAdmin()
      // Re-check webAdmins so the button switches to "Admin" immediately
      const members = await getWebAdminUsers()
      setAdminAccounts(members)
      setHasAdminUser(true)
      setCreatedDialogOpen(true)
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? 'Unknown error'
      // If user already exists Operaton returns 500 with a specific message
      if (msg.toLowerCase().includes('already') || err.response?.status === 500) {
        // Still wire up the membership and open the dialog
        try { await getWebAdminUsers().then(m => { setAdminAccounts(m); setHasAdminUser(m.length > 0) }) } catch {}
        setCreatedDialogOpen(true)
      } else {
        setCreateError(t('login.failedToCreate', { error: msg }))
      }
    } finally {
      setCreating(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      bgcolor: 'background.default', p: 2,
    }}>
      {/* Language switcher - top right */}
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <LanguageSwitcher />
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">{t("login.title")}</Typography>
          <Typography variant="body2" color="text.secondary">{t("login.subtitle")}</Typography>
        </Box>
      </Box>

      {/* Card */}
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>{t("login.signIn")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("login.useCredentials")}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('login.username')} value={username} onChange={e => setUsername(e.target.value)}
              required fullWidth autoFocus
              InputProps={{ startAdornment: (
                <InputAdornment position="start"><PersonIcon fontSize="small" color="action" /></InputAdornment>
              )}}
            />
            <TextField
              label={t('login.password')} type={showPw ? 'text' : 'password'}
              value={password} onChange={e => setPassword(e.target.value)}
              required fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><LockIcon fontSize="small" color="action" /></InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPw(p => !p)}>
                      {showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ mt: 1 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : t('login.signIn')}
            </Button>
          </Box>

          {/* ── Quick-fill buttons ── */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">{t('login.quickFill')}</Typography>
          </Divider>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Role accounts – always visible */}
            {ROLE_ACCOUNTS.map(acc => (
              <Button key={acc.username} variant="outlined" size="small"
                onClick={() => fillAccount(acc)}
                sx={{ justifyContent: 'flex-start', gap: 1 }}>
                <PersonIcon fontSize="small" />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" fontWeight={600}>{acc.username}</Typography>
                  <Typography variant="caption" color="text.secondary">{t('roles.' + acc.roleKey)}</Typography>
                </Box>
              </Button>
            ))}

            {/* Admin section – loading spinner, then Admin or Create Admin */}
            {checkingAdmin ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                <CircularProgress size={18} />
              </Box>
            ) : hasAdminUser ? (
              /* Show a button for each webAdmins member found */
              adminAccounts.map(u => (
                <Button key={u.id} variant="outlined" size="small" color="secondary"
                  onClick={() => fillAccount({
                    username: u.id,
                    password: u.id === 'superhero' ? 'test123' : 'admin',
                  })}
                  sx={{ justifyContent: 'flex-start', gap: 1 }}>
                  <AdminPanelSettingsIcon fontSize="small" />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" fontWeight={600}>{u.id}</Typography>
                    <Typography variant="caption" color="text.secondary">{t('roles.ADMIN')}</Typography>
                  </Box>
                </Button>
              ))
            ) : (
              /* No admin in webAdmins → offer creation */
              <Box>
                {createError && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setCreateError('')}>{createError}</Alert>}
                <Button
                  variant="outlined" size="small" color="warning" fullWidth
                  startIcon={creating ? <CircularProgress size={14} color="inherit" /> : <AddCircleOutlineIcon />}
                  onClick={handleCreateAdmin}
                  disabled={creating}
                  sx={{ justifyContent: 'flex-start', gap: 1 }}
                >
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" fontWeight={600}>{t('login.createAdminUser')}</Typography>
                    <Typography variant="caption" color="text.secondary">{t('login.noAdminFound')}</Typography>
                  </Box>
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 3 }}>
        {t('login.cockpitPrefix')} ·{' '}
        <a href="http://localhost:8080/operaton/app/cockpit" target="_blank" rel="noreferrer"
          style={{ color: 'inherit' }}>{t('login.cockpitLink')}</a>
      </Typography>

      {/* ── Created confirmation dialog ── */}
      <Dialog open={createdDialogOpen} onClose={() => setCreatedDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettingsIcon color="success" />
          {t('login.adminCreated')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {t('login.adminCreatedDesc', { group: 'webAdmins' })}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <CredBadge label={t('login.username')} value="superhero" />
            <CredBadge label={t('login.password')} value="test123"   />
          </Box>
          <Alert severity="warning" sx={{ mt: 2.5 }} icon={false}>
            {t('login.changePassword')}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              setCreatedDialogOpen(false)
              fillAccount({ username: 'superhero', password: 'test123' })
            }}
          >
            {t('login.fillAndSignIn')}
          </Button>
          <Button onClick={() => setCreatedDialogOpen(false)}>{t("login.dismiss")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
