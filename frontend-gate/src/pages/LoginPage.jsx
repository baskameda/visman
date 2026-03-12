import React, { useState } from 'react'
import { Form, Input, Button, Toast } from 'antd-mobile'
import { useAuth } from '../context/AuthContext'
import { verifyIdentity, getUserGroups } from '../api/api'
import { getWeekVisits } from '../api/api'
import { saveVisits } from '../api/db'

function getWeekRange() {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    from: monday.toISOString().slice(0, 10),
    to:   sunday.toISOString().slice(0, 10),
  }
}

export default function LoginPage() {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async ({ username, password }) => {
    if (!username?.trim() || !password?.trim()) {
      Toast.show({ icon: 'fail', content: 'Enter username and password' })
      return
    }
    setLoading(true)
    try {
      // 1. Verify credentials
      const { authenticated } = await verifyIdentity(username.trim(), password.trim())
      if (!authenticated) {
        Toast.show({ icon: 'fail', content: 'Invalid credentials' })
        return
      }

      // 2. Check Porters group membership
      const creds = { username: username.trim(), password: password.trim() }
      const groups = await getUserGroups(creds)
      if (!groups.includes('Porters')) {
        Toast.show({ icon: 'fail', content: 'Access denied — Porters group required' })
        return
      }

      // 3. Pre-fetch current week visits and cache them for offline use
      try {
        const { from, to } = getWeekRange()
        const visits = await getWeekVisits(creds, from, to)
        saveVisits(visits)
      } catch {
        // No connection — cache stays empty; user will see empty state until online
      }

      await login(creds)
    } catch (e) {
      Toast.show({ icon: 'fail', content: e.response?.data?.message ?? e.message ?? 'Login failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 24px',
      background: 'linear-gradient(160deg, #531dab 0%, #7b3fbf 100%)',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <img src="/icon-192.svg" alt="Gate Check-In" style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 12 }} />
        <div style={{ color: 'white', fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Gate Check-In</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>Gatekeeper Mobile App</div>
      </div>

      {/* Form card */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '28px 20px',
        width: '100%',
        maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <Form
          layout="vertical"
          onFinish={handleSubmit}
          footer={
            <Button
              block type="submit"
              color="primary"
              size="large"
              loading={loading}
              style={{ '--background-color': '#531dab', '--border-color': '#531dab', borderRadius: 12 }}
            >
              Sign In
            </Button>
          }
        >
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input placeholder="e.g. gatekeeper1" autoCapitalize="none" autoCorrect="off" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input type="password" placeholder="Your password" />
          </Form.Item>
        </Form>
      </div>

      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
        Works offline · GPS check-ins · Auto-sync
      </div>
    </div>
  )
}
