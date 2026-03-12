import React, { useState } from 'react'
import { Button, Form, Input, Toast } from 'antd-mobile'
import { EyeInvisibleOutline, EyeOutline, UserOutline, LockOutline } from 'antd-mobile-icons'
import { verifyIdentity, getUserGroups } from '../api/api'

export default function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [pwdVisible, setPwdVisible] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async () => {
    let values
    try { values = await form.validateFields() } catch { return }
    const { username, password } = values

    setLoading(true)
    try {
      const result = await verifyIdentity(username.trim(), password)
      if (!result.authenticated) {
        Toast.show({ icon: 'fail', content: 'Invalid username or password' })
        return
      }

      const credentials = { username: username.trim(), password }
      const groups = await getUserGroups(credentials)
      const groupIds = groups.map(g => g.id)

      if (!groupIds.includes('Security')) {
        Toast.show({ icon: 'fail', content: 'This app is for Security Officers only' })
        return
      }

      await onLogin(credentials)
    } catch {
      Toast.show({ icon: 'fail', content: 'Could not reach the server. Is the backend running?' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(160deg, #fff7e6 0%, #f5f5f5 100%)',
      padding: '24px 16px',
    }}>

      {/* Logo */}
      <div style={{
        width: 72, height: 72, borderRadius: 18,
        background: 'linear-gradient(135deg, #fa8c16, #d46b08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(250,140,22,0.35)',
        marginBottom: 20,
        fontSize: 36,
      }}>
        🛡️
      </div>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
          Security Checks
        </div>
        <div style={{ fontSize: 14, color: '#8c8c8c' }}>
          Visitor security review
        </div>
      </div>

      <div style={{
        width: '100%', maxWidth: 360,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '24px 20px',
      }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          footer={
            <Button
              block size="large" color="warning" fill="solid"
              loading={loading} type="submit"
              style={{ fontWeight: 600, marginTop: 8 }}
            >
              Sign in
            </Button>
          }
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Username is required' }]}
          >
            <Input
              placeholder="Username"
              prefix={<UserOutline style={{ color: '#bfbfbf' }} />}
              clearable
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input
              placeholder="Password"
              type={pwdVisible ? 'text' : 'password'}
              prefix={<LockOutline style={{ color: '#bfbfbf' }} />}
              suffix={
                <div onPointerDown={e => e.preventDefault()} onClick={() => setPwdVisible(v => !v)}
                  style={{ color: '#bfbfbf', padding: '0 4px', cursor: 'pointer' }}>
                  {pwdVisible ? <EyeOutline /> : <EyeInvisibleOutline />}
                </div>
              }
            />
          </Form.Item>
        </Form>
      </div>

    </div>
  )
}
