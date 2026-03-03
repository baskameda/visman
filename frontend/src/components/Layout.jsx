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
import { useAuth } from '../context/AuthContext'

const DRAWER_WIDTH     = 220
const DRAWER_COLLAPSED = 64

const ROLE_META = {
  INVITER:    { label: 'Inviter',    color: '#1677ff', bg: '#e6f4ff', border: '#91caff' },
  SECURITY:   { label: 'Security',   color: '#d46b08', bg: '#fff7e6', border: '#ffd591' },
  GATEKEEPER: { label: 'Gatekeeper', color: '#531dab', bg: '#f9f0ff', border: '#d3adf7' },
  ADMIN:      { label: 'Admin',      color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' },
}

const NAV = {
  INVITER:    [
    { label: 'My Tasks', path: '/inviter',         Icon: AssignmentIcon },
    { label: 'History',  path: '/inviter/history',  Icon: HistoryIcon   },
  ],
  SECURITY:   [{ label: 'My Tasks',   path: '/security',   Icon: SecurityIcon           }],
  GATEKEEPER: [{ label: 'Gate Entry', path: '/gatekeeper', Icon: MeetingRoomIcon        }],
  ADMIN:      [{ label: 'Dashboard',  path: '/admin',       Icon: AdminPanelSettingsIcon }],
}

function NavItem({ item, active, collapsed, roleColor }) {
  const effectiveColor = item.color ?? roleColor
  const navigate = useNavigate()
  return (
    <Tooltip title={collapsed ? item.label : ''} placement="right">
      <ListItemButton
        onClick={() => navigate(item.path)}
        sx={{
          mx: 0.75, mb: 0.25, borderRadius: 1.5, minHeight: 40,
          px: collapsed ? 0 : 1.25,
          justifyContent: collapsed ? 'center' : 'flex-start',
          position: 'relative',
          color:  active ? effectiveColor : 'text.secondary',
          bgcolor: active ? alpha(effectiveColor, 0.08) : 'transparent',
          '&::before': active ? {
            content: '""', position: 'absolute',
            left: 0, top: '20%', height: '60%', width: 3,
            borderRadius: '0 2px 2px 0', bgcolor: effectiveColor,
          } : {},
          '&:hover': {
            bgcolor: active ? alpha(effectiveColor, 0.12) : 'action.hover',
            color: active ? effectiveColor : 'text.primary',
          },
          transition: 'all 0.15s ease',
        }}
      >
        <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 32, color: 'inherit', '& svg': { fontSize: 18 } }}>
          <item.Icon />
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{ fontSize: '0.857rem', fontWeight: active ? 700 : 500, lineHeight: 1.3 }}
          />
        )}
      </ListItemButton>
    </Tooltip>
  )
}

function DrawerContent({ collapsed, onToggle, auth, meta, navItems, location }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
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
          <Box sx={{
            width: 28, height: 28, borderRadius: 1.5, flexShrink: 0,
            background: `linear-gradient(135deg, ${meta.color} 0%, ${alpha(meta.color, 0.65)} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <DashboardIcon sx={{ color: '#fff', fontSize: 15 }} />
          </Box>
          {!collapsed && (
            <Typography variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Visitor Mgmt
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
          {navItems.map((item, idx) => (
            <React.Fragment key={item.path}>
              <NavItem
                item={item}
                active={location.pathname === item.path}
                collapsed={collapsed}
                roleColor={meta.color}
              />
              {item.isAdmin && navItems.length > 1 && (
                <Box sx={{ mx: 1.5, my: 0.75 }}>
                  <Box sx={{ height: '1px', bgcolor: 'divider' }} />
                </Box>
              )}
            </React.Fragment>
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
            <Tooltip title="Sign out">
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
          <Tooltip title="Sign out" placement="right">
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

  const role     = auth?.role ?? 'INVITER'
  const meta     = ROLE_META[role] ?? ROLE_META.INVITER
  const navItems = [
    ...(auth?.isAlsoAdmin ? [{ label: 'Admin', path: '/admin', Icon: AdminPanelSettingsIcon, isAdmin: true, color: '#389e0d' }] : []),
    ...(NAV[role] ?? []),
  ]

  const PAGE_TITLES = {
    '/inviter':         'My Tasks',
    '/inviter/history': 'Invitation History',
    '/security':        'Security Review',
    '/gatekeeper':      'Gate Entry',
    '/admin':           'Administration',
  }
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Visitor Management'
  const drawerWidth = isMobile ? DRAWER_WIDTH : (collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH)

  const drawerContent = (
    <DrawerContent
      collapsed={!isMobile && collapsed}
      onToggle={() => setCollapsed(c => !c)}
      auth={auth} meta={meta} navItems={navItems} location={location}
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
              {pageTitle}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Chip label={meta.label} size="small" sx={{
              bgcolor: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
              fontWeight: 700, fontSize: '0.75rem', height: 22,
              display: { xs: 'none', sm: 'flex' },
            }} />
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
