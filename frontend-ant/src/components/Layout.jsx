import React, { useState } from 'react'
import { Layout as AntLayout, Menu, Button, Avatar, Tag, Tooltip, Drawer, Typography, Space } from 'antd'
import {
  MenuOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  LogoutOutlined, DashboardOutlined, FileTextOutlined,
  BookOutlined, HistoryOutlined, SafetyOutlined,
  BankOutlined, SettingOutlined, DownOutlined, UpOutlined,
  BulbOutlined, BulbFilled,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth }  from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import LanguageSwitcher   from './LanguageSwitcher'
import Tx                 from './Tx'
import DevLogsModal       from './DevLogsModal'
import TechDocsModal      from './TechDocsModal'
import SupportDocsModal   from './SupportDocsModal'
import SalesDocsModal     from './SalesDocsModal'

const { Sider, Header, Content } = AntLayout
const { Text } = Typography

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
    { key: '/inviter', labelKey: 'nav.myTasks', icon: <DashboardOutlined /> },
    { key: '/history', labelKey: 'nav.history', icon: <HistoryOutlined />   },
  ],
  SECURITY:   [{ key: '/security',   labelKey: 'nav.myTasks',   icon: <SafetyOutlined />  }],
  GATEKEEPER: [{ key: '/gatekeeper', labelKey: 'nav.gateEntry', icon: <BankOutlined />    }],
  ADMIN:      [{ key: '/admin',      labelKey: 'nav.dashboard', icon: <SettingOutlined /> }],
}

const PAGE_TITLE_KEYS = {
  '/inviter':    'pageTitles.myTasks',
  '/history':    'pageTitles.invitationHistory',
  '/security':   'pageTitles.securityReview',
  '/gatekeeper': 'pageTitles.gateEntry',
  '/admin':      'pageTitles.administration',
}

// ── Theme-aware colour helpers ─────────────────────────────────────────────────
function useColors(dark) {
  return {
    bg:        dark ? '#1f1f1f' : '#ffffff',
    bgLayout:  dark ? '#141414' : '#f5f5f5',
    border:    dark ? '#303030' : '#f0f0f0',
    textSub:   dark ? '#8c8c8c' : '#8c8c8c',
    textMain:  dark ? '#ffffff' : '#000000',
    hover:     dark ? '#ffffff0d' : '#f5f5f5',
    hoverSub:  dark ? '#ffffff0d' : '#f5f5f5',
  }
}

