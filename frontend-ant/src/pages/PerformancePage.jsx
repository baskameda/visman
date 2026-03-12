import React from 'react'
import { Typography, Button, Space, Divider } from 'antd'
import { TrophyOutlined, ReloadOutlined } from '@ant-design/icons'
import Layout               from '../components/Layout'
import { useAuth }          from '../context/AuthContext'
import { usePageHelp }      from '../hooks/usePageHelp'
import InviterStatsPanel    from '../components/InviterStatsPanel'
import OrgStatsPanel        from '../components/OrgStatsPanel'
import SecurityStatsPanel   from '../components/SecurityStatsPanel'
import GatekeeperStatsPanel from '../components/GatekeeperStatsPanel'
import { useInviterStats }    from '../hooks/useInviterStats'
import { useOrgStats }        from '../hooks/useOrgStats'
import { useSecurityStats }   from '../hooks/useSecurityStats'
import { useGatekeeperStats } from '../hooks/useGatekeeperStats'

const { Title, Text } = Typography

const HELP_SECTIONS = [
  {
    title: 'Performance metrics',
    items: [
      'Stats are calculated from your completed activity — invitations, reviews, or check-ins depending on your role.',
      'Streak counts consecutive days with at least one completed action.',
      'Rank advances automatically as your total count grows.',
    ],
  },
  {
    title: 'Milestone progress',
    items: [
      'The progress bar shows how close you are to the next rank.',
      'Ranks: 🌱 Newcomer → ⭐ Regular → 🏅 Expert → 🏆 Master → 💎 Legend.',
      'Keep it up — every action counts!',
    ],
  },
]

// ── Role-specific panels ───────────────────────────────────────────────────────

function InviterPerf({ auth }) {
  const { stats, loading, refresh } = useInviterStats(auth)
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button size="small" icon={<ReloadOutlined />} onClick={refresh} loading={loading}>Refresh</Button>
      </div>
      <InviterStatsPanel stats={stats} loading={loading} />
    </>
  )
}

function SecurityPerf({ auth }) {
  const { stats: orgStats, loading: orgLoading, refresh: orgRefresh } = useOrgStats(auth)
  const { stats: secStats, loading: secLoading, refresh: secRefresh } = useSecurityStats(auth)
  const refreshAll = () => { orgRefresh?.(); secRefresh?.() }
  const loading    = orgLoading || secLoading
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button size="small" icon={<ReloadOutlined />} onClick={refreshAll} loading={loading}>Refresh</Button>
      </div>
      <OrgStatsPanel
        stats={orgStats} loading={orgLoading} onRefresh={orgRefresh}
        isAdmin={auth?.isAlsoAdmin ?? false}
      />
      <Divider style={{ margin: '16px 0' }} />
      <SecurityStatsPanel stats={secStats} loading={secLoading} />
    </>
  )
}

function GatekeeperPerf({ auth }) {
  const { stats, loading, refresh } = useGatekeeperStats(auth)
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button size="small" icon={<ReloadOutlined />} onClick={refresh} loading={loading}>Refresh</Button>
      </div>
      <GatekeeperStatsPanel stats={stats} loading={loading} />
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const { auth } = useAuth()
  usePageHelp(HELP_SECTIONS)

  const role = auth?.role ?? 'INVITER'

  return (
    <Layout>
      <div style={{ maxWidth: 900 }}>
        <Space align="center" style={{ marginBottom: 24 }}>
          <TrophyOutlined style={{ fontSize: 22, color: '#d46b08' }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>My Performance</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {role === 'INVITER'    && 'Your invitation activity and ranking'}
              {role === 'SECURITY'   && 'Your security review activity and ranking'}
              {role === 'GATEKEEPER' && 'Your check-in activity and ranking'}
            </Text>
          </div>
        </Space>

        {role === 'INVITER'    && <InviterPerf    auth={auth} />}
        {role === 'SECURITY'   && <SecurityPerf   auth={auth} />}
        {role === 'GATEKEEPER' && <GatekeeperPerf auth={auth} />}
      </div>
    </Layout>
  )
}
