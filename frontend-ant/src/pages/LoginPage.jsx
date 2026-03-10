import React, { useState, useEffect, useMemo } from 'react'
import {
  Card, Form, Input, Button, Typography, Alert, Divider,
  Space, Modal, Tooltip, Spin, Select, Radio, Tag,
} from 'antd'
import {
  UserOutlined, LockOutlined, SafetyOutlined,
  SafetyCertificateOutlined, CopyOutlined, CheckOutlined,
  PlusCircleOutlined, InfoCircleOutlined, CheckCircleFilled,
} from '@ant-design/icons'
import { useNavigate }   from 'react-router-dom'
import { useAuth }       from '../context/AuthContext'
import { useLicence }    from '../context/LicenceContext'
import { useTranslation } from 'react-i18next'
import {
  verifyIdentity, getUserGroups,
  getWebAdminUsers, createSuperheroAdmin,
  amISupervisor, amISecuritySupervisor, amIGatekeeperSupervisor,
  getAllUsersAsAdmin, resetPasswordToUserId,
  getLocations, getUsersByLocation,
} from '../api/operatonApi'
import LanguageSwitcher from '../components/LanguageSwitcher'
import WhyUsModal      from '../components/WhyUsModal'
import PocSummaryModal from '../components/PocSummaryModal'

const { Title, Text } = Typography

const GROUP_ROLE_MAP = {
  Invitors:  'INVITER',
  Security:  'SECURITY',
  Porters:   'GATEKEEPER',
  webAdmins: 'ADMIN',
}

const ROLE_FEATURE = { INVITER: 'inviter', SECURITY: 'security', GATEKEEPER: 'gatekeeper' }

const FEATURE_LABELS = {
  security:    'Security',
  inviter:     'Inviter',
  gatekeeper:  'Gatekeeper',
  gamification:'Gamification',
}

function LicenceStatusBox({ licenceLoaded, licenceMeta, featureActive }) {
  if (!licenceLoaded) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 8, marginBottom: 20,
        background: '#f6ffed', border: '1px solid #b7eb8f',
      }}>
        <InfoCircleOutlined style={{ color: '#52c41a', fontSize: 14, flexShrink: 0 }} />
        <Text style={{ fontSize: 12, color: '#389e0d' }}>
          PoC mode — no licence loaded, all features available
        </Text>
      </div>
    )
  }

  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8, marginBottom: 20,
      background: '#f0f5ff', border: '1px solid #adc6ff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <SafetyCertificateOutlined style={{ color: '#1677ff', fontSize: 14 }} />
        <Text style={{ fontSize: 12, fontWeight: 600, color: '#1677ff' }}>
          Licensed to: {licenceMeta.issuer}
        </Text>
        {licenceMeta.issuedAt && (
          <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
            {licenceMeta.issuedAt}
          </Text>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {Object.entries(FEATURE_LABELS).map(([key, label]) =>
          featureActive[key] ? (
            <Tag key={key} color="success" icon={<CheckCircleFilled />}
              style={{ fontSize: 11, margin: 0 }}>
              {label}
            </Tag>
          ) : (
            <Tag key={key} icon={<LockOutlined />}
              style={{ fontSize: 11, margin: 0, color: '#8c8c8c', borderColor: '#d9d9d9' }}>
              {label}
            </Tag>
          )
        )}
      </div>
    </div>
  )
}


function CredBadge({ label, value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 8,
      background: '#fafafa', border: '1px solid #e8e8e8',
    }}>
      <div>
        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>{label}</Text>
        <Text strong style={{ fontFamily: 'monospace', fontSize: 15, letterSpacing: 1 }}>{value}</Text>
      </div>
      <Tooltip title={copied ? 'Copied!' : 'Copy'}>
        <Button type="text" size="small"
          icon={copied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
          onClick={copy} />
      </Tooltip>
    </div>
  )
}

