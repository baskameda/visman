import React from 'react'
import { Tooltip, Skeleton, Typography, Progress } from 'antd'
import { FireOutlined, TrophyOutlined, CheckSquareOutlined, CalendarOutlined, FieldTimeOutlined } from '@ant-design/icons'
const { Text } = Typography

const MILESTONE_ICONS  = ['🔰','🚪','⭐','🎖️','👑']
const MILESTONE_COLORS = ['#8c8c8c','#1677ff','#d46b08','#531dab','#389e0d']
function StatCard({ icon, label, value, sub, color = '#531dab', tooltip }) {
  return (
    <Tooltip title={tooltip ?? ''} placement="top">
      <div style={{
        flex: 1, minWidth: 0, padding: '9px 10px', borderRadius: 8,
        border: `1px solid ${color}40`, background: `${color}08`,
        cursor: tooltip ? 'help' : 'default',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          <span style={{ color, fontSize: 11 }}>{icon}</span>
          <Text style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8c8c8c' }}>
            {label}
          </Text>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
        {sub && <Text style={{ fontSize: 10, color: '#8c8c8c', display: 'block', marginTop: 2 }}>{sub}</Text>}
      </div>
    </Tooltip>
  )
}

export default function GatekeeperStatsPanel({ stats, loading }) {
  if (loading) return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      {[1,2,3,4].map(i => <Skeleton.Input key={i} active style={{ flex: 1, height: 60, borderRadius: 8 }} />)}
    </div>
  )
  if (!stats) return null

  const { totalCheckins, todayCheckins,
          streak, onTimeRate, busiestHourLabel, milestone } = stats

  const mc = MILESTONE_COLORS[milestone.level] ?? '#8c8c8c'
  const mi = MILESTONE_ICONS[milestone.level]  ?? '🔰'
  const progress = milestone.next
    ? Math.min(100, Math.round(((totalCheckins - milestone.min) / (milestone.next - milestone.min)) * 100))
    : 100

  return (
    <div style={{ marginBottom: 0 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <StatCard icon={<CalendarOutlined />} label="Today" value={todayCheckins}
          sub={`of ${totalCheckins} total check-ins`} color="#531dab"
          tooltip="Visitors processed today vs all time" />
        <StatCard icon={<FireOutlined />} label="Streak"
          value={streak > 0 ? `${streak}d` : '—'}
          sub={streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''} in a row` : 'No active streak'}
          color={streak >= 7 ? '#cc0000' : streak >= 3 ? '#d46b08' : '#8c8c8c'}
          tooltip="Consecutive days on duty" />
        <StatCard icon={<CheckSquareOutlined />} label="On-time rate"
          value={onTimeRate !== null ? `${onTimeRate}%` : '—'}
          sub="check-ins on scheduled day"
          color={onTimeRate === null ? '#8c8c8c' : onTimeRate >= 80 ? '#389e0d' : onTimeRate >= 50 ? '#d46b08' : '#cc0000'}
          tooltip="% of visitors processed on their originally scheduled date" />
        <StatCard icon={<FieldTimeOutlined />} label="Peak hour" value={busiestHourLabel}
          sub="your busiest time slot" color="#1677ff"
          tooltip="Hour of day when you handle the most check-ins" />
      </div>
      {onTimeRate !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <Text style={{ fontSize: 10, color: '#8c8c8c', minWidth: 82 }}>On-time rate</Text>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#ffe7ba' }}>
            <div style={{
              width: `${onTimeRate}%`, height: '100%', borderRadius: 3, transition: 'width 0.6s ease',
              background: onTimeRate >= 80 ? '#52c41a' : onTimeRate >= 50 ? '#fa8c16' : '#ff4d4f',
            }} />
          </div>
          <Text style={{ fontSize: 10, color: '#8c8c8c', minWidth: 28, textAlign: 'right' }}>{onTimeRate}%</Text>
        </div>
      )}
      {milestone.next && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 10, color: '#8c8c8c', whiteSpace: 'nowrap', minWidth: 82 }}>
            {mi} {milestone.label}
          </Text>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: mc + '20' }}>
            <div style={{ width: `${progress}%`, height: '100%', borderRadius: 3, background: mc, transition: 'width 0.6s ease' }} />
          </div>
          <Text style={{ fontSize: 10, color: '#8c8c8c', minWidth: 28, textAlign: 'right' }}>{progress}%</Text>
        </div>
      )}
    </div>
  )
}
