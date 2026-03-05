import React, { useState } from 'react'
import { Card, Skeleton, Tooltip, Progress, Tag, Button, Modal, Form, Input, Typography, Space, Row, Col } from 'antd'
import {
  DashboardOutlined, CalendarOutlined, TrophyOutlined, FlagOutlined,
  SettingOutlined, UpOutlined, DownOutlined,
  ArrowUpOutlined, ArrowDownOutlined, MinusOutlined,
} from '@ant-design/icons'

const { Text } = Typography

function MiniCard({ icon, label, value, sub, color = '#1677ff', tooltip }) {
  return (
    <Tooltip title={tooltip ?? ''} placement="top">
      <div style={{
        flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 8,
        border: `1px solid ${color}33`, background: `${color}06`,
        cursor: tooltip ? 'help' : 'default',
      }}>
        <Space size={4} style={{ marginBottom: 4 }}>
          <span style={{ color, fontSize: 13 }}>{icon}</span>
          <Text style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, color: '#8c8c8c' }}>
            {label}
          </Text>
        </Space>
        <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
        {sub && <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{sub}</Text>}
      </div>
    </Tooltip>
  )
}

function ChallengeConfigModal({ open, onClose, onSave }) {
  const [form] = Form.useForm()
  const handleSave = () => {
    const vals = form.getFieldsValue()
    if (!vals.target || isNaN(Number(vals.target))) return
    localStorage.setItem('org_challenge', JSON.stringify({
      label: vals.label || 'Monthly Challenge',
      target: Number(vals.target),
      deadline: vals.deadline || null,
    }))
    onSave(); onClose()
  }
  const handleClear = () => { localStorage.removeItem('org_challenge'); onSave(); onClose() }
  return (
    <Modal open={open} onCancel={onClose} title="Configure Seasonal Challenge" footer={null} width={380}>
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item name="label" label="Challenge label">
          <Input placeholder="e.g. March Visitor Sprint" />
        </Form.Item>
        <Form.Item name="target" label="Target (completed visits)" required>
          <Input type="number" />
        </Form.Item>
        <Form.Item name="deadline" label="Deadline (optional)">
          <Input placeholder="e.g. 31 Mar 2026" />
        </Form.Item>
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button danger onClick={handleClear}>Clear challenge</Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSave}>Save</Button>
        </Space>
      </Form>
    </Modal>
  )
}