// ── Sidebar content ────────────────────────────────────────────────────────────
function SiderContent({ collapsed, auth, meta, navItems, onEditToggle, editMode, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t }    = useTranslation()
  const { dark } = useTheme()
  const c        = useColors(dark)

  const [docsOpen,    setDocsOpen]    = useState(false)
  const [devLogsOpen, setDevLogsOpen] = useState(false)
  const [techOpen,    setTechOpen]    = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [salesOpen,   setSalesOpen]   = useState(false)

  const initials = auth?.firstName
    ? auth.firstName.slice(0, 1).toUpperCase() + (auth.firstName.slice(1, 2) ?? '')
    : '?'

  const menuItems = navItems.map(item => ({
    key:   item.key,
    icon:  item.icon,
    label: !collapsed ? <Tx k={item.labelKey} /> : null,
    onClick: () => navigate(item.key),
  }))

  const rowStyle = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
    color: c.textSub, fontSize: 13, fontWeight: 500,
    transition: 'background 0.15s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: c.bg }}>

      {/* Logo row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 8, padding: collapsed ? '16px 0' : '16px 16px',
        borderBottom: `1px solid ${c.border}`, minHeight: 56, flexShrink: 0,
      }}>
        <Tooltip title={editMode ? 'Exit label edit' : 'Edit labels'} placement="right">
          <div onClick={onEditToggle} style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: editMode
              ? 'linear-gradient(135deg,#d46b08,#fa8c16)'
              : `linear-gradient(135deg, ${meta.color}, ${meta.color}99)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: editMode ? `0 0 0 3px ${meta.color}40` : 'none',
            transition: 'all 0.2s',
          }}>
            <DashboardOutlined style={{ color: '#fff', fontSize: 14 }} />
          </div>
        </Tooltip>
        {!collapsed && (
          <Text strong style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
            <Tx k="nav.visitorMgmt" />
          </Text>
        )}
      </div>

      {/* Role chip */}
      {!collapsed && (
        <div style={{ padding: '8px 16px 4px' }}>
          <Tag color={meta.color} style={{
            background: meta.bg, color: meta.color,
            border: `1px solid ${meta.border}`,
            fontWeight: 700, fontSize: 11,
          }}>
            {meta.label}
          </Tag>
        </div>
      )}

      {/* Nav */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          inlineCollapsed={collapsed}
          style={{ border: 'none', background: 'transparent' }}
          items={menuItems}
        />
      </div>

      {/* Dev Logs */}
      {!collapsed && (
        <div style={{ padding: '0 8px 2px' }}>
          <div
            onClick={() => setDevLogsOpen(true)}
            style={rowStyle}
            onMouseEnter={e => e.currentTarget.style.background = c.hover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <FileTextOutlined style={{ fontSize: 14 }} />
            <span>Dev. Logs</span>
          </div>
        </div>
      )}

      {/* Docs accordion */}
      {!collapsed && (
        <div style={{ padding: '0 8px 4px' }}>
          <div
            onClick={() => setDocsOpen(o => !o)}
            style={{ ...rowStyle, justifyContent: 'space-between' }}
            onMouseEnter={e => e.currentTarget.style.background = c.hover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Space size={8}>
              <BookOutlined style={{ fontSize: 14 }} />
              <span>Documentation</span>
            </Space>
            {docsOpen
              ? <UpOutlined   style={{ fontSize: 11 }} />
              : <DownOutlined style={{ fontSize: 11 }} />}
          </div>
          {docsOpen && (
            <div style={{ paddingLeft: 16 }}>
              {[
                { label: 'Tech Documentation',    action: () => setTechOpen(true)    },
                { label: 'Support Documentation', action: () => setSupportOpen(true) },
                { label: 'Sales & Marketing',     action: () => setSalesOpen(true)   },
              ].map(({ label, action }) => (
                <div key={label} onClick={action}
                  style={{ padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: c.textSub, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = c.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User + logout */}
      <div style={{
        borderTop: `1px solid ${c.border}`,
        padding: collapsed ? '12px 0' : '10px 12px',
        flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between', gap: 8,
      }}>
        <Space size={8} style={{ minWidth: 0 }}>
          <Avatar size={28} style={{ background: meta.color, fontSize: 11, flexShrink: 0 }}>
            {initials}
          </Avatar>
          {!collapsed && (
            <div style={{ minWidth: 0, lineHeight: 1.3 }}>
              <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {auth?.firstName ?? auth?.username}
              </div>
              <div style={{ fontSize: 11, color: c.textSub }}>{auth?.username}</div>
            </div>
          )}
        </Space>
        <Tooltip title={t('nav.signOut')} placement={collapsed ? 'right' : 'top'}>
          <Button
            type="text" size="small"
            icon={<LogoutOutlined style={{ fontSize: 13 }} />}
            onClick={onLogout}
            style={{ flexShrink: 0, borderRadius: 6 }}
            danger
          />
        </Tooltip>
      </div>

      <DevLogsModal     open={devLogsOpen}  onClose={() => setDevLogsOpen(false)}  />
      <TechDocsModal    open={techOpen}     onClose={() => setTechOpen(false)}      />
      <SupportDocsModal open={supportOpen}  onClose={() => setSupportOpen(false)}  />
      <SalesDocsModal   open={salesOpen}    onClose={() => setSalesOpen(false)}    />
    </div>
  )
}

// ── Main Layout ────────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const { auth, logout } = useAuth()
  const { dark, toggleDark } = useTheme()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { t }     = useTranslation()
  const c         = useColors(dark)

  const [collapsed,        setCollapsed]        = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [isMobile,         setIsMobile]         = useState(() => window.innerWidth < 768)
  const [editMode,         setEditMode]         = useState(false)

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const toggleEditMode = () => {
    const next = !editMode
    setEditMode(next)
    window.__labelEditMode = next
    window.dispatchEvent(new CustomEvent('labelEditModeChange', { detail: { active: next } }))
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const role    = auth?.role ?? 'INVITER'
  const colors  = ROLE_COLORS[role] ?? ROLE_COLORS.INVITER
  const meta    = { ...colors, label: t('roles.' + role) }

  const navItems = (() => {
    const base = NAV_DEF[role] ?? []
    if (auth?.isAlsoAdmin && role !== 'ADMIN') {
      return [{ key: '/admin', labelKey: 'nav.admin', icon: <SettingOutlined /> }, ...base]
    }
    return base
  })()

  const siderContent = (
    <SiderContent
      collapsed={!isMobile && collapsed}
      auth={auth} meta={meta} navItems={navItems}
      editMode={editMode} onEditToggle={toggleEditMode}
      onLogout={handleLogout}
    />
  )

  return (
    <AntLayout style={{ minHeight: '100vh' }}>

      {/* Desktop sider */}
      {!isMobile && (
        <Sider
          width={DRAWER_WIDTH}
          collapsedWidth={DRAWER_COLLAPSED}
          collapsed={collapsed}
          style={{
            background: c.bg,
            borderRight: `1px solid ${c.border}`,
            overflow: 'hidden',
            position: 'sticky', top: 0, height: '100vh',
          }}
        >
          {siderContent}
        </Sider>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          placement="left" width={DRAWER_WIDTH}
          styles={{ body: { padding: 0, background: c.bg } }}
          title={null} closable={false}
        >
          {siderContent}
        </Drawer>
      )}

      <AntLayout>
        {/* Header */}
        <Header style={{
          background: c.bg,
          borderBottom: `1px solid ${c.border}`,
          padding: '0 16px', display: 'flex', alignItems: 'center',
          gap: 12, position: 'sticky', top: 0, zIndex: 100, height: 52,
        }}>
          {isMobile ? (
            <Button type="text" icon={<MenuOutlined />}
              onClick={() => setMobileDrawerOpen(true)} size="small" />
          ) : (
            <Button type="text" size="small"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(c => !c)} />
          )}

          <Text strong style={{ fontSize: 15 }}>
            <Tx k={PAGE_TITLE_KEYS[location.pathname] ?? 'pageTitles.visitorManagement'} />
          </Text>

          <div style={{ flex: 1 }} />

          <Tag color={meta.color} style={{
            background: meta.bg, color: meta.color,
            border: `1px solid ${meta.border}`,
            fontWeight: 700, fontSize: 12, margin: 0,
          }}>
            {meta.label}
          </Tag>

          <LanguageSwitcher />

          {/* Dark mode toggle */}
          <Tooltip title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            <Button
              type="text"
              size="small"
              icon={dark
                ? <BulbFilled  style={{ fontSize: 16, color: '#faad14' }} />
                : <BulbOutlined style={{ fontSize: 16 }} />
              }
              onClick={toggleDark}
              style={{ borderRadius: 6 }}
            />
          </Tooltip>
        </Header>

        {/* Content */}
        <Content style={{
          padding: '20px 24px',
          background: c.bgLayout,
          minHeight: 'calc(100vh - 52px)',
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {children}
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
