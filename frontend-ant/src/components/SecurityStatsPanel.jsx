import React from 'react'
import { Tooltip, Skeleton, Typography, Tag, Progress } from 'antd'
import { FireOutlined, TrophyOutlined, SafetyOutlined, CalendarOutlined } from '@ant-design/icons'
const { Text } = Typography

const MILESTONE_ICONS  = ['🔰','⭐','🔍','🏅','🛡️']
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

export default function SecurityStatsPanel({ stats, loading }) {
  if (loading) return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      {[1,2,3,4,5].map(i => <Skeleton.Input key={i} active style={{ flex: 1, height: 80, borderRadius: 10 }} />)}
    </div>
  )
  if (!stats) return null

  const { totalReviews, todayReviews,
          approved, refused, approvalRate, reliabilityAvg, streak, milestone, scoreCount } = stats

  const mc = MILESTONE_COLORS[milestone.level] ?? '#8c8c8c'
  const mi = MILESTONE_ICONS[milestone.level]  ?? '🔰'
  const progress = milestone.next
    ? Math.min(100, Math.round(((totalReviews - milestone.min) / (milestone.next - milestone.min)) * 100))
    : 100

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <StatCard icon={<CalendarOutlined />} label="Today" value={todayReviews}
          sub={`of ${totalReviews} total reviews`} color="#1677ff"
          tooltip="Security reviews completed today vs all time" />
        <StatCard icon={<FireOutlined />} label="Streak"
          value={streak > 0 ? `${streak}d` : '—'}
          sub={streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''} in a row` : 'No active streak'}
          color={streak >= 7 ? '#cc0000' : streak >= 3 ? '#d46b08' : '#8c8c8c'}
          tooltip="Consecutive days with at least one completed review" />
        <StatCard icon={<SafetyOutlined />} label="Approvals"
          value={approvalRate !== null ? `${approvalRate}%` : '—'}
          sub={scoreCount > 0 ? `${approved} approved · ${refused} refused` : 'No scored reviews yet'}
          color={approvalRate === null ? '#8c8c8c' : approvalRate >= 70 ? '#389e0d' : approvalRate >= 40 ? '#d46b08' : '#cc0000'}
          tooltip="% of reviews where you assigned reliability ≥ 50" />
        <StatCard icon={<TrophyOutlined />} label="Rank"
          value={`${mi} ${milestone.label}`}
          sub={milestone.next ? `${totalReviews - milestone.min} / ${milestone.next - milestone.min} to ${milestone.nextLabel}` : 'Maximum rank!'}
          color={mc} tooltip="Rank up by completing more security reviews" />
      </div>
      {scoreCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Text style={{ fontSize: 11, color: '#8c8c8c', minWidth: 110 }}>Score distribution</Text>
          <div style={{ flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', background: '#ffccc7' }}>
            <div style={{ width: `${approvalRate}%`, height: '100%', background: '#52c41a', borderRadius: '4px 0 0 4px', transition: 'width 0.6s ease' }} />
          </div>
          <Tag color="success" style={{ margin: 0, fontSize: 11 }}>✓ {approved}</Tag>
          <Tag color="error"   style={{ margin: 0, fontSize: 11 }}>✗ {refused}</Tag>
          {reliabilityAvg !== null && <Tag style={{ margin: 0, fontSize: 11 }}>avg {reliabilityAvg}</Tag>}
        </div>
      )}
      {milestone.next && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 11, color: '#8c8c8c', whiteSpace: 'nowrap', minWidth: 110 }}>
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