export default function OrgStatsPanel({ stats, loading, onRefresh, isAdmin = false }) {
  const [expanded,      setExpanded]      = useState(false)
  const [challengeOpen, setChallengeOpen] = useState(false)

  if (loading) return (
    <Card style={{ marginBottom: 20, borderRadius: 10 }} styles={{ body: { padding: 12 } }}>
      <Row gutter={12}>
        {[1,2,3,4].map(i => <Col key={i} span={6}><Skeleton.Input active style={{ width: '100%', height: 68 }} /></Col>)}
      </Row>
    </Card>
  )
  if (!stats) return null

  const { healthScore, healthGrade, healthColor, totalProcesses, completedProcesses,
          weeklyDigest, leaderboard, challenge } = stats

  const weekTrend = weeklyDigest.thisWeek - weeklyDigest.lastWeek
  const TrendIcon = weekTrend > 0 ? ArrowUpOutlined : weekTrend < 0 ? ArrowDownOutlined : MinusOutlined
  const trendColor = weekTrend > 0 ? '#389e0d' : weekTrend < 0 ? '#cc0000' : '#8c8c8c'

  return (
    <Card
      style={{ marginBottom: 20, borderRadius: 10, overflow: 'hidden' }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', background: '#fafafa', borderBottom: expanded ? '1px solid #f0f0f0' : 'none',
      }}>
        <Space size={8}>
          <DashboardOutlined style={{ fontSize: 14, color: '#8c8c8c' }} />
          <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8c8c8c' }}>
            Organisation Dashboard
          </Text>
          <Tag style={{ height: 18, fontSize: 11, fontWeight: 800, background: healthColor + '18', color: healthColor, border: `1px solid ${healthColor}33`, lineHeight: '16px', padding: '0 6px' }}>
            Grade {healthGrade}
          </Tag>
        </Space>
        <Space size={4}>
          {isAdmin && (
            <Tooltip title="Configure challenge">
              <Button type="text" size="small" icon={<SettingOutlined style={{ fontSize: 13 }} />}
                onClick={() => setChallengeOpen(true)} />
            </Tooltip>
          )}
          <Button type="text" size="small"
            icon={expanded ? <UpOutlined style={{ fontSize: 12 }} /> : <DownOutlined style={{ fontSize: 12 }} />}
            onClick={() => setExpanded(e => !e)} />
        </Space>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 10, padding: 12, flexWrap: 'wrap' }}>
        <MiniCard
          icon={<DashboardOutlined />} label="Process health"
          value={healthScore !== null ? `${healthScore.toFixed(1)}h avg` : '—'}
          sub={`Grade ${healthGrade} · ${completedProcesses} completed`}
          color={healthColor}
          tooltip="Average hours from invitation start to completed check-in."
        />
        <MiniCard
          icon={<CalendarOutlined />} label="This week"
          value={weeklyDigest.thisWeek}
          sub={<span style={{ color: trendColor }}><TrendIcon style={{ fontSize: 11 }} /> {weekTrend > 0 ? '+' : ''}{weekTrend} vs last week</span>}
          color="#531dab"
          tooltip="Visitor processes started this week vs last week"
        />
        <MiniCard
          icon={<TrophyOutlined />} label="Total visits"
          value={totalProcesses}
          sub={`Busiest: ${weeklyDigest.busiestDay}`}
          color="#1677ff"
          tooltip="Total process instances. Busiest day of week in last 30 days."
        />
        {challenge && (
          <MiniCard
            icon={<FlagOutlined />} label={challenge.label}
            value={`${challenge.current} / ${challenge.target}`}
            sub={challenge.deadline ? `Deadline: ${challenge.deadline}` : `${challenge.progress}% complete`}
            color={challenge.progress >= 100 ? '#389e0d' : challenge.progress >= 60 ? '#d46b08' : '#1677ff'}
            tooltip="Seasonal challenge progress"
          />
        )}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {/* Leaderboard */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <Text style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8c8c8c', display: 'block', marginBottom: 8 }}>
              Top Inviters — This Month
            </Text>
            {leaderboard.length === 0
              ? <Text type="secondary" style={{ fontSize: 12 }}>No data yet</Text>
              : leaderboard.map(({ name, count }, i) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ minWidth: 18, fontWeight: 700, fontSize: 12 }}>
                    {['🥇','🥈','🥉','4.','5.'][i]}
                  </span>
                  <Text style={{ flex: 1, fontSize: 12, fontWeight: i === 0 ? 700 : 400 }}>{name}</Text>
                  <Tag style={{ fontSize: 11, fontWeight: 700, margin: 0 }}>{count}</Tag>
                </div>
              ))
            }
          </div>

          {/* Weekly digest */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <Text style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8c8c8c', display: 'block', marginBottom: 8 }}>
              Weekly Digest
            </Text>
            {[
              ['Started this week',  weeklyDigest.thisWeek],
              ['Started last week',  weeklyDigest.lastWeek],
              ['Busiest day (30d)',   weeklyDigest.busiestDay],
              ['Fastest completion',  weeklyDigest.fastestHours !== null ? `${weeklyDigest.fastestHours.toFixed(1)}h` : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{k}</Text>
                <Text strong style={{ fontSize: 12 }}>{v}</Text>
              </div>
            ))}
          </div>

          {/* Challenge progress */}
          {challenge && (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text strong style={{ fontSize: 12 }}>{challenge.label}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{challenge.current} / {challenge.target} completed</Text>
              </div>
              <Progress
                percent={challenge.progress} showInfo={false} size="small"
                strokeColor={challenge.progress >= 100 ? '#389e0d' : '#1677ff'}
              />
              {challenge.progress >= 100 && (
                <Text style={{ color: '#389e0d', fontWeight: 700, fontSize: 12 }}>🎉 Challenge complete!</Text>
              )}
            </div>
          )}
        </div>
      )}

      <ChallengeConfigModal open={challengeOpen} onClose={() => setChallengeOpen(false)} onSave={onRefresh} />
    </Card>
  )
}
