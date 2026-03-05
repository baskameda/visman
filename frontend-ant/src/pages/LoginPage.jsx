import React, { useState, useEffect } from 'react'
import {
  Card, Form, Input, Button, Typography, Alert, Divider,
  Space, Modal, Tooltip, Spin,
} from 'antd'
import {
  UserOutlined, LockOutlined, SafetyOutlined,
  SafetyCertificateOutlined, CopyOutlined, CheckOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons'
import { useNavigate }   from 'react-router-dom'
import { useAuth }       from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import {
  verifyIdentity, getUserGroups,
  getWebAdminUsers, createSuperheroAdmin, amISupervisor,
} from '../api/operatonApi'
import LanguageSwitcher from '../components/LanguageSwitcher'

const { Title, Text } = Typography

const GROUP_ROLE_MAP = {
  Invitors:  'INVITER',
  Security:  'SECURITY',
  Porters:   'GATEKEEPER',
  webAdmins: 'ADMIN',
}

const ROLE_ACCOUNTS = [
  { username: 'inviter1',    password: 'inviter123',  roleKey: 'INVITER'    },
  { username: 'security1',   password: 'security123', roleKey: 'SECURITY'   },
  { username: 'gatekeeper1', password: 'porter123',   roleKey: 'GATEKEEPER' },
]

const ROLE_COLORS = {
  INVITER:    '#1677ff',
  SECURITY:   '#d46b08',
  GATEKEEPER: '#531dab',
  ADMIN:      '#389e0d',
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

  const { login }  = useAuth()
  const navigate   = useNavigate()
  const { t }      = useTranslation()

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

  const handleLogin = async (values) => {
    setError('')
    setLoading(true)
    try {
      const result = await verifyIdentity(values.username.trim(), values.password)
      if (!result.authenticated) { setError(t('login.invalidCredentials')); return }

      const credentials = { username: values.username.trim(), password: values.password }
      const groups      = await getUserGroups(credentials)
      const groupIds    = groups.map(g => g.id)

      let role = 'ADMIN'
      for (const [groupId, r] of Object.entries(GROUP_ROLE_MAP)) {
        if (groupIds.includes(groupId)) { role = r; break }
      }

      const isAlsoAdmin = groupIds.includes('webAdmins')
      let isSupervisor = false
      if (role === 'INVITER') {
        try { isSupervisor = (await amISupervisor({ ...credentials })).supervisor } catch {}
      }
      login({ ...credentials, firstName: credentials.username, role, isAlsoAdmin, isSupervisor })
      const routes = { INVITER: '/inviter', SECURITY: '/security', GATEKEEPER: '/gatekeeper', ADMIN: '/admin' }
      navigate(routes[role] ?? '/inviter')
    } catch (err) {
      setError(err.response?.data?.message ?? t('login.serverError'))
    } finally {
      setLoading(false)
    }
  }

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

        <Divider plain style={{ margin: '24px 0', fontSize: 12, color: '#8c8c8c' }}>
          {t('login.quickFill')}
        </Divider>

        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {ROLE_ACCOUNTS.map(acc => (
            <Button key={acc.username} block size="small" onClick={() => fillAccount(acc)}
              style={{
                textAlign: 'left', height: 'auto', padding: '8px 12px',
                borderColor: ROLE_COLORS[acc.roleKey] + '60', color: ROLE_COLORS[acc.roleKey],
              }}>
              <Space>
                <UserOutlined />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4 }}>{acc.username}</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c', lineHeight: 1.3 }}>{t('roles.' + acc.roleKey)}</div>
                </div>
              </Space>
            </Button>
          ))}

          {checkingAdmin ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}><Spin size="small" /></div>
          ) : hasAdminUser ? (
            adminAccounts.map(u => (
              <Button key={u.id} block size="small"
                onClick={() => fillAccount({ username: u.id, password: u.id === 'superhero' ? 'test123' : 'admin' })}
                style={{
                  textAlign: 'left', height: 'auto', padding: '8px 12px',
                  borderColor: ROLE_COLORS.ADMIN + '60', color: ROLE_COLORS.ADMIN,
                }}>
                <Space>
                  <SafetyCertificateOutlined />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4 }}>{u.id}</div>
                    <div style={{ fontSize: 11, color: '#8c8c8c', lineHeight: 1.3 }}>{t('roles.ADMIN')}</div>
                  </div>
                </Space>
              </Button>
            ))
          ) : (
            <div>
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
            </div>
          )}
        </Space>
      </Card>

      <Text type="secondary" style={{ marginTop: 24, fontSize: 12 }}>
        {t('login.cockpitPrefix')} ·{' '}
        <a href="http://localhost:8080/operaton/app/cockpit" target="_blank" rel="noreferrer"
          style={{ color: '#8c8c8c' }}>{t('login.cockpitLink')}</a>
      </Text>

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
          <CredBadge label={t('login.password')} value="test123" />
        </Space>
        <Alert type="warning" showIcon message={t('login.changePassword')} style={{ marginBottom: 20 }} />
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => setCreatedModalOpen(false)}>{t('login.dismiss')}</Button>
          <Button type="primary" onClick={() => {
            setCreatedModalOpen(false)
            fillAccount({ username: 'superhero', password: 'test123' })
          }}>
            {t('login.fillAndSignIn')}
          </Button>
        </Space>
      </Modal>
    </div>
  )
}
