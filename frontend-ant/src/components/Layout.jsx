import React, { useState, useEffect } from 'react'
import { Layout as AntLayout, Menu, Button, Avatar, Tag, Tooltip, Drawer, Typography, Space, Divider, Modal } from 'antd'
import {
  MenuOutlined, MenuFoldOutlined, MenuUnfoldOutlined, ClockCircleOutlined,
  LogoutOutlined, DashboardOutlined, FileTextOutlined,
  BookOutlined, HistoryOutlined, SafetyOutlined,
  BankOutlined, SettingOutlined, DownOutlined, UpOutlined,
  BulbOutlined, BulbFilled, LoginOutlined, TeamOutlined, EnvironmentOutlined,
  QuestionCircleOutlined, TrophyOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth }    from '../context/AuthContext'
import { useTheme }   from '../context/ThemeContext'
import { useHelp }    from '../context/HelpContext'
import { useLicence } from '../context/LicenceContext'
import LanguageSwitcher   from './LanguageSwitcher'
import Tx                 from './Tx'
import DevLogsModal       from './DevLogsModal'
import TechDocsModal      from './TechDocsModal'
import SupportDocsModal   from './SupportDocsModal'
import SalesDocsModal     from './SalesDocsModal'
import RoleAdoptionModal  from './RoleAdoptionModal'
import QATestPlanModal          from './QATestPlanModal'
import QATestPlanSecurityModal  from './QATestPlanSecurityModal'
import QATestPlanGatekeeperModal from './QATestPlanGatekeeperModal'
import QATestPlanAdminModal     from './QATestPlanAdminModal'
import ReleaseTestSummaryModal  from './ReleaseTestSummaryModal'

const { Sider, Header, Content } = AntLayout
const { Text } = Typography

const DRAWER_WIDTH     = 220
const DRAWER_COLLAPSED = 64

