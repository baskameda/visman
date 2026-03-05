import React from 'react'
import { Tooltip, Skeleton, Typography, Row, Col } from 'antd'
import { FireOutlined, TrophyOutlined, CheckCircleOutlined, TeamOutlined } from '@ant-design/icons'
const { Text } = Typography

const MILESTONE_ICONS  = ['🌱','⭐','🏅','🏆','💎']
const MILESTONE_COLORS = ['#8c8c8c','#1677ff','#d46b08','#531dab','#389e0d']

function StatCard({ icon, label, value, sub, color = '#1677ff', tooltip }) {
  return (
    <Tooltip title={tooltip ?? ''} placement="top">
      <div style={{
        flex: 1, minWidth: 0, padding: '12px 14px', borderRadius: 10,
        border: `1px solid ${color}40`, background: `${color}08`,
        cursor: tooltip ? 'help' : 'default',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ color }}>{icon}</span>
          <Text style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8c8c8c' }}>
            {label}
          </Text>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
        {sub && <Text style={{ fontSize: 11, color: '#8c8c8c', display: 'block', marginTop: 2 }}>{sub}</Text>}
      </div>
    </Tooltip>
  )
}

export default function InviterStatsPanel({ stats, loading }) {
  if (loading) return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      {[1,2,3,4].map(i => <Skeleton.Input key={i} active style={{ flex: 1, height: 80, borderRadius: 10 }} />)}
    </div>
  )
  if (!stats) return null

  const { total, approvalRate, approvalBadge, streak, milestone } = stats
  const mc = MILESTONE_COLORS[milestone.level] ?? '#8c8c8c'
  const mi = MILESTONE_ICONS[milestone.level]  ?? '🌱'
  const progress = milestone.next
    ? Math.min(100, Math.round(((total - milestone.min) / (milestone.next - milestone.min)) * 100))
    : 100

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <StatCard icon={<TeamOutlined />} label="Invitations" value={total}
          sub="all time" color="#1677ff" tooltip="Total invitations you have started" />
        <StatCard icon={<FireOutlined />} label="Streak"
          value={streak > 0 ? `${streak}d` : '—'}
          sub={streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''} in a row` : 'No active streak'}
          color={streak >= 7 ? '#cc0000' : streak >= 3 ? '#d46b08' : '#8c8c8c'}
          tooltip="Consecutive days you started at least one invitation" />
        <StatCard icon={<CheckCircleOutlined />} label="Approval"
          value={approvalRate !== null ? `${approvalRate}%` : '—'}
          sub={approvalBadge?.label ?? 'No data yet'}
          color={approvalBadge?.color ?? '#8c8c8c'}
          tooltip="% of your completed visits where security scored ≥ 50" />
        <StatCard icon={<TrophyOutlined />} label="Rank"
          value={`${mi} ${milestone.label}`}
          sub={milestone.next ? `${progress}% to ${milestone.nextLabel}` : 'Max level!'}
          color={mc} tooltip="Rank up by sending more invitations" />
      </div>
      {milestone.next && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 11, color: '#8c8c8c', whiteSpace: 'nowrap', minWidth: 120 }}>
            Next: {MILESTONE_ICONS[milestone.level + 1]} {milestone.nextLabel}
          </Text>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: mc + '20' }}>
            <div style={{ width: `${progress}%`, height: '100%', borderRadius: 3, background: mc, transition: 'width 0.6s ease' }} />
          </div>
          <Text style={{ fontSize: 11, color: '#8c8c8c', minWidth: 32, textAlign: 'right' }}>{progress}%</Text>
        </div>
      )}
    </div>
  )
}
