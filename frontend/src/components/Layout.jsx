import React, { useState } from 'react'
import {
  Box, Drawer, AppBar, Toolbar, Typography, Avatar, Chip,
  IconButton, Tooltip, List, ListItemButton,
  ListItemIcon, ListItemText, useMediaQuery, useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import MenuIcon               from '@mui/icons-material/Menu'
import MenuOpenIcon           from '@mui/icons-material/MenuOpen'
import LogoutIcon             from '@mui/icons-material/Logout'
import DashboardIcon          from '@mui/icons-material/Dashboard'
import AssignmentIcon         from '@mui/icons-material/Assignment'
import HistoryIcon            from '@mui/icons-material/History'
import SecurityIcon           from '@mui/icons-material/Security'
import MeetingRoomIcon        from '@mui/icons-material/MeetingRoom'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import Tx from './Tx.jsx'
import { useAuth } from '../context/AuthContext'

const DRAWER_WIDTH     = 220
const DRAWER_COLLAPSED = 64

const ROLE_COLORS = {
  INVITER:    { color: '#1677ff', bg: '#e6f4ff', border: '#91caff' },
  SECURITY:   { color: '#d46b08', bg: '#fff7e6', border: '#ffd591' },
  GATEKEEPER: { color: '#531dab', bg: '#f9f0ff', border: '#d3adf7' },
  ADMIN:      { color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' },
}

const NAV_DEF = {
  INVITER:    [
    { key: 'nav.myTasks',    path: '/inviter',         Icon: AssignmentIcon },
    { key: 'nav.history',    path: '/inviter/history',  Icon: HistoryIcon   },
  ],
  SECURITY:   [{ key: 'nav.myTasks',   path: '/security',   Icon: SecurityIcon           }],
  GATEKEEPER: [{ key: 'nav.gateEntry', path: '/gatekeeper', Icon: MeetingRoomIcon        }],
  ADMIN:      [{ key: 'nav.dashboard', path: '/admin',       Icon: AdminPanelSettingsIcon }],
}

function NavItem({ item, active, collapsed, roleColor }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <Tooltip title={collapsed ? t(item.key) : ''} placement="right">
      <ListItemButton
        onClick={() => navigate(item.path)}
        sx={{
          mx: 0.75, mb: 0.25, borderRadius: 1.5, minHeight: 40,
          px: collapsed ? 0 : 1.25,
          justifyContent: collapsed ? 'center' : 'flex-start',
          position: 'relative',
          color:  active ? roleColor : 'text.secondary',
          bgcolor: active ? alpha(roleColor, 0.08) : 'transparent',
          '&::before': active ? {
            content: '""', position: 'absolute',
            left: 0, top: '20%', height: '60%', width: 3,
            borderRadius: '0 2px 2px 0', bgcolor: roleColor,
          } : {},
          '&:hover': {
            bgcolor: active ? alpha(roleColor, 0.12) : 'action.hover',
            color: active ? roleColor : 'text.primary',
          },
          transition: 'all 0.15s ease',
        }}
      >
        <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 32, color: 'inherit', '& svg': { fontSize: 18 } }}>
          <item.Icon />
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={<Tx k={item.key} />}
            primaryTypographyProps={{ fontSize: '0.857rem', fontWeight: active ? 700 : 500, lineHeight: 1.3 }}
          />
        )}
      </ListItemButton>
    </Tooltip>
  )
}