const ROLE_COLORS = {
  // color   = used for Avatar bg, gradient, hover, menu — original brand hue
  // textColor = used for Tag text — darker shade that passes WCAG AA on the bg
  INVITER:    { color: '#1677ff', bg: '#e6f4ff', border: '#91caff', textColor: '#003eb3' },
  SECURITY:   { color: '#d46b08', bg: '#fff7e6', border: '#ffd591', textColor: '#873800' },
  GATEKEEPER: { color: '#531dab', bg: '#f9f0ff', border: '#d3adf7', textColor: '#22075e' },
  ADMIN:      { color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f', textColor: '#135200' },
}

const NAV_DEF = {
  INVITER:    [
    { key: '/inviter',     labelKey: 'nav.myTasks',       icon: <DashboardOutlined /> },
    { key: '/history',     labelKey: 'nav.history',       icon: <HistoryOutlined />   },
    { key: '/performance', labelKey: 'nav.myPerformance', icon: <TrophyOutlined />    },
  ],
  SECURITY:   [
    { key: '/security',    labelKey: 'nav.myTasks',       icon: <SafetyOutlined />    },
    { key: '/performance', labelKey: 'nav.myPerformance', icon: <TrophyOutlined />    },
  ],
  GATEKEEPER: [
    { key: '/gatekeeper',  labelKey: 'nav.gateEntry',     icon: <BankOutlined />      },
    { key: '/performance', labelKey: 'nav.myPerformance', icon: <TrophyOutlined />    },
  ],
  ADMIN:      [
    { key: '/admin',            labelKey: 'nav.dashboard',       icon: <SettingOutlined />              },
    { key: '/locations',        labelKey: 'nav.locations',        icon: <EnvironmentOutlined />          },
    { key: '/entrances',        labelKey: 'nav.entrances',        icon: <LoginOutlined />                },
    { key: '/supervisor-admin', labelKey: 'nav.supervisorAdmin',  icon: <TeamOutlined />                 },
    { key: '/licence',          label:    'Licence Mgmt',         icon: <SafetyCertificateOutlined />    },
  ],
}

// Values starting with 'pageTitles.' are i18n keys; plain strings are used as-is.
const PAGE_TITLE_KEYS = {
  '/inviter':    'pageTitles.myTasks',
  '/history':    'pageTitles.invitationHistory',
  '/security':   'pageTitles.securityReview',
  '/gatekeeper': 'pageTitles.gateEntry',
  '/admin':            'pageTitles.administration',
  '/locations':        'pageTitles.locations',
  '/entrances':        'pageTitles.entrances',
  '/supervisor-admin': 'pageTitles.supervisorAdmin',
  '/performance':      'pageTitles.myPerformance',
  '/licence':          'Licence Management',
}

// ── Session countdown (updates every minute) ───────────────────────────────────
const SESSION_MS = 9 * 60 * 60 * 1000

function useSessionTimer() {
  const compute = () => {
    const loginAt = parseInt(localStorage.getItem('loginAt') ?? '0', 10)
    if (!loginAt) return null
    const rem = loginAt + SESSION_MS - Date.now()
    if (rem <= 0) return null
    const totalMin = Math.ceil(rem / 60000)
    return { h: Math.floor(totalMin / 60), m: totalMin % 60, totalMin }
  }
  const [time, setTime] = useState(compute)
  // Cat 7: allow external callers to force an immediate re-read of localStorage
  const refresh = React.useCallback(() => setTime(compute()), []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = setInterval(() => setTime(compute()), 60000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return { time, refresh }
}

// ── Theme-aware colour helpers ─────────────────────────────────────────────────
function useColors(dark) {
  return {
    bg:        dark ? '#1f1f1f' : '#ffffff',
    bgLayout:  dark ? '#141414' : '#f5f5f5',
    border:    dark ? '#303030' : '#f0f0f0',
    // Cat 2: #8c8c8c on white = 3.37:1 (fails AA). Use #6b6b6b light / #a0a0a0 dark.
    textSub:   dark ? '#a0a0a0' : '#6b6b6b',
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
  const { dark }          = useTheme()
  const c                 = useColors(dark)
  const { featureActive } = useLicence()

  const [docsOpen,         setDocsOpen]         = useState(false)
  const [devLogsOpen,      setDevLogsOpen]      = useState(false)
  const [techOpen,         setTechOpen]         = useState(false)
  const [supportOpen,      setSupportOpen]      = useState(false)
  const [salesOpen,        setSalesOpen]        = useState(false)
  const [roleAdoptOpen,    setRoleAdoptOpen]    = useState(false)
  const [qaOpen,           setQaOpen]           = useState(false)
  const [relSummaryOpen,   setRelSummaryOpen]   = useState(false)

  const initials = auth?.firstName
    ? auth.firstName.slice(0, 1).toUpperCase() + (auth.firstName.slice(1, 2) ?? '')
    : '?'

  // Hide nav entries whose feature is currently unlicensed
  const ITEM_FEATURE = {
    '/inviter':    'inviter',
    '/history':    'inviter',
    '/security':   'security',
    '/gatekeeper': 'gatekeeper',
    '/performance':'gamification',
  }

  const menuItems = navItems
    .filter(item => {
      const feat = ITEM_FEATURE[item.key]
      return !feat || featureActive[feat]
    })
    .map(item => ({
      key:   item.key,
      icon:  item.icon,
      label: !collapsed ? (item.label ?? <Tx k={item.labelKey} />) : null,
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
            background: meta.bg, color: meta.textColor,
            border: `1px solid ${meta.border}`,
            fontWeight: 700, fontSize: 11,
          }}>
            {meta.label}
          </Tag>
        </div>
      )}

      {/* Nav — Cat 1: explicit <nav> landmark */}
      <nav aria-label="Main navigation" style={{ flex: 1, overflow: 'hidden' }}>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          inlineCollapsed={collapsed}
          style={{ border: 'none', background: 'transparent' }}
          items={menuItems}
        />
      </nav>

      {/* Role Adoption page */}
      {!collapsed && auth?.role && auth.role !== 'ADMIN' && (
        <div style={{ padding: '0 8px 2px' }}>
          <div
            onClick={() => setRoleAdoptOpen(true)}
            style={{ ...rowStyle, color: meta.color, fontWeight: 600 }}
            onMouseEnter={e => e.currentTarget.style.background = meta.bg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 13 }}>&#9733;</span>
            <span>{t(`roleAdoption.${auth.role.toLowerCase()}.link`)}</span>
          </div>
        </div>
      )}

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
                { label: 'QA Notes: How to test this page',  action: () => setQaOpen(true)         },
                { label: 'What Was Tested (Support Summary)', action: () => setRelSummaryOpen(true) },
                { label: 'Tech Documentation',               action: () => setTechOpen(true)        },
                { label: 'Support Documentation',            action: () => setSupportOpen(true)     },
                { label: 'Sales & Marketing',                action: () => setSalesOpen(true)       },
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
            aria-label={t('nav.signOut')}
            danger
          />
        </Tooltip>
      </div>

      {auth?.role === 'SECURITY'   && <QATestPlanSecurityModal   open={qaOpen} onClose={() => setQaOpen(false)} />}
      {auth?.role === 'GATEKEEPER' && <QATestPlanGatekeeperModal open={qaOpen} onClose={() => setQaOpen(false)} />}
      {auth?.role === 'ADMIN'      && <QATestPlanAdminModal      open={qaOpen} onClose={() => setQaOpen(false)} />}
      {(!auth?.role || auth.role === 'INVITER') && <QATestPlanModal open={qaOpen} onClose={() => setQaOpen(false)} />}
      <ReleaseTestSummaryModal open={relSummaryOpen} onClose={() => setRelSummaryOpen(false)} role={auth?.role} />
      <RoleAdoptionModal open={roleAdoptOpen} onClose={() => setRoleAdoptOpen(false)} role={auth?.role} />
      <DevLogsModal     open={devLogsOpen}  onClose={() => setDevLogsOpen(false)}  />
      <TechDocsModal    open={techOpen}     onClose={() => setTechOpen(false)}      />
      <SupportDocsModal open={supportOpen}  onClose={() => setSupportOpen(false)}  />
      <SalesDocsModal   open={salesOpen}    onClose={() => setSalesOpen(false)}    />
    </div>
  )
}

// ── Main Layout ────────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const { auth, logout, extendSession } = useAuth()
  const { dark, toggleDark } = useTheme()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { t }     = useTranslation()
  const c         = useColors(dark)

  const { sections }                   = useHelp()
  const { time: sessionTime,
          refresh: refreshSessionTimer } = useSessionTimer()
  const [collapsed,        setCollapsed]        = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [isMobile,         setIsMobile]         = useState(() => window.innerWidth < 768)
  const [editMode,         setEditMode]         = useState(false)
  const [helpOpen,         setHelpOpen]         = useState(false)
  // Cat 7: session timeout warning state
  const [sessionWarnDismissed, setSessionWarnDismissed] = useState(false)
  const sessionWarningOpen = !!sessionTime && sessionTime.totalMin <= 5 && !sessionWarnDismissed

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Cat 1: update document.title on navigation
  React.useEffect(() => {
    const key = PAGE_TITLE_KEYS[location.pathname] ?? 'pageTitles.visitorManagement'
    const label = key.startsWith('pageTitles.') ? t(key) : key
    document.title = `${label} – VisMan`
  }, [location.pathname, t])

  // Cat 7: reset dismiss flag when a new session starts
  React.useEffect(() => {
    setSessionWarnDismissed(false)
  }, [auth?.username])

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

  const handleExtendSession = () => {
    extendSession()
    refreshSessionTimer()
  }

  return (
    <>
    {/* Cat 1: skip link — visible only on keyboard focus */}
    <a href="#main-content" className="sr-only skip-link">Skip to main content</a>

    {/* Cat 7: session expiry warning modal */}
    <Modal
      open={sessionWarningOpen}
      title="Session expiring soon"
      onCancel={() => setSessionWarnDismissed(true)}
      footer={[
        <Button key="logout" danger onClick={() => { logout(); navigate('/login') }}>
          Log out now
        </Button>,
        <Button key="extend" type="primary" onClick={handleExtendSession}>
          Extend session
        </Button>,
      ]}
      width={400}
    >
      <p style={{ marginTop: 8 }}>
        Your session will expire in <strong>{sessionTime?.totalMin ?? 0} minute{sessionTime?.totalMin !== 1 ? 's' : ''}</strong>.
        Extend it to stay logged in, or log out now to save your work.
      </p>
    </Modal>

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
              onClick={() => setMobileDrawerOpen(true)} size="small"
              aria-label="Open navigation menu" />
          ) : (
            <Button type="text" size="small"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(c => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} />
          )}

          <Text strong style={{ fontSize: 15 }}>
            {(() => {
              const v = PAGE_TITLE_KEYS[location.pathname] ?? 'pageTitles.visitorManagement'
              return v.startsWith('pageTitles.') ? <Tx k={v} /> : v
            })()}
          </Text>

          <div style={{ flex: 1 }} />

          <Tag color={meta.color} style={{
            background: meta.bg, color: meta.textColor,
            border: `1px solid ${meta.border}`,
            fontWeight: 700, fontSize: 12, margin: 0,
          }}>
            {meta.label}
          </Tag>

          {sessionTime && (
            <Tooltip title={t('session.timeLeft') + ' ' + (sessionTime.h > 0 ? `${sessionTime.h}h ${sessionTime.m}m` : `${sessionTime.m}m`)}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 500, lineHeight: 1,
                color: sessionTime.totalMin < 10 ? '#ff4d4f'
                     : sessionTime.totalMin < 30 ? '#fa8c16'
                     : c.textSub,
                cursor: 'default',
              }}>
                <ClockCircleOutlined style={{ fontSize: 13 }} />
                <span>{sessionTime.h > 0 ? `${sessionTime.h}h ${sessionTime.m}m` : `${sessionTime.m}m`}</span>
              </div>
            </Tooltip>
          )}

          <LanguageSwitcher />

          {/* Contextual help */}
          {sections && (
            <Tooltip title="How to use this page">
              <Button
                type="text"
                size="small"
                icon={<QuestionCircleOutlined style={{ fontSize: 16 }} />}
                onClick={() => setHelpOpen(true)}
                style={{ borderRadius: 6 }}
                aria-label="How to use this page"
              />
            </Tooltip>
          )}

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
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            />
          </Tooltip>
        </Header>

        {/* Content — Cat 1: <main> landmark for skip link target */}
        <Content
          id="main-content"
          role="main"
          style={{
            padding: '20px 24px',
            background: c.bgLayout,
            minHeight: 'calc(100vh - 52px)',
          }}
        >
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {children}
          </div>
        </Content>
      </AntLayout>

      {/* Contextual help drawer */}
      <Drawer
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={
          <Space>
            <QuestionCircleOutlined style={{ color: '#1677ff' }} />
            <span>How to use this page</span>
          </Space>
        }
        placement="right"
        width={360}
        styles={{ body: { padding: '16px 24px' } }}
      >
        {sections?.map((s, i) => (
          <div key={s.title}>
            {i > 0 && <Divider style={{ margin: '16px 0' }} />}
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: c.textMain }}>
              {s.title}
            </div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {s.items.map(item => (
                <li key={item} style={{ fontSize: 13, marginBottom: 5, color: '#595959', lineHeight: 1.5 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Drawer>
    </AntLayout>
    </>
  )
}
