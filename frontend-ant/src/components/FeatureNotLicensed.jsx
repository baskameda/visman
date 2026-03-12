import React from 'react'
import { Result, Button } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from './Layout'

const FEATURE_LABELS = {
  security:     'Security Review',
  inviter:      'Invitation Management',
  gatekeeper:   'Gate Entry',
  gamification: 'Performance & Gamification',
}

export default function FeatureNotLicensed({ feature }) {
  const { auth }  = useAuth()
  const navigate  = useNavigate()

  const home = !auth                         ? '/login'
    : auth.role === 'SECURITY'               ? '/security'
    : auth.role === 'GATEKEEPER'             ? '/gatekeeper'
    : auth.role === 'ADMIN'                  ? '/admin'
    : '/inviter'

  const label = FEATURE_LABELS[feature] ?? feature

  return (
    <Layout>
      <Result
        icon={<LockOutlined style={{ color: '#d46b08', fontSize: 56 }} />}
        title="Feature not licensed"
        subTitle={
          <>
            The <strong>{label}</strong> feature is not enabled in the current licence.
            <br />
            Contact your vendor to enable it.
          </>
        }
        extra={
          <Button type="primary" onClick={() => navigate(home)}>
            Return to dashboard
          </Button>
        }
      />
    </Layout>
  )
}