function DrawerContent({ collapsed, onToggle, auth, meta, navItems, location, editMode, onEditToggle }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { t } = useTranslation()
  const initials = auth?.firstName
    ? auth.firstName.slice(0, 1).toUpperCase() + (auth.firstName.slice(1, 2) ?? '')
    : '?'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Logo row */}
      <Box sx={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        px: collapsed ? 0 : 1.5, minHeight: '4.5rem',
        borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Tooltip title={editMode ? 'Exit label edit' : 'Edit labels'} placement="right">
          <Box onClick={onEditToggle} sx={{
            width: 28, height: 28, borderRadius: 1.5, flexShrink: 0,
            background: editMode ? 'linear-gradient(135deg,#d46b08,#fa8c16)' : `linear-gradient(135deg, ${meta.color} 0%, ${alpha(meta.color, 0.65)} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: editMode ? '0 0 0 3px rgba(212,107,8,0.4)' : 'none',
            transition: 'all 0.2s',
            '&:hover': { opacity: 0.82, transform: 'scale(1.1)' },
          }}>
            <DashboardIcon sx={{ color: '#fff', fontSize: 15 }} />
          </Box>
          </Tooltip>
          {!collapsed && (
            <Typography variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Tx k='nav.visitorMgmt' />
            </Typography>
          )}
        </Box>
        {!collapsed && (
          <IconButton size="small" onClick={onToggle} sx={{ ml: 0.5 }}>
            <MenuOpenIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      {/* Role chip */}
      {!collapsed && (
        <Box sx={{ px: 1.75, py: 1 }}>
          <Chip label={meta.label} size="small" sx={{
            bgcolor: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
            fontWeight: 700, fontSize: '0.714rem', height: 20,
          }} />
        </Box>
      )}

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 0.5 }}>
        <List dense disablePadding>
          {navItems.map(item => (
            <NavItem key={item.path} item={item}
              active={location.pathname === item.path}
              collapsed={collapsed} roleColor={meta.color}
            />
          ))}
        </List>
      </Box>

      {/* User + logout */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: collapsed ? '0.75rem 0' : '0.75rem', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: meta.color, flexShrink: 0 }}>
              {initials}
            </Avatar>
            {!collapsed && (
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', lineHeight: 1.2 }}>
                  {auth?.firstName ?? auth?.username}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.714rem', lineHeight: 1 }}>
                  {auth?.username}
                </Typography>
              </Box>
            )}
          </Box>
          {!collapsed && (
            <Tooltip title={t('nav.signOut')}>
              <IconButton size="small" onClick={() => { logout(); navigate('/login') }} sx={{
                width: 28, height: 28, borderRadius: 1, border: '1px solid', borderColor: 'divider', flexShrink: 0,
                '&:hover': { borderColor: 'error.main', color: 'error.main', bgcolor: '#fff2f0' },
              }}>
                <LogoutIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {collapsed && (
          <Tooltip title={t('nav.signOut')} placement="right">
            <IconButton size="small" onClick={() => { logout(); navigate('/login') }}
              sx={{ mt: 0.75, width: '100%', borderRadius: 1, '&:hover': { color: 'error.main', bgcolor: '#fff2f0' } }}>
              <LogoutIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  )
}

export default function Layout({ children }) {
  const { auth } = useAuth()
  const location  = useLocation()
  const theme     = useTheme()
  const isMobile  = useMediaQuery(theme.breakpoints.down('md'))

  const [collapsed,        setCollapsed]        = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const { t }   = useTranslation()
  const [editMode, setEditMode] = useState(false)
  const toggleEditMode = () => {
    const next = !editMode
    setEditMode(next)
    window.__labelEditMode = next
    window.dispatchEvent(new CustomEvent('labelEditModeChange', { detail: next }))
  }
  const role    = auth?.role ?? 'INVITER'
  const colors  = ROLE_COLORS[role] ?? ROLE_COLORS.INVITER
  const meta    = { ...colors, label: t('roles.' + role) }
  const navItems = (() => {
    const base = NAV_DEF[role] ?? []
    if (auth?.isAlsoAdmin && role !== 'ADMIN') {
      return [{ key: 'nav.admin', path: '/admin', Icon: AdminPanelSettingsIcon, isAdmin: true, color: '#389e0d' }, ...base]
    }
    return base
  })()

  const PAGE_TITLE_KEYS = {
    '/inviter':         'pageTitles.myTasks',
    '/inviter/history': 'pageTitles.invitationHistory',
    '/security':        'pageTitles.securityReview',
    '/gatekeeper':      'pageTitles.gateEntry',
    '/admin':           'pageTitles.administration',
  }
  const pageTitle = t(PAGE_TITLE_KEYS[location.pathname] ?? 'pageTitles.visitorManagement')
  const drawerWidth = isMobile ? DRAWER_WIDTH : (collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH)

  const drawerContent = (
    <DrawerContent
      collapsed={!isMobile && collapsed}
      onToggle={() => setCollapsed(c => !c)}
      auth={auth} meta={meta} navItems={navItems} location={location}
      editMode={editMode} onEditToggle={toggleEditMode}
    />
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Desktop permanent drawer */}
      {!isMobile && (
        <Drawer variant="permanent" sx={{
          width: drawerWidth, flexShrink: 0, transition: 'width 0.2s ease',
          '& .MuiDrawer-paper': {
            width: drawerWidth, transition: 'width 0.2s ease',
            overflowX: 'hidden', boxSizing: 'border-box',
            border: 'none', borderRight: '1px solid', borderColor: 'divider',
            bgcolor: 'background.paper',
          },
        }}>
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile temporary drawer */}
      {isMobile && (
        <Drawer variant="temporary" open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: 'background.paper' } }}>
          {drawerContent}
        </Drawer>
      )}

      {/* Right: topbar + content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <AppBar position="sticky" elevation={0} sx={{ zIndex: theme.zIndex.drawer - 1 }}>
          <Toolbar sx={{ gap: 1.5 }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileDrawerOpen(true)} size="small">
                <MenuIcon />
              </IconButton>
            )}
            {!isMobile && collapsed && (
              <IconButton size="small" onClick={() => setCollapsed(false)}>
                <MenuIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary' }}>
              <Tx k={PAGE_TITLE_KEYS[location.pathname] ?? "pageTitles.visitorManagement"} />
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Chip label={meta.label} size="small" sx={{
              bgcolor: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
              fontWeight: 700, fontSize: '0.75rem', height: 22,
              display: { xs: 'none', sm: 'flex' },
            }} />
            <LanguageSwitcher />
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{
          flex: 1, p: { xs: '1rem', sm: '1.25rem 1.5rem' },
          maxWidth: 1400, width: '100%', mx: 'auto', alignSelf: 'stretch',
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