export default function LoginPage() {
  const [form] = Form.useForm()
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState('')
  const [checkingAdmin,    setCheckingAdmin]    = useState(true)
  const [hasAdminUser,     setHasAdminUser]     = useState(false)
  const [adminAccounts,    setAdminAccounts]    = useState([])
  const [creating,         setCreating]         = useState(false)
  const [createError,      setCreateError]      = useState('')
  const [createdModalOpen, setCreatedModalOpen] = useState(false)
  const [locations,        setLocations]        = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [locationUsers,    setLocationUsers]    = useState([])
  const [selectedRole,     setSelectedRole]     = useState(null)
  const [userSearch,       setUserSearch]       = useState('')
  const [quickLoading,     setQuickLoading]     = useState(false)
  const [whyUsOpen,        setWhyUsOpen]        = useState(false)
  const [pocSummaryLang,   setPocSummaryLang]   = useState(null)   // null | 'en' | 'de'

  const { login }  = useAuth()
  const navigate   = useNavigate()
  const { t }      = useTranslation()
  const { licenceLoaded, licenceMeta, featureActive } = useLicence()

  // Load locations + check for admin user on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [members, locs] = await Promise.all([getWebAdminUsers(), getLocations()])
        if (cancelled) return
        setAdminAccounts(members)
        setHasAdminUser(members.length > 0)
        setLocations(locs)
      } catch { /* non-critical */ }
      setCheckingAdmin(false)
    })()
    return () => { cancelled = true }
  }, [])

  // Derive available roles and filtered user list from loaded users
  const availableRoles = useMemo(() => {
    const present = new Set(locationUsers.map(u =>
      u.id.startsWith('inviter')    ? 'INVITER'    :
      u.id.startsWith('security')   ? 'SECURITY'   :
      u.id.startsWith('gatekeeper') ? 'GATEKEEPER' : null
    ).filter(Boolean))
    return ['INVITER', 'SECURITY', 'GATEKEEPER'].filter(r =>
      present.has(r) && featureActive[ROLE_FEATURE[r]]
    )
  }, [locationUsers, featureActive])

  const filteredUsers = useMemo(() => {
    const prefixMap = { INVITER: 'inviter', SECURITY: 'security', GATEKEEPER: 'gatekeeper' }
    let users = selectedRole
      ? locationUsers.filter(u => u.id.startsWith(prefixMap[selectedRole]))
      : locationUsers
    const q = userSearch.trim().toLowerCase()
    if (q) users = users.filter(u =>
      u.id.toLowerCase().includes(q) ||
      (u.firstName && u.firstName.toLowerCase().includes(q)) ||
      (u.lastName  && u.lastName.toLowerCase().includes(q))
    )
    return users
  }, [locationUsers, selectedRole, userSearch])

  // Load users for the selected location and reset their passwords
  useEffect(() => {
    if (selectedLocation == null) { setLocationUsers([]); setSelectedRole(null); setUserSearch(''); return }
    let cancelled = false
    setQuickLoading(true)
    setSelectedRole(null)
    setUserSearch('')
    ;(async () => {
      try {
        const users = await getUsersByLocation(selectedLocation)
        if (cancelled) return
        await Promise.allSettled(users.map(u => resetPasswordToUserId(u.id)))
        if (cancelled) return
        setLocationUsers(users)
      } catch { setLocationUsers([]) }
      setQuickLoading(false)
    })()
    return () => { cancelled = true }
  }, [selectedLocation])

  const loginWithCredentials = async (username, password) => {
    setError('')
    setLoading(true)
    try {
      const result = await verifyIdentity(username, password)
      if (!result.authenticated) { setError(t('login.invalidCredentials')); return }

      const credentials = { username, password }
      const groups      = await getUserGroups(credentials)
      const groupIds    = groups.map(g => g.id)

      let role = 'ADMIN'
      for (const [groupId, r] of Object.entries(GROUP_ROLE_MAP)) {
        if (groupIds.includes(groupId)) { role = r; break }
      }

      const isAlsoAdmin = groupIds.includes('webAdmins')
      let isSupervisor = false
      let isSecuritySupervisor = false
      let isGatekeeperSupervisor = false
      if (role === 'INVITER') {
        try { isSupervisor = (await amISupervisor({ ...credentials })).supervisor } catch {}
      }
      if (role === 'SECURITY') {
        try { isSecuritySupervisor = (await amISecuritySupervisor({ ...credentials })).supervisor } catch {}
      }
      if (role === 'GATEKEEPER') {
        try { isGatekeeperSupervisor = (await amIGatekeeperSupervisor({ ...credentials })).supervisor } catch {}
      }
      await login({ ...credentials, firstName: username, role, isAlsoAdmin, isSupervisor, isSecuritySupervisor, isGatekeeperSupervisor })
      const routes = { INVITER: '/inviter', SECURITY: '/security', GATEKEEPER: '/gatekeeper', ADMIN: '/admin' }
      navigate(routes[role] ?? '/inviter')
    } catch (err) {
      setError(err.response?.data?.message ?? t('login.serverError'))
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (values) => loginWithCredentials(values.username.trim(), values.password)

  const fillAccount = (acc) => {
    form.setFieldsValue({ username: acc.username, password: acc.password })
    setError('')
  }

  const handleCreateAdmin = async () => {
    setCreating(true); setCreateError('')
    try {
      await createSuperheroAdmin()
      const members = await getWebAdminUsers()
      setAdminAccounts(members); setHasAdminUser(true); setCreatedModalOpen(true)
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? 'Unknown error'
      if (msg.toLowerCase().includes('already') || err.response?.status === 500) {
        try { const m = await getWebAdminUsers(); setAdminAccounts(m); setHasAdminUser(m.length > 0) } catch {}
        setCreatedModalOpen(true)
      } else {
        setCreateError(t('login.failedToCreate', { error: msg }))
      }
    } finally { setCreating(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f5ff 0%, #f5f5f5 100%)',
      padding: 16, position: 'relative',
    }}>

      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <LanguageSwitcher />
      </div>

      <Space align="center" size={12} style={{ marginBottom: 32 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #1677ff, #0958d9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px #1677ff40',
        }}>
          <SafetyOutlined style={{ fontSize: 24, color: '#fff' }} />
        </div>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('login.title')}</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>{t('login.subtitle')}</Text>
        </div>
      </Space>

      <Card
        style={{ width: '100%', maxWidth: 420, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
        styles={{ body: { padding: 32 } }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div
            onClick={() => setWhyUsOpen(true)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer', padding: '8px 0', borderRadius: 8,
              background: 'linear-gradient(135deg, #0d111708, #0f204408)',
              border: '1px solid #1677ff20', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span style={{ fontSize: 15 }}>&#10024;</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#531dab', letterSpacing: 0.3 }}>
              {t('nav.whyUs')}
            </span>
          </div>
          <div
            onClick={() => setPocSummaryLang('en')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer', padding: '8px 0', borderRadius: 8,
              background: 'linear-gradient(135deg, #0d111708, #0f204408)',
              border: '1px solid #1677ff20', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span style={{ fontSize: 13 }}>🇬🇧</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1677ff', letterSpacing: 0.3 }}>
              PoC Journey
            </span>
          </div>
          <div
            onClick={() => setPocSummaryLang('de')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer', padding: '8px 0', borderRadius: 8,
              background: 'linear-gradient(135deg, #0d111708, #0f204408)',
              border: '1px solid #1677ff20', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span style={{ fontSize: 13 }}>🇩🇪</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#531dab', letterSpacing: 0.3 }}>
              PoC-Reise
            </span>
          </div>
        </div>
        <div style={{ marginBottom: 12 }} />

        <LicenceStatusBox
          licenceLoaded={licenceLoaded}
          licenceMeta={licenceMeta}
          featureActive={featureActive}
        />

        <Title level={5} style={{ marginBottom: 4 }}>{t('login.signIn')}</Title>
        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 24 }}>
          {t('login.useCredentials')}
        </Text>

        {error && (
          <Alert type="error" message={error} showIcon closable
            onClose={() => setError('')} style={{ marginBottom: 16 }} />
        )}

        <Form form={form} layout="vertical" onFinish={handleLogin} requiredMark={false}>
          <Form.Item name="username" rules={[{ required: true, message: '' }]} style={{ marginBottom: 12 }}>
            <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder={t('login.username')} size="large" autoFocus />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '' }]} style={{ marginBottom: 20 }}>
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder={t('login.password')} size="large" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" size="large" block
              loading={loading} style={{ fontWeight: 600 }}>
              {t('login.signIn')}
            </Button>
          </Form.Item>
        </Form>

        <Divider plain style={{ margin: '24px 0 8px', fontSize: 12, color: '#8c8c8c' }}>
          {t('login.quickFill')}
        </Divider>

        {/* Location selector */}
        <Tooltip
          title={
            <div style={{ fontSize: 12, lineHeight: 1.7 }}>
              <div><strong>Seeded test accounts per location</strong></div>
              <div>Inviters:    inviter[N]</div>
              <div>Gatekeepers: gatekeeper[N]</div>
              <div>Security:    security[N]</div>
              <div style={{ marginTop: 6, color: '#faad14' }}>
                Passwords are reset to the username on this page for convenience.
              </div>
            </div>
          }
          placement="top"
        >
          <Text style={{ color: '#ff4d4f', fontSize: 11, display: 'block', textAlign: 'center', marginBottom: 8, cursor: 'default', textDecoration: 'underline dotted' }}>
            This is for testing only!
          </Text>
        </Tooltip>

        <Select
          placeholder="Select a location…"
          value={selectedLocation}
          onChange={setSelectedLocation}
          allowClear
          onClear={() => setSelectedLocation(null)}
          style={{ width: '100%', marginBottom: 10 }}
          options={locations.map(l => ({ value: l.id, label: l.name }))}
        />

        {/* Role filter — shown once users are loaded */}
        {!quickLoading && locationUsers.length > 0 && (
          <Radio.Group
            value={selectedRole}
            onChange={e => { setSelectedRole(e.target.value); setUserSearch('') }}
            style={{ display: 'flex', marginBottom: 10 }}
          >
            {availableRoles.map(role => (
              <Radio.Button
                key={role}
                value={role}
                style={{ flex: 1, textAlign: 'center', fontSize: 12 }}
              >
                {role === 'INVITER' ? 'Inviter' : role === 'SECURITY' ? 'Security' : 'Gatekeeper'}
              </Radio.Button>
            ))}
          </Radio.Group>
        )}

        {/* Text search — shown after a role is selected */}
        {selectedRole && (
          <Input
            prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Search by username or name…"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            allowClear
            size="small"
            style={{ marginBottom: 10 }}
          />
        )}

        {/* User list for selected location */}
        {quickLoading ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}><Spin size="small" /></div>
        ) : selectedLocation != null && selectedRole && filteredUsers.length > 0 ? (
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            {filteredUsers.map(u => (
              <Button key={u.id} block size="small"
                onClick={() => loginWithCredentials(u.id, u.id)}
                loading={loading}
                style={{ textAlign: 'left', height: 'auto', padding: '8px 12px' }}>
                <Space>
                  <UserOutlined />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4 }}>{u.id}</div>
                    {(u.firstName || u.lastName) && (
                      <div style={{ fontSize: 11, color: '#8c8c8c', lineHeight: 1.3 }}>
                        {[u.firstName, u.lastName].filter(Boolean).join(' ')}
                      </div>
                    )}
                  </div>
                </Space>
              </Button>
            ))}
          </Space>
        ) : selectedLocation != null && selectedRole && !quickLoading ? (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center' }}>
            No users match.
          </Text>
        ) : selectedLocation != null && !quickLoading && locationUsers.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center' }}>
            No users assigned to this location.
          </Text>
        ) : null}

        {/* Create admin button (shown when no admin exists and no location selected) */}
        {!checkingAdmin && !hasAdminUser && selectedLocation == null && (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {createError && (
              <Alert type="error" message={createError} showIcon closable
                onClose={() => setCreateError('')} style={{ marginBottom: 8 }} />
            )}
            <Button block size="small" loading={creating} icon={<PlusCircleOutlined />}
              onClick={handleCreateAdmin}
              style={{
                textAlign: 'left', height: 'auto', padding: '8px 12px',
                borderColor: '#fa8c16', color: '#d46b08',
              }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4 }}>{t('login.createAdminUser')}</div>
                <div style={{ fontSize: 11, color: '#8c8c8c', lineHeight: 1.3 }}>{t('login.noAdminFound')}</div>
              </div>
            </Button>
          </Space>
        )}
      </Card>

      <Text type="secondary" style={{ marginTop: 24, fontSize: 12 }}>
        {t('login.cockpitPrefix')} ·{' '}
        <a href="http://localhost:8080/operaton/app/cockpit" target="_blank" rel="noreferrer"
          style={{ color: '#8c8c8c' }}>{t('login.cockpitLink')}</a>
      </Text>

      <WhyUsModal open={whyUsOpen} onClose={() => setWhyUsOpen(false)} />
      <PocSummaryModal open={!!pocSummaryLang} lang={pocSummaryLang ?? 'en'} onClose={() => setPocSummaryLang(null)} />

      <Modal
        open={createdModalOpen} onCancel={() => setCreatedModalOpen(false)}
        footer={null} width={380}
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 18 }} />
            {t('login.adminCreated')}
          </Space>
        }
      >
        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
          {t('login.adminCreatedDesc', { group: 'webAdmins' })}
        </Text>
        <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 16 }}>
          <CredBadge label={t('login.username')} value="superhero" />
          <CredBadge label={t('login.password')} value="superhero" />
        </Space>
        <Alert type="warning" showIcon message={t('login.changePassword')} style={{ marginBottom: 20 }} />
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => setCreatedModalOpen(false)}>{t('login.dismiss')}</Button>
          <Button type="primary" onClick={() => {
            setCreatedModalOpen(false)
            loginWithCredentials('superhero', 'superhero')
          }}>
            {t('login.fillAndSignIn')}
          </Button>
        </Space>
      </Modal>
    </div>
  )
}
